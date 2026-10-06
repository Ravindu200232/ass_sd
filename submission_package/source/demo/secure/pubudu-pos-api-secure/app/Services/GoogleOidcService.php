<?php
// app/Services/GoogleOidcService.php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Google OpenID Connect - Authorization Code flow with PKCE.
 *
 * WHY THIS IS HAND-ROLLED RATHER THAN SOCIALITE
 * ---------------------------------------------
 * Laravel Socialite would do the code exchange in one line, but it does not
 * verify the ID token's signature or claims - it reads the userinfo endpoint
 * instead. For an assignment about secure software development the interesting
 * part IS the verification, so every check is written out and commented here:
 * signature, issuer, audience, expiry, issued-at, nonce, email_verified and an
 * optional hosted-domain restriction.
 *
 * WHY AUTHORIZATION CODE + PKCE, NOT IMPLICIT
 * -------------------------------------------
 * The Implicit grant returns the token in the URL fragment, where it lands in
 * browser history, in `Referer` headers and in any logging proxy on the path.
 * OAuth 2.1 removes it for exactly that reason. The Authorization Code flow
 * returns a short-lived, single-use code instead, and PKCE (RFC 7636) binds
 * that code to the browser that started the flow: an attacker who intercepts
 * the code cannot redeem it without the `code_verifier`, which never leaves
 * that browser until the exchange.
 *
 * PKCE is applied even though this is a confidential client holding a client
 * secret, because the secret protects the BACKEND's identity, not the
 * authorization code in transit. Defence in depth; it is also what OAuth 2.1
 * requires of all clients.
 *
 * THE THREE RANDOM VALUES, AND WHY EACH IS NEEDED
 * -----------------------------------------------
 *   state          CSRF. Ties the callback to a flow this server started, so a
 *                  third party cannot feed a victim a crafted callback URL and
 *                  log them into the ATTACKER's account (session fixation).
 *   nonce          Replay. Embedded in the ID token by Google and checked on
 *                  return, so a token captured from one sign-in cannot be
 *                  submitted again for another.
 *   code_verifier  PKCE. Proves the party redeeming the code is the party that
 *                  requested it.
 *
 * state and nonce live in the cache server-side for five minutes and are
 * DELETED when consumed, so a callback can be replayed at most once.
 */
class GoogleOidcService
{
    private const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    /** Google's two documented issuer values. */
    private const VALID_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

    /** How long a started flow may take to come back. */
    private const FLOW_TTL_SECONDS = 300;

    /** Clock skew tolerated when checking exp/iat. */
    private const LEEWAY_SECONDS = 60;

    /**
     * Begin a sign-in: generate the one-time values, stash them server-side and
     * build the authorize URL.
     *
     * @return array{authorize_url:string, state:string}
     */
    public function beginFlow(): array
    {
        $this->assertConfigured();

        $state = Str::random(40);
        $nonce = Str::random(40);

        // RFC 7636 s4.1: 43-128 characters from the unreserved set.
        $codeVerifier = Str::random(96);

        // S256, never "plain". A "plain" challenge is the verifier itself, so
        // anyone who sees the authorize request also has it.
        $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');

        // The verifier is held SERVER-side, keyed by state. The usual
        // browser-side PKCE arrangement keeps it in the SPA, but this app has a
        // backend that is already a confidential client, and anything kept in
        // the browser is reachable by XSS. Nothing secret is handed to the page.
        Cache::put($this->cacheKey($state), [
            'nonce' => $nonce,
            'code_verifier' => $codeVerifier,
            'created_at' => now()->toIso8601String(),
        ], self::FLOW_TTL_SECONDS);

        $params = [
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.redirect'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'nonce' => $nonce,
            'code_challenge' => $codeChallenge,
            'code_challenge_method' => 'S256',
            // Ask Google to show the account chooser rather than silently
            // reusing whichever account the browser last used - this is a shared
            // shop terminal.
            'prompt' => 'select_account',
        ];

        if ($domain = config('services.google.hosted_domain')) {
            // A hint to Google's UI only. It is NOT a security control: the `hd`
            // claim on the returned ID token is what gets enforced, in
            // verifyIdToken() below.
            $params['hd'] = $domain;
        }

        return [
            'authorize_url' => self::AUTHORIZE_URL . '?' . http_build_query($params),
            'state' => $state,
        ];
    }

    /**
     * Consume a state value, returning the flow data, or null if it is unknown,
     * expired or already used.
     *
     * Deleting on read is what makes a callback single-use.
     */
    public function consumeFlow(string $state): ?array
    {
        $key = $this->cacheKey($state);
        $flow = Cache::get($key);

        if ($flow) {
            Cache::forget($key);
        }

        return $flow;
    }

    /**
     * Exchange the authorization code for tokens.
     *
     * @return array<string,mixed>
     *
     * @throws RuntimeException
     */
    public function exchangeCode(string $code, string $codeVerifier): array
    {
        $this->assertConfigured();

        $response = Http::asForm()
            ->timeout(15)
            ->post(self::TOKEN_URL, [
                'code' => $code,
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => config('services.google.redirect'),
                'grant_type' => 'authorization_code',
                'code_verifier' => $codeVerifier,
            ]);

        if ($response->failed()) {
            // Google's error body can echo request parameters, so it is logged
            // by the caller but never returned to the browser.
            throw new RuntimeException(
                'Token exchange failed: ' . ($response->json('error_description') ?? $response->json('error') ?? 'unknown error')
            );
        }

        $payload = $response->json();

        if (empty($payload['id_token'])) {
            throw new RuntimeException('Token exchange returned no id_token.');
        }

        return $payload;
    }

    /**
     * Verify a Google ID token and return its claims.
     *
     * This is the security boundary of the whole feature: everything the
     * application believes about who signed in comes from here.
     *
     * @return array<string,mixed>
     *
     * @throws RuntimeException
     */
    public function verifyIdToken(string $idToken, string $expectedNonce): array
    {
        // 1. SIGNATURE.
        //    Verified against Google's published JWKS. Without this, anyone
        //    could mint a token claiming to be the owner's email address -
        //    a JWT is just base64 until its signature is checked.
        //
        //    JWT::$leeway tolerates clock skew on exp/iat, which the library
        //    enforces internally as part of decode().
        JWT::$leeway = self::LEEWAY_SECONDS;

        try {
            $keys = JWK::parseKeySet($this->fetchJwks());
            $claims = (array) JWT::decode($idToken, $keys);
        } catch (\Throwable $e) {
            throw new RuntimeException('ID token signature verification failed: ' . $e->getMessage());
        }

        // 2. ISSUER. Confirms Google minted it, not some other provider whose
        //    key set happens to be reachable.
        if (! in_array($claims['iss'] ?? '', self::VALID_ISSUERS, true)) {
            throw new RuntimeException('ID token has an unexpected issuer.');
        }

        // 3. AUDIENCE. Confirms the token was minted FOR THIS APPLICATION.
        //    Without this check, a token legitimately issued to any other Google
        //    OAuth client could be replayed here - the signature would be
        //    perfectly valid. This is the single most commonly omitted check in
        //    hand-written OIDC code.
        if (($claims['aud'] ?? null) !== config('services.google.client_id')) {
            throw new RuntimeException('ID token was issued for a different application.');
        }

        // 4. EXPIRY / ISSUED-AT. decode() already enforces these; re-checked
        //    explicitly so the failure is legible and so a token minted far in
        //    the future is refused too.
        $now = time();

        if (! isset($claims['exp']) || $claims['exp'] + self::LEEWAY_SECONDS < $now) {
            throw new RuntimeException('ID token has expired.');
        }

        if (isset($claims['iat']) && $claims['iat'] - self::LEEWAY_SECONDS > $now) {
            throw new RuntimeException('ID token was issued in the future.');
        }

        // 5. NONCE. Binds the token to the flow this server started. Blocks
        //    replay of a token captured from a previous sign-in.
        if (! isset($claims['nonce']) || ! hash_equals($expectedNonce, (string) $claims['nonce'])) {
            throw new RuntimeException('ID token nonce does not match this sign-in attempt.');
        }

        // 6. EMAIL PRESENT AND VERIFIED.
        //    email_verified matters: on a consumer Google account an
        //    unverified address proves nothing about who controls it, and the
        //    address is what this application matches a staff record on.
        if (empty($claims['email'])) {
            throw new RuntimeException('ID token contains no email address.');
        }

        if (($claims['email_verified'] ?? false) !== true) {
            throw new RuntimeException('The Google account\'s email address is not verified.');
        }

        // 7. HOSTED DOMAIN, when configured. Enforced on the CLAIM, not on the
        //    `hd` request parameter, which is only a UI hint and is trivially
        //    removed from the authorize URL by the user.
        $required = config('services.google.hosted_domain');

        if ($required && ($claims['hd'] ?? null) !== $required) {
            throw new RuntimeException('Only ' . $required . ' accounts may sign in.');
        }

        // 8. SUBJECT. The stable per-account identifier this system keys on.
        if (empty($claims['sub'])) {
            throw new RuntimeException('ID token contains no subject.');
        }

        return $claims;
    }

    /**
     * Google's JWKS, cached.
     *
     * Cached for an hour because Google rotates these keys regularly and a
     * hard-coded copy would break sign-in at the next rotation; not cached
     * forever, for the same reason. On a fetch failure the previous key set is
     * NOT reused from a stale cache - failing sign-in is better than verifying
     * against keys that may have been revoked.
     *
     * @return array<string,mixed>
     */
    private function fetchJwks(): array
    {
        return Cache::remember('google.oidc.jwks', 3600, function () {
            $response = Http::timeout(10)->get(self::JWKS_URL);

            if ($response->failed() || empty($response->json('keys'))) {
                throw new RuntimeException('Could not retrieve Google signing keys.');
            }

            return $response->json();
        });
    }

    private function cacheKey(string $state): string
    {
        // The state is hashed into the key so a raw one-time value is not used
        // verbatim as a cache key, which may be logged by some cache drivers.
        return 'google.oidc.flow.' . hash('sha256', $state);
    }

    public function isConfigured(): bool
    {
        return ! empty(config('services.google.client_id'))
            && ! empty(config('services.google.client_secret'))
            && ! empty(config('services.google.redirect'));
    }

    private function assertConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException(
                'Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.'
            );
        }
    }
}

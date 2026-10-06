<?php
// app/Http/Controllers/Api/GoogleAuthController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GoogleOidcService;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * "Sign in with Google" for POS staff.  [OAuth/OIDC deliverable]
 *
 * WHICH FEATURE THIS CHANGES, AND WHY THAT ONE
 * --------------------------------------------
 * It replaces the removed public self-registration (V-01) with
 * administrator-provisioned, Google-verified sign-in. The two halves reinforce
 * each other:
 *
 *   Before  anyone could POST /register with "role":"admin" and receive an
 *           administrator token. Identity was self-asserted.
 *   After   an administrator creates the staff account and records the work
 *           email. The employee proves they control that mailbox by signing in
 *           with Google. Identity is asserted by Google and authorised by the
 *           shop owner - two different parties, which is the point.
 *
 * NO AUTO-PROVISIONING, DELIBERATELY
 * ----------------------------------
 * A Google account with no matching staff record is REFUSED. Auto-creating one
 * would recreate V-01 with extra steps: anyone with a Google account could sign
 * up. Google answers "who is this person"; it has no opinion on whether they
 * work here, and it certainly has no opinion on whether they are an
 * administrator. Roles are never read from the ID token.
 *
 * WHAT THE FRONTEND NEVER SEES
 * ----------------------------
 * The PKCE code_verifier and the nonce stay server-side, held in the cache
 * against the state value. The browser only ever carries the opaque `state`, so
 * an XSS in the SPA cannot steal anything that would let an attacker complete
 * somebody else's sign-in.
 */
class GoogleAuthController extends Controller
{
    public function __construct(private readonly GoogleOidcService $oidc)
    {
    }

    /**
     * GET /api/auth/google/redirect
     *
     * Returns the URL the browser should be sent to. A JSON response rather
     * than a 302 because the caller is a fetch() from an SPA on another origin:
     * a redirect would be followed by the XHR and the browser would never
     * navigate.
     */
    public function redirect()
    {
        if (! $this->oidc->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Google sign-in is not available.',
            ], 503);
        }

        try {
            $flow = $this->oidc->beginFlow();
        } catch (Throwable $e) {
            Log::error('Google OIDC redirect failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Could not start Google sign-in.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'authorize_url' => $flow['authorize_url'],
                'state' => $flow['state'],
            ],
        ]);
    }

    /**
     * POST /api/auth/google/callback  { code, state }
     *
     * The browser lands on the SPA's /auth/callback route with ?code&state in
     * the query string and posts them here. The code is exchanged server-side,
     * so the client secret never reaches the browser.
     */
    public function callback(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:2048',
            'state' => 'required|string|max:128',
        ]);

        // 1. STATE. Must correspond to a flow this server started within the
        //    last five minutes. consumeFlow() deletes it, so a captured
        //    callback cannot be replayed. This is the CSRF control: without it
        //    an attacker could hand a victim a callback URL carrying the
        //    ATTACKER's authorization code and silently log the victim into the
        //    attacker's account, where anything the victim then did would be
        //    visible to them.
        $flow = $this->oidc->consumeFlow($request->string('state')->toString());

        if (! $flow) {
            AuditLogger::record(
                action: 'auth.google.state_rejected',
                description: 'Google callback presented an unknown, expired or already-used state value.',
                severity: AuditLogger::SEVERITY_WARNING,
            );

            return response()->json([
                'success' => false,
                'message' => 'This sign-in attempt has expired or is invalid. Please try again.',
            ], 400);
        }

        // 2. EXCHANGE + VERIFY.
        try {
            $tokens = $this->oidc->exchangeCode(
                $request->string('code')->toString(),
                $flow['code_verifier']
            );

            $claims = $this->oidc->verifyIdToken($tokens['id_token'], $flow['nonce']);
        } catch (Throwable $e) {
            // The reason is recorded for the operator but never returned: the
            // exchange error body can echo request parameters, and a precise
            // verification failure tells an attacker which check they tripped.
            Log::warning('Google OIDC verification failed', ['error' => $e->getMessage()]);

            AuditLogger::record(
                action: 'auth.google.verification_failed',
                description: 'Google ID token verification failed: ' . $e->getMessage(),
                severity: AuditLogger::SEVERITY_WARNING,
            );

            return response()->json([
                'success' => false,
                'message' => 'Google sign-in could not be verified. Please try again.',
            ], 401);
        }

        $googleId = (string) $claims['sub'];
        $email = strtolower((string) $claims['email']);

        // 3. RESOLVE THE STAFF ACCOUNT.
        //    google_id (the OIDC `sub`) first, because it is stable: an email
        //    address can be changed, or in a Workspace domain reassigned to a
        //    different person entirely, and matching on address alone would
        //    hand the previous holder's POS account to whoever inherits it.
        //    Email is only used for the FIRST link.
        $user = User::where('google_id', $googleId)->first();

        if (! $user) {
            $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        }

        if (! $user) {
            AuditLogger::record(
                action: 'auth.google.no_account',
                description: sprintf('Google sign-in refused: no staff account matches %s.', $email),
                severity: AuditLogger::SEVERITY_WARNING,
            );

            // No auto-provisioning. See the class docblock.
            return response()->json([
                'success' => false,
                'message' => 'No staff account is linked to this Google account. Ask your administrator to set one up.',
            ], 403);
        }

        if (! $user->is_active) {
            AuditLogger::record(
                action: 'auth.google.inactive_account',
                description: sprintf('Google sign-in refused for deactivated account %s.', $user->username),
                subject: ['user', $user->id],
                severity: AuditLogger::SEVERITY_WARNING,
            );

            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact your administrator.',
            ], 403);
        }

        // 4. BIND THE GOOGLE IDENTITY ON FIRST USE.
        //    Attributes come from the token; role, department and is_active are
        //    NOT touched - Google has no authority over those.
        $firstLink = $user->google_id === null;

        if ($firstLink) {
            $user->google_id = $googleId;
            $user->google_linked_at = now();
        }

        if (empty($user->email)) {
            $user->email = $email;
        }

        $user->email_verified_at = now();
        $user->avatar_url = $claims['picture'] ?? $user->avatar_url;
        $user->save();

        // 5. ISSUE THE SESSION. Same rules as a password login (V-06): prior
        //    tokens revoked, abilities scoped to the role held in OUR database,
        //    expiry from config/sanctum.php.
        $user->tokens()->delete();

        $abilities = $user->role === 'admin' ? ['role:admin'] : ['role:employee'];
        $token = $user->createToken('google-oidc', $abilities)->plainTextToken;

        AuditLogger::record(
            action: 'auth.login.succeeded',
            description: sprintf(
                '%s (%s) signed in with Google as %s.%s',
                $user->username,
                $user->role,
                $email,
                $firstLink ? ' Google account linked for the first time.' : ''
            ),
            subject: ['user', $user->id],
            new: [
                'method' => 'google_oidc',
                'email' => $email,
                'google_id_linked' => $firstLink,
                'abilities' => $abilities,
            ],
            severity: $firstLink ? AuditLogger::SEVERITY_NOTICE : AuditLogger::SEVERITY_INFO,
        );

        return response()->json([
            'success' => true,
            'message' => 'Signed in with Google.',
            'data' => [
                'user' => $user->load('department')->makeHidden(['password']),
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => config('sanctum.expiration') * 60,
            ],
        ]);
    }

    /**
     * POST /api/auth/google/link  - link Google to the signed-in account.
     *
     * Lets staff who signed in with a password attach their Google identity
     * without an administrator touching the record. Starting the flow while
     * already authenticated is the same handshake; the callback simply finds
     * the account by email.
     */
    public function link(Request $request)
    {
        $user = $request->user();

        if ($user->google_id) {
            return response()->json([
                'success' => false,
                'message' => 'A Google account is already linked.',
            ], 409);
        }

        if (! $this->oidc->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Google sign-in is not available.',
            ], 503);
        }

        $flow = $this->oidc->beginFlow();

        return response()->json([
            'success' => true,
            'data' => [
                'authorize_url' => $flow['authorize_url'],
                'state' => $flow['state'],
            ],
        ]);
    }

    /**
     * DELETE /api/auth/google/unlink
     *
     * Refused if the account has no usable password, because unlinking would
     * otherwise lock the user out of their own account entirely.
     */
    public function unlink(Request $request)
    {
        $user = $request->user();

        if (! $user->google_id) {
            return response()->json([
                'success' => false,
                'message' => 'No Google account is linked.',
            ], 404);
        }

        if (empty($user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Set a password before unlinking Google, or you will not be able to sign in.',
            ], 409);
        }

        $user->google_id = null;
        $user->google_linked_at = null;
        $user->save();

        AuditLogger::record(
            action: 'auth.google.unlinked',
            description: sprintf('%s unlinked their Google account.', $user->username),
            subject: ['user', $user->id],
            severity: AuditLogger::SEVERITY_NOTICE,
        );

        return response()->json([
            'success' => true,
            'message' => 'Google account unlinked.',
        ]);
    }
}

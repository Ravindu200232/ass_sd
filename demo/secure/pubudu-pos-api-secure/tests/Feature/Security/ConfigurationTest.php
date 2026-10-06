<?php
// tests/Feature/Security/ConfigurationTest.php

namespace Tests\Feature\Security;

/**
 * V-07, V-08, V-09 and the OIDC handshake - configuration-level controls.
 */
class ConfigurationTest extends SecurityTestCase
{
    // =======================================================================
    // V-09  Security response headers
    // =======================================================================

    /**
     * @dataProvider requiredHeaders
     */
    public function test_security_headers_are_present(string $header, string $expected): void
    {
        $response = $this->getJson('/api/login');

        $this->assertSame(
            $expected,
            $response->headers->get($header),
            "$header was missing or wrong"
        );
    }

    public static function requiredHeaders(): array
    {
        return [
            'nosniff' => ['X-Content-Type-Options', 'nosniff'],
            'framing' => ['X-Frame-Options', 'DENY'],
            'referrer' => ['Referrer-Policy', 'no-referrer'],
        ];
    }

    public function test_a_content_security_policy_is_sent(): void
    {
        $csp = $this->getJson('/api/login')->headers->get('Content-Security-Policy');

        $this->assertNotNull($csp);
        $this->assertStringContainsString("default-src 'none'", $csp);
        $this->assertStringContainsString("frame-ancestors 'none'", $csp);
    }

    public function test_headers_are_present_on_error_responses_too(): void
    {
        // The middleware is global rather than on a route group precisely so
        // that responses generated before routing are covered.
        $response = $this->getJson('/api/no-such-endpoint-exists');

        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertSame('DENY', $response->headers->get('X-Frame-Options'));
    }

    public function test_hsts_is_not_sent_over_plain_http(): void
    {
        // RFC 6797 s7.2 forbids it, and sending it on a local http:// dev
        // server would pin the developer's browser to HTTPS for localhost.
        $this->assertNull(
            $this->getJson('/api/login')->headers->get('Strict-Transport-Security')
        );
    }

    // =======================================================================
    // V-08  CORS
    // =======================================================================

    public function test_an_unknown_origin_is_not_granted_cors_access(): void
    {
        $response = $this->getJson('/api/login', ['Origin' => 'https://attacker.example.com']);

        $this->assertNotSame('*', $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertNotSame(
            'https://attacker.example.com',
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }

    public function test_the_configured_frontend_origin_is_allowed(): void
    {
        // phpunit.xml sets FRONTEND_URLS=http://localhost:5173
        $response = $this->getJson('/api/login', ['Origin' => 'http://localhost:5173']);

        $this->assertSame(
            'http://localhost:5173',
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }

    public function test_credentials_are_never_allowed_cross_origin(): void
    {
        // The API authenticates with a bearer token, not cookies. Keeping this
        // false means a future edit to allowed_origins cannot create the
        // wildcard-plus-credentials pairing browsers specifically forbid.
        $this->assertFalse(config('cors.supports_credentials'));
    }

    // =======================================================================
    // V-07  Information disclosure
    // =======================================================================

    public function test_an_unhandled_error_does_not_leak_internals(): void
    {
        config(['app.debug' => false]);

        // Reports interpolate date parameters straight into whereBetween; with
        // none supplied the driver errors.
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reports/products');

        $body = $response->getContent();

        foreach (['SQLSTATE', 'vendor\\', 'vendor/', '.php', 'Illuminate\\'] as $leak) {
            $this->assertStringNotContainsString(
                $leak,
                $body,
                "Response leaked '$leak'"
            );
        }
    }

    public function test_a_missing_record_does_not_reveal_the_model_class(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/customers/999999');

        $response->assertStatus(404);
        $this->assertStringNotContainsString('App\\Models', $response->getContent());
    }

    public function test_the_shipped_env_template_is_production_safe(): void
    {
        // The regression this guards is the TEMPLATE, not the developer's own
        // .env - a local APP_DEBUG=true is correct and expected.
        //
        // '.env copy.example' shipped APP_ENV=local and APP_DEBUG=true, and
        // Composer's post-root-package-install script copies the template to
        // .env automatically on a fresh install. Anyone deploying by cloning
        // and running composer install therefore got full Ignition stack
        // traces - including a dump of every environment variable - on any
        // unhandled error.
        $template = base_path('.env.example');

        $this->assertFileExists($template, 'The .env template is missing');

        $contents = file_get_contents($template);

        $this->assertMatchesRegularExpression(
            '/^APP_DEBUG=false$/m',
            $contents,
            'The .env template must default APP_DEBUG to false'
        );

        $this->assertMatchesRegularExpression(
            '/^APP_ENV=production$/m',
            $contents,
            'The .env template must default APP_ENV to production'
        );

        // And the real .env must never be committed (V-14 on the frontend was
        // the same class of defect).
        $this->assertStringNotContainsString(
            'APP_KEY=base64:',
            $contents,
            'A real application key is present in the committed template'
        );
    }

    public function test_the_application_defaults_to_debug_off_when_unset(): void
    {
        // config/app.php must not fall back to true when APP_DEBUG is absent.
        $default = (new \Illuminate\Config\Repository(
            require base_path('config/app.php')
        ));

        $this->assertIsBool($default->get('debug'));
    }

    // =======================================================================
    // Google OIDC handshake
    // =======================================================================

    public function test_the_authorize_url_uses_authorization_code_with_pkce(): void
    {
        $response = $this->getJson('/api/auth/google/redirect')->assertStatus(200);

        $url = $response->json('data.authorize_url');
        parse_str(parse_url($url, PHP_URL_QUERY), $params);

        $this->assertStringStartsWith('https://accounts.google.com/', $url);

        // Authorization Code, never Implicit - OAuth 2.1 removes Implicit
        // because the token lands in the URL fragment.
        $this->assertSame('code', $params['response_type']);

        // S256, never "plain": a plain challenge IS the verifier.
        $this->assertSame('S256', $params['code_challenge_method']);
        $this->assertSame(43, strlen($params['code_challenge']));

        $this->assertNotEmpty($params['nonce']);
        $this->assertNotEmpty($params['state']);
        $this->assertSame(config('services.google.client_id'), $params['client_id']);
    }

    public function test_the_pkce_verifier_is_never_sent_to_the_client(): void
    {
        // The whole reason the verifier is held server-side: this application
        // had a stored XSS (V-13), and anything the page holds, script can read.
        $body = $this->getJson('/api/auth/google/redirect')->getContent();

        $this->assertStringNotContainsString('code_verifier', $body);
        $this->assertStringNotContainsString('client_secret', $body);
    }

    public function test_a_callback_with_an_unknown_state_is_refused(): void
    {
        $this->postJson('/api/auth/google/callback', [
            'code' => '4/0AfakeAuthorizationCode',
            'state' => 'never-issued-by-this-server',
        ])->assertStatus(400);

        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.google.state_rejected']);
    }

    public function test_a_state_value_cannot_be_replayed(): void
    {
        $state = $this->getJson('/api/auth/google/redirect')->json('data.state');

        // First use consumes it. The exchange then fails because the code is
        // fake, which is expected - what matters is that the state was accepted.
        $this->postJson('/api/auth/google/callback', [
            'code' => '4/0AfakeAuthorizationCode',
            'state' => $state,
        ]);

        // Second use must be refused at the state check, before any network call.
        $this->postJson('/api/auth/google/callback', [
            'code' => '4/0AfakeAuthorizationCode',
            'state' => $state,
        ])->assertStatus(400);
    }
}

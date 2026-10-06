<?php
// tests/Feature/Security/AuthenticationTest.php

namespace Tests\Feature\Security;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;

/**
 * V-05 and V-06 - authentication and session lifecycle.
 */
class AuthenticationTest extends SecurityTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // The login limiter is real and shared; clear it so one test cannot
        // make the next one fail for the wrong reason.
        RateLimiter::clear('login:' . sha1('admin|127.0.0.1'));
        RateLimiter::clear('login-ip:127.0.0.1');
    }

    // =======================================================================
    // V-05a  Username enumeration
    // =======================================================================

    public function test_an_unknown_username_and_a_wrong_password_are_indistinguishable(): void
    {
        $unknown = $this->postJson('/api/login', [
            'username' => 'no_such_user_at_all',
            'password' => 'whatever',
        ]);

        $wrongPassword = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => 'definitely-not-the-password',
        ]);

        // Same status AND same message. The original returned 404 "The provided
        // username does not exist." versus 401 "The provided password is
        // incorrect.", which let an attacker harvest valid usernames before
        // guessing a single password.
        $this->assertSame(401, $unknown->status());
        $this->assertSame(401, $wrongPassword->status());
        $this->assertSame($unknown->json('message'), $wrongPassword->json('message'));
    }

    public function test_a_failed_login_is_recorded_in_the_audit_trail(): void
    {
        $this->postJson('/api/login', ['username' => 'admin', 'password' => 'wrong']);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'auth.login.failed',
            'actor_username' => 'admin',
        ]);
    }

    public function test_the_submitted_password_is_never_written_to_the_audit_trail(): void
    {
        $secret = 'Sup3r-Secret-Guess!99';

        $this->postJson('/api/login', ['username' => 'admin', 'password' => $secret]);

        $rows = \DB::table('audit_logs')->get();

        foreach ($rows as $row) {
            $this->assertStringNotContainsString($secret, json_encode($row));
        }
    }

    // =======================================================================
    // V-05b  Brute force
    // =======================================================================

    public function test_repeated_failed_logins_are_throttled(): void
    {
        $statuses = [];

        for ($i = 0; $i < 10; $i++) {
            $statuses[] = $this->postJson('/api/login', [
                'username' => 'admin',
                'password' => "guess-$i",
            ])->status();
        }

        $throttled = count(array_filter($statuses, fn ($s) => $s === 429));

        // 5 per minute per username+IP, so most of ten attempts must be refused.
        $this->assertGreaterThanOrEqual(
            4,
            $throttled,
            'Expected the login limiter to refuse repeated attempts; statuses were ' . implode(',', $statuses)
        );
    }

    // =======================================================================
    // V-05c  Password policy
    // =======================================================================

    /**
     * @dataProvider weakPasswords
     */
    public function test_weak_passwords_are_rejected(string $password, string $why): void
    {
        // Password::uncompromised() uses the HIBP k-anonymity range API.
        // Keep this regression test deterministic and offline: return the
        // matching SHA-1 suffix for the one breach-corpus test password, while
        // still exercising the real Laravel verifier and its HTTP request.
        if ($why === 'a password in the breach corpus') {
            $hash = strtoupper(sha1($password));
            $prefix = substr($hash, 0, 5);
            $suffix = substr($hash, 5);

            Http::fake([
                "https://api.pwnedpasswords.com/range/{$prefix}" => Http::response("{$suffix}:1\r\n", 200),
            ]);
        }

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/register', [
                'full_name' => 'Weak Password Probe',
                'nic_no' => '88' . random_int(1000000, 9999999) . 'V',
                'phone_no_01' => '0700000000',
                'username' => 'weakpw' . random_int(1000, 9999),
                'password' => $password,
                'role' => 'employee',
                'department_id' => $this->colombo->id,
            ]);

        $this->assertSame(422, $response->status(), "Should have rejected $why");

        if ($why === 'a password in the breach corpus') {
            Http::assertSent(fn ($request) => $request->url() === "https://api.pwnedpasswords.com/range/{$prefix}");
        }
    }

    public static function weakPasswords(): array
    {
        return [
            'the most guessed password in the world' => ['123456', '"123456"'],
            'too short' => ['Ab1!xyz', 'a 7-character password'],
            'no digits' => ['NoDigitsHereAtAll!', 'a password with no digits'],
            'no symbols' => ['NoSymbolsHere123', 'a password with no symbols'],
            'no upper case' => ['nouppercase123!', 'a password with no upper case'],
            'known breached' => ['Password123!', 'a password in the breach corpus'],
        ];
    }

    public function test_a_strong_password_is_accepted(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/register', [
                'full_name' => 'Strong Password User',
                'nic_no' => '887654321V',
                'phone_no_01' => '0700000000',
                'username' => 'strongpw',
                'password' => 'Tyre-Shop-Colombo-2026!',
                'role' => 'employee',
                'department_id' => $this->colombo->id,
            ])
            ->assertStatus(201);
    }

    // =======================================================================
    // V-05d  Self-service password change
    // =======================================================================

    public function test_changing_a_password_requires_the_current_one(): void
    {
        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/change-password', [
                'current_password' => 'not-my-password',
                'password' => 'Brand-New-Passphrase!77',
                'password_confirmation' => 'Brand-New-Passphrase!77',
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.current_password.0', 'The current password is incorrect.');
    }

    public function test_a_successful_password_change_revokes_every_session(): void
    {
        $user = $this->colomboCashier;
        $user->createToken('other-device');
        $user->createToken('yet-another');

        $this->assertGreaterThanOrEqual(2, $user->tokens()->count());

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/change-password', [
                'current_password' => $this->fixturePassword(),
                'password' => 'Brand-New-Passphrase!77',
                'password_confirmation' => 'Brand-New-Passphrase!77',
            ])
            ->assertStatus(200);

        // Changing a password after a suspected compromise is pointless if the
        // attacker's existing token keeps working.
        $this->assertSame(0, $user->fresh()->tokens()->count());
    }

    // =======================================================================
    // V-06  Token lifecycle
    // =======================================================================

    public function test_issued_tokens_carry_an_expiry(): void
    {
        $this->assertNotNull(
            config('sanctum.expiration'),
            'sanctum.expiration was null, meaning tokens never expire'
        );

        $this->assertSame(480, (int) config('sanctum.expiration'));
    }

    public function test_tokens_are_scoped_to_the_users_role(): void
    {
        $response = $this->postJson('/api/login', [
            'username' => 'cashier.colombo',
            'password' => $this->fixturePassword(),
        ])->assertStatus(200);

        $abilities = \DB::table('personal_access_tokens')
            ->where('tokenable_id', $this->colomboCashier->id)
            ->value('abilities');

        // Not the default ['*'].
        $this->assertStringContainsString('role:employee', $abilities);
        $this->assertStringNotContainsString('"*"', $abilities);
        $this->assertNotNull($response->json('data.expires_in'));
    }

    public function test_logging_in_revokes_previous_sessions(): void
    {
        $this->colomboCashier->createToken('old-device');
        $this->assertSame(1, $this->colomboCashier->tokens()->count());

        $this->postJson('/api/login', [
            'username' => 'cashier.colombo',
            'password' => $this->fixturePassword(),
        ])->assertStatus(200);

        // One person, one active session - the right model for a till, and it
        // means a stolen token dies when the real user next signs in.
        $this->assertSame(1, $this->colomboCashier->fresh()->tokens()->count());
    }

    public function test_deactivating_a_user_revokes_their_existing_token(): void
    {
        $victim = $this->kandyCashier;
        $victim->createToken('in-the-wild');

        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/users/' . $victim->id, [
                'full_name' => $victim->full_name,
                'nic_no' => $victim->nic_no,
                'phone_no_01' => $victim->phone_no_01,
                'username' => $victim->username,
                'role' => $victim->role,
                'is_active' => false,
            ])
            ->assertStatus(200);

        $this->assertSame(
            0,
            $victim->fresh()->tokens()->count(),
            'A deactivated user kept a usable token - the exact V-06 defect'
        );
    }

    public function test_a_deactivated_user_is_refused_on_every_request(): void
    {
        // The middleware backstop, for a token minted in a race with the
        // deactivation or a row changed directly in the database.
        $this->kandyCashier->update(['is_active' => false]);

        $this->actingAs($this->kandyCashier, 'sanctum')
            ->getJson('/api/me')
            ->assertStatus(403);
    }

    public function test_changing_a_role_revokes_the_old_token(): void
    {
        // Abilities are baked into a token at issue time, so a demoted
        // administrator would otherwise keep the admin ability until logout.
        $victim = $this->kandyCashier;
        $victim->createToken('as-employee', ['role:employee']);

        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/users/' . $victim->id, [
                'full_name' => $victim->full_name,
                'nic_no' => $victim->nic_no,
                'phone_no_01' => $victim->phone_no_01,
                'username' => $victim->username,
                'role' => 'admin',
                'is_active' => true,
            ])
            ->assertStatus(200);

        $this->assertSame(0, $victim->fresh()->tokens()->count());
    }

    public function test_logout_all_revokes_every_session(): void
    {
        $this->colomboCashier->createToken('device-a');
        $this->colomboCashier->createToken('device-b');

        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/logout-all')
            ->assertStatus(200);

        $this->assertSame(0, $this->colomboCashier->fresh()->tokens()->count());
    }
}

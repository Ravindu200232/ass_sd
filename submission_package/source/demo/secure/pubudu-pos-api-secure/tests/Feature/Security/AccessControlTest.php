<?php
// tests/Feature/Security/AccessControlTest.php

namespace Tests\Feature\Security;

use App\Models\User;

/**
 * V-01, V-02, V-03 - broken access control.
 *
 * Every test here FAILS against the original application at tag
 * v0-original-vulnerable and passes after the remediation commits.
 */
class AccessControlTest extends SecurityTestCase
{
    // =======================================================================
    // V-01  Public registration minted administrator tokens
    // =======================================================================

    public function test_registration_is_not_reachable_without_authentication(): void
    {
        $response = $this->postJson('/api/register', [
            'full_name' => 'Mallory Attacker',
            'nic_no' => '991234567V',
            'phone_no_01' => '0700000000',
            'username' => 'attacker',
            'password' => 'Str0ng-Passphrase!42',
            'role' => 'admin',
            'department_id' => $this->colombo->id,
        ]);

        $response->assertStatus(401);

        $this->assertDatabaseMissing('users', ['username' => 'attacker']);
    }

    public function test_an_employee_cannot_create_users(): void
    {
        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/register', [
                'full_name' => 'Self Promotion',
                'nic_no' => '992234567V',
                'phone_no_01' => '0700000000',
                'username' => 'selfpromo',
                'password' => 'Str0ng-Passphrase!42',
                'role' => 'admin',
                'department_id' => $this->colombo->id,
            ])
            ->assertStatus(403);

        $this->assertDatabaseMissing('users', ['username' => 'selfpromo']);
    }

    public function test_registration_no_longer_returns_a_session_token(): void
    {
        // An administrator creating a staff account must not receive that
        // account's session.
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/register', [
                'full_name' => 'New Cashier',
                'nic_no' => '993234567V',
                'phone_no_01' => '0700000000',
                'username' => 'new.cashier',
                'password' => 'Str0ng-Passphrase!42',
                'role' => 'employee',
                'department_id' => $this->colombo->id,
            ]);

        $response->assertStatus(201);

        $this->assertArrayNotHasKey('token', $response->json('data'));
        $this->assertDatabaseHas('users', ['username' => 'new.cashier', 'role' => 'employee']);
    }

    // =======================================================================
    // V-02  Privileged routes had no role check
    // =======================================================================

    /**
     * @dataProvider privilegedEndpoints
     */
    public function test_privileged_endpoints_refuse_an_employee(string $method, string $uri, array $payload = []): void
    {
        $response = $this->actingAs($this->colomboCashier, 'sanctum')
            ->json($method, $uri, $payload);

        $this->assertSame(
            403,
            $response->status(),
            "$method $uri should be administrator-only but returned {$response->status()}"
        );
    }

    public static function privilegedEndpoints(): array
    {
        return [
            'company profit report' => ['GET', '/api/reports/daily-profit'],
            'customer export' => ['GET', '/api/reports/customers'],
            'invoice report' => ['GET', '/api/reports/invoices'],
            'audit trail' => ['GET', '/api/audit-logs'],
            'list all users' => ['GET', '/api/all-users'],
            'reprice a stock batch' => ['POST', '/api/grn-items/update-selling-price', [
                'grn_code' => 'GRN0001', 'product_code' => 'PRD0001', 'selling_price' => 1,
            ]],
            'adjust a credit balance' => ['POST', '/api/customers/1/adjust-credit', [
                'adjustment_type' => 'set', 'amount' => 0, 'reason' => 'x', 'adjustment_date' => '2026-01-01',
            ]],
            'adjust stock quantity' => ['POST', '/api/grns/adjust-quantity', [
                'grn_code' => 'GRN0001', 'product_code' => 'PRD0001', 'adjustment_qty' => 500,
                'adjustment_type' => 'add', 'reason' => 'x',
            ]],
            'cancel an invoice' => ['PUT', '/api/invoices/1', ['type' => 'cancel']],
            'delete a customer' => ['DELETE', '/api/customers/1'],
            'create a product' => ['POST', '/api/products', ['product_name' => 'x', 'description' => 'x']],
        ];
    }

    public function test_an_administrator_can_reach_the_same_endpoints(): void
    {
        // The mirror of the test above: proving the gate refuses employees is
        // only half the story if it also refuses the people who need it.
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reports/daily-profit')
            ->assertStatus(200);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/all-users')
            ->assertStatus(200);
    }

    public function test_discount_approval_is_administrator_only(): void
    {
        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/discount-requests/1/approve', ['admin_note' => 'self approved'])
            ->assertStatus(403);
    }

    // =======================================================================
    // V-03  IDOR / BOLA - cross-branch access
    // =======================================================================

    public function test_an_employee_cannot_read_another_branchs_customer(): void
    {
        $response = $this->actingAs($this->colomboCashier, 'sanctum')
            ->getJson('/api/customers/' . $this->kandyCustomer->id);

        // 404, not 403: a 403 would confirm the record exists and let an
        // attacker enumerate ids across branches.
        $response->assertStatus(404);

        $this->assertStringNotContainsString('Dilani', $response->getContent());
        $this->assertStringNotContainsString('78500', $response->getContent());
    }

    public function test_an_employee_cannot_read_another_branchs_invoice(): void
    {
        $this->actingAs($this->colomboCashier, 'sanctum')
            ->getJson('/api/invoices/' . $this->kandyInvoice->id)
            ->assertStatus(404);
    }

    public function test_an_employee_can_read_their_own_branchs_records(): void
    {
        $this->actingAs($this->colomboCashier, 'sanctum')
            ->getJson('/api/customers/' . $this->colomboCustomer->id)
            ->assertStatus(200)
            ->assertJsonPath('data.customer_name', 'Ajith Kumara');
    }

    public function test_an_administrator_sees_every_branch(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/customers/' . $this->kandyCustomer->id)
            ->assertStatus(200)
            ->assertJsonPath('data.customer_name', 'Dilani Wickramasinghe');
    }

    public function test_listing_endpoints_are_scoped_too(): void
    {
        // Fixing only the {id} lookups would be pointless if the index
        // endpoint still returned every branch's rows in bulk.
        $response = $this->actingAs($this->colomboCashier, 'sanctum')
            ->getJson('/api/customers')
            ->assertStatus(200);

        $codes = collect($response->json('data'))->pluck('customer_code')->all();

        $this->assertContains('CUS0001', $codes);
        $this->assertNotContains('CUS0002', $codes);
    }

    public function test_an_employee_with_no_department_sees_nothing(): void
    {
        // Failing closed. Treating "no department" as "all departments" would
        // turn a data-entry omission into a privilege escalation.
        $orphan = User::create([
            'user_code' => 'EMP999',
            'full_name' => 'Unassigned Staff',
            'nic_no' => '999999999V',
            'phone_no_01' => '0700000000',
            'username' => 'unassigned',
            'password' => 'Correct-Horse-Battery-9!',
            'role' => 'employee',
            'is_active' => true,
            'department_id' => null,
        ]);

        $response = $this->actingAs($orphan, 'sanctum')
            ->getJson('/api/customers')
            ->assertStatus(200);

        $this->assertCount(0, $response->json('data'));
    }
}

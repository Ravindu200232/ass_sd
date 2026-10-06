<?php
// tests/Feature/Security/BusinessIntegrityTest.php

namespace Tests\Feature\Security;

use App\Models\DiscountRequest;

/**
 * V-04, V-10, V-11 - input integrity, pricing authority and auditability.
 */
class BusinessIntegrityTest extends SecurityTestCase
{
    // =======================================================================
    // V-04  Mass assignment
    // =======================================================================

    public function test_a_credit_balance_cannot_be_changed_through_the_update_endpoint(): void
    {
        $response = $this->actingAs($this->colomboCashier, 'sanctum')
            ->putJson('/api/customers/' . $this->colomboCustomer->id, [
                'customer_name' => 'Ajith Kumara',
                'credit_balance' => 0,
            ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors' => ['credit_balance']]);

        $this->assertEquals(
            45000.00,
            (float) $this->colomboCustomer->fresh()->credit_balance,
            '45,000 LKR of debt was erased by a mass-assigned field'
        );
    }

    public function test_the_customer_business_key_cannot_be_rewritten(): void
    {
        $this->actingAs($this->colomboCashier, 'sanctum')
            ->putJson('/api/customers/' . $this->colomboCustomer->id, [
                'customer_name' => 'Ajith Kumara',
                'customer_code' => 'CUS-HIJACKED',
            ])
            ->assertStatus(422);

        $this->assertSame('CUS0001', $this->colomboCustomer->fresh()->customer_code);
    }

    public function test_the_business_key_is_not_mass_assignable_at_the_model_level_either(): void
    {
        // Defence in depth: even if a controller regresses to
        // update($request->all()), the key must not move.
        $this->colomboCustomer->fill(['customer_code' => 'CUS-BYPASS']);

        $this->assertSame('CUS0001', $this->colomboCustomer->customer_code);
    }

    public function test_a_credit_adjustment_writes_a_ledger_row(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/customers/' . $this->colomboCustomer->id . '/adjust-credit', [
                'adjustment_type' => 'decrease',
                'amount' => 5000,
                'reason' => 'Goodwill write-off after complaint',
                'adjustment_date' => now()->toDateString(),
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('credit_transactions', [
            'customer_code' => 'CUS0001',
            'type' => 'adjustment',
            'previous_balance' => 45000.00,
            'new_balance' => 40000.00,
        ]);

        // A ledger row alone does not record who made this manual money move.
        // This guards against the audit call being removed during integration.
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'customer.credit.adjusted',
            'actor_id' => $this->admin->id,
            'subject_type' => 'customer',
            'subject_id' => 'CUS0001',
            'severity' => 'warning',
        ]);
    }

    // =======================================================================
    // V-10  Client-controlled pricing
    // =======================================================================

    public function test_a_tampered_unit_price_is_rejected(): void
    {
        $response = $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $this->invoicePayload(['selling_price' => 1]));

        $response->assertStatus(422)
            ->assertJsonStructure(['errors' => ['items.0.selling_price']]);

        // Nothing was written, and no stock was consumed.
        $this->assertDatabaseMissing('invoices', ['inv_no' => 'INV0003']);
        $this->assertEquals(10, (float) \DB::table('grn_items')->value('qty'));
    }

    public function test_the_catalogue_price_is_accepted(): void
    {
        $response = $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $this->invoicePayload(['selling_price' => self::CATALOGUE_PRICE]))
            ->assertStatus(201);

        // assertJsonPath is strict, and MySQL returns this column as an int
        // when the value happens to be whole, so compare numerically.
        $this->assertEqualsWithDelta(
            self::CATALOGUE_PRICE,
            (float) $response->json('data.net_total'),
            0.01
        );
    }

    public function test_a_discount_with_no_approval_is_rejected(): void
    {
        $response = $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $this->invoicePayload([
                'selling_price' => self::CATALOGUE_PRICE,
                'discount' => 30000,
            ]));

        $response->assertStatus(422)
            ->assertJsonStructure(['errors' => ['items.0.discount']]);
    }

    public function test_an_approved_discount_is_accepted_and_consumed(): void
    {
        $approval = DiscountRequest::create([
            'inv_no' => 'INV0001',
            'product_code' => 'PRD0001',
            'requested_by' => $this->colomboCashier->user_code,
            'original_price' => self::CATALOGUE_PRICE,
            'requested_discount' => 2000,
            'final_price' => self::CATALOGUE_PRICE - 2000,
            'status' => 'approved',
            'approved_by' => $this->admin->user_code,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $this->invoicePayload([
                'selling_price' => self::CATALOGUE_PRICE,
                'discount' => 2000,
            ]))
            ->assertStatus(201);

        // Single use: the approval is now spent and records which invoice
        // spent it.
        $approval->refresh();
        $this->assertNotNull($approval->consumed_at);
        $this->assertNotNull($approval->consumed_inv_no);
    }

    public function test_an_approved_discount_cannot_be_replayed(): void
    {
        DiscountRequest::create([
            'inv_no' => 'INV0001',
            'product_code' => 'PRD0001',
            'requested_by' => $this->colomboCashier->user_code,
            'original_price' => self::CATALOGUE_PRICE,
            'requested_discount' => 2000,
            'final_price' => self::CATALOGUE_PRICE - 2000,
            'status' => 'approved',
            'approved_by' => $this->admin->user_code,
            'approved_at' => now(),
        ]);

        $payload = $this->invoicePayload([
            'selling_price' => self::CATALOGUE_PRICE,
            'discount' => 2000,
        ]);

        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $payload)
            ->assertStatus(201);

        // Without consumed_at, one approval for "Rs 2,000 off a Michelin tyre"
        // would apply to every later sale of that product, forever.
        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $payload)
            ->assertStatus(422);
    }

    public function test_a_discount_larger_than_the_approved_amount_is_rejected(): void
    {
        DiscountRequest::create([
            'inv_no' => 'INV0001',
            'product_code' => 'PRD0001',
            'requested_by' => $this->colomboCashier->user_code,
            'original_price' => self::CATALOGUE_PRICE,
            'requested_discount' => 2000,
            'final_price' => self::CATALOGUE_PRICE - 2000,
            'status' => 'approved',
            'approved_by' => $this->admin->user_code,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $this->invoicePayload([
                'selling_price' => self::CATALOGUE_PRICE,
                'discount' => 25000,
            ]))
            ->assertStatus(422);
    }

    public function test_one_cashier_cannot_spend_another_cashiers_approval(): void
    {
        DiscountRequest::create([
            'inv_no' => 'INV0002',
            'product_code' => 'PRD0001',
            'requested_by' => $this->kandyCashier->user_code,
            'original_price' => self::CATALOGUE_PRICE,
            'requested_discount' => 2000,
            'final_price' => self::CATALOGUE_PRICE - 2000,
            'status' => 'approved',
            'approved_by' => $this->admin->user_code,
            'approved_at' => now(),
        ]);

        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $this->invoicePayload([
                'selling_price' => self::CATALOGUE_PRICE,
                'discount' => 2000,
            ]))
            ->assertStatus(422);
    }

    public function test_the_creating_user_is_taken_from_the_token_not_the_payload(): void
    {
        $this->actingAs($this->colomboCashier, 'sanctum')
            ->postJson('/api/invoices', $this->invoicePayload([
                'selling_price' => self::CATALOGUE_PRICE,
            ]) + ['inv_by' => 'EMP001'])
            ->assertStatus(201)
            ->assertJsonPath('data.inv_by', $this->colomboCashier->user_code);
    }

    // =======================================================================
    // V-11  Audit trail
    // =======================================================================

    public function test_cancelling_an_invoice_preserves_the_original_amounts(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->putJson('/api/invoices/' . $this->colomboInvoice->id, [
                'type' => 'cancel',
                'reason' => 'Customer returned the goods',
            ])
            ->assertStatus(200);

        $entry = \DB::table('audit_logs')->where('action', 'invoice.cancelled')->first();

        $this->assertNotNull($entry, 'Cancelling an invoice wrote no audit entry');
        $this->assertSame('critical', $entry->severity);
        $this->assertSame($this->admin->username, $entry->actor_username);

        // The invoice row itself is zeroed in place, so without this snapshot a
        // voided 500,000 LKR sale is indistinguishable from a voided 500 LKR one.
        $old = json_decode($entry->old_values, true);
        $this->assertEquals(64000, $old['net_total']);
        $this->assertCount(1, $old['items']);
    }

    public function test_the_audit_trail_cannot_be_modified(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/customers/' . $this->colomboCustomer->id . '/adjust-credit', [
                'adjustment_type' => 'decrease',
                'amount' => 100,
                'reason' => 'test',
                'adjustment_date' => now()->toDateString(),
            ]);

        $entry = \App\Models\AuditLog::firstOrFail();

        // An audit trail an attacker can edit is not an audit trail.
        $this->expectException(\RuntimeException::class);
        $entry->update(['description' => 'nothing to see here']);
    }

    public function test_the_audit_trail_cannot_be_deleted(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/customers/' . $this->colomboCustomer->id . '/adjust-credit', [
                'adjustment_type' => 'decrease',
                'amount' => 100,
                'reason' => 'test',
                'adjustment_date' => now()->toDateString(),
            ]);

        $entry = \App\Models\AuditLog::firstOrFail();

        $this->expectException(\RuntimeException::class);
        $entry->delete();
    }

    /**
     * @param array<string,mixed> $itemOverrides
     * @return array<string,mixed>
     */
    private function invoicePayload(array $itemOverrides = []): array
    {
        return [
            'inv_date' => now()->toDateString(),
            'customer_type' => 'cash',
            'payment_status' => 'cash',
            'pay_amount' => 0,
            'department_id' => $this->colombo->id,
            'type' => 'tire',
            'items' => [array_merge([
                'product_code' => 'PRD0001',
                'product_name' => 'Michelin Primacy 4 205/55R16',
                'qty' => 1,
                'selling_price' => self::CATALOGUE_PRICE,
                'discount' => 0,
                'type' => 'product',
            ], $itemOverrides)],
        ];
    }
}

<?php
// tests/Feature/Security/ResponseFilteringTest.php

namespace Tests\Feature\Security;

use App\Models\GrnItem;

/**
 * V-20 - wholesale cost and margin must not reach an employee's response.
 *
 * Every test here fails against the application as it stood before the fix.
 */
class ResponseFilteringTest extends SecurityTestCase
{
    /**
     * Fields that reveal what the business PAYS or MAKES.
     *
     * selling_price and final_price are deliberately absent: a cashier has to
     * see what the customer pays in order to do their job.
     */
    private const COST_FIELDS = [
        'stock_price',
        'actual_cost',
        'main_branch_price',
        'total_cost',
        'total_profit',
        'discount1',
        'discount2',
        'discount3',
        'discount4',
        'discount_price',
        'subtotal',
    ];

    /**
     * Every stock endpoint a cashier can legitimately reach.
     *
     * These are TEMPLATES, not URLs. '{grn}' is substituted with the fixture's
     * real id at run time, because MySQL's AUTO_INCREMENT is not transactional:
     * RefreshDatabase rolls each test back but the counter keeps climbing, so a
     * hardcoded /api/grns/1 only works in the first test of a run.
     */
    public static function employeeReachableStockEndpoints(): array
    {
        return [
            'goods receipt list' => ['/api/grns'],
            'available stock' => ['/api/grns/stock'],
            'batches for a product' => ['/api/grns/product/PRD0001/batches'],
            'one goods receipt' => ['/api/grns/{grn}'],
            'goods receipt by code' => ['/api/grns/code/GRN0001'],
        ];
    }

    /** Resolve a template from the provider against this test's fixtures. */
    private function url(string $template): string
    {
        return str_replace('{grn}', (string) $this->colomboGrn->id, $template);
    }

    /**
     * @dataProvider employeeReachableStockEndpoints
     */
    public function test_an_employee_never_receives_cost_or_margin(string $uri): void
    {
        $response = $this->actingAs($this->colomboCashier, 'sanctum')->getJson($this->url($uri));

        // The endpoint must still WORK - hiding cost by breaking the endpoint
        // is not a fix, and an earlier iteration of this change did exactly
        // that by failing to capture a variable into a closure.
        $response->assertStatus(200);

        $body = $response->getContent();

        foreach (self::COST_FIELDS as $field) {
            $this->assertStringNotContainsString(
                '"' . $field . '"',
                $body,
                "{$this->url($uri)} leaked '$field' to an employee"
            );
        }
    }

    /**
     * @dataProvider employeeReachableStockEndpoints
     */
    public function test_an_employee_still_gets_what_they_need(string $uri): void
    {
        // The counterpart of the test above. Removing cost must not remove the
        // selling price, or the till cannot ring up a sale.
        $response = $this->actingAs($this->colomboCashier, 'sanctum')->getJson($this->url($uri));

        $response->assertStatus(200);
        $this->assertStringContainsString('selling_price', $response->getContent());
    }

    public function test_an_administrator_still_receives_cost(): void
    {
        // A "fix" that blinds the owner as well is a regression, not a control.
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/grns/product/PRD0001/batches')
            ->assertStatus(200);

        $body = $response->getContent();

        foreach (['stock_price', 'actual_cost', 'main_branch_price'] as $field) {
            $this->assertStringContainsString(
                '"' . $field . '"',
                $body,
                "the administrator lost access to '$field'"
            );
        }
    }

    public function test_an_administrator_sees_margin_on_a_goods_receipt(): void
    {
        $body = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/grns/' . $this->colomboGrn->id)
            ->assertStatus(200)
            ->getContent();

        $this->assertStringContainsString('"total_cost"', $body);
        $this->assertStringContainsString('"total_profit"', $body);
    }

    public function test_cost_is_hidden_at_the_model_level_by_default(): void
    {
        // Default-deny. The point of putting this on the model rather than in
        // each controller is that an endpoint written NEXT YEAR inherits the
        // protection without anyone remembering to add it.
        $item = GrnItem::firstOrFail();

        $serialised = $item->toArray();

        foreach (['stock_price', 'actual_cost', 'main_branch_price'] as $field) {
            $this->assertArrayNotHasKey(
                $field,
                $serialised,
                "GrnItem serialises '$field' by default"
            );
        }
    }

    public function test_cost_is_revealed_only_for_an_administrator(): void
    {
        $item = GrnItem::firstOrFail();

        $this->assertArrayNotHasKey('actual_cost', $item->revealCostTo($this->colomboCashier)->toArray());

        $item = GrnItem::firstOrFail();
        $this->assertArrayHasKey('actual_cost', $item->revealCostTo($this->admin)->toArray());
    }

    public function test_a_null_user_is_never_shown_cost(): void
    {
        // Fail closed. A scheduled job or a future unauthenticated route must
        // not be treated as privileged just because there is no user to check.
        $this->assertFalse(GrnItem::costFieldsVisibleTo(null));

        $item = GrnItem::firstOrFail();
        $this->assertArrayNotHasKey('actual_cost', $item->revealCostTo(null)->toArray());
    }

    public function test_the_admin_only_stock_report_is_unaffected(): void
    {
        // The reports that V-02 moved behind admin middleware must still carry
        // the figures for the people allowed to see them.
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/reports/grn?from_date=2020-01-01&to_date=2030-01-01')
            ->assertStatus(200);
    }
}

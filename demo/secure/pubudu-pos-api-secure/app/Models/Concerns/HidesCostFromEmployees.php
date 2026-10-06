<?php
// app/Models/Concerns/HidesCostFromEmployees.php

namespace App\Models\Concerns;

use App\Models\User;

/**
 * V-20: keep wholesale cost and margin out of an employee's API responses.
 *
 * THE PROBLEM
 *   The frontend went to some trouble to HIDE cost and margin from cashiers -
 *   Reports.jsx:337,420,518 and Stock.jsx:19,639 render those columns only when
 *   `currentUser.role !== "employee"`. But the server sent the numbers anyway.
 *   Hiding a column in the DOM does not unsend the JSON: a cashier opens
 *   DevTools, looks at the Network tab, and reads every wholesale price the
 *   shop pays.
 *
 *   Confirmed against the application as it stood after V-02, with an ordinary
 *   cashier's token:
 *
 *     GET /api/grns                         stock_price, actual_cost,
 *                                           main_branch_price, discount1-4,
 *                                           total_cost, total_profit
 *     GET /api/grns/stock                   stock_price, actual_cost, ...
 *     GET /api/grns/product/{code}/batches  stock_price, actual_cost, ...
 *     GET /api/grns/{id}                    ... plus total_cost, total_profit
 *     GET /api/grns/code/{grnCode}          ... plus total_cost, total_profit
 *
 *   V-02 moved the cost and margin REPORTS behind admin middleware, which was
 *   necessary but not sufficient: these five stock endpoints have to stay
 *   reachable, because a cashier needs to see what is in stock and what it
 *   sells for in order to ring up a sale. They simply must not carry what the
 *   shop PAID for it.
 *
 *   Why it matters in a tyre shop: supplier pricing is the business's main
 *   commercial secret. A cashier who can read every actual_cost can tell a
 *   competitor exactly what the shop pays, or work out the margin on every line
 *   and negotiate against the owner. It is also the other half of V-16 - the
 *   client-side half was fixed there, and this is the server-side half.
 *
 * THE APPROACH
 *   Default-deny at the MODEL, not at each endpoint. The cost attributes are
 *   in $hidden, so any current or future endpoint that serialises one of these
 *   models omits them automatically; an administrator's response re-reveals
 *   them explicitly with revealCostTo().
 *
 *   The failure mode is deliberately the safe one round: forget the call and an
 *   administrator notices a missing column and it gets fixed. The opposite
 *   arrangement - visible by default, hidden on request - fails silently and
 *   leaks, which is exactly how this bug existed in the first place.
 *
 *   Endpoints that build their payload as a hand-written array bypass $hidden
 *   entirely, so those call costFieldsVisibleTo() and omit the keys themselves.
 *
 *   OWASP A01:2021 Broken Access Control
 *         API3:2023 Broken Object Property Level Authorization
 *   CWE-213 Exposure of Sensitive Information Due to Incompatible Policies
 *   CWE-200 Exposure of Sensitive Information to an Unauthorized Actor
 */
trait HidesCostFromEmployees
{
    /**
     * Attributes that reveal what the business pays, or what it makes.
     *
     * Note that `selling_price` and `final_price` are NOT here. A cashier has
     * to see the price the customer pays; that is their job.
     */
    public static function costAttributes(): array
    {
        return [
            'stock_price',        // what the supplier charged
            'actual_cost',        // landed cost after supplier discounts
            'main_branch_price',  // internal transfer price
            'discount1',          // the supplier discount ladder
            'discount2',
            'discount3',
            'discount4',
            'discount_price',
            'subtotal',           // qty x actual_cost
            'total_cost',
            'total_profit',
            'unit_cost',
            'cost',
        ];
    }

    /**
     * Hide the cost attributes this model actually has.
     *
     * Called from the model's boot method, so it applies to every instance
     * however it was loaded.
     */
    public function initializeHidesCostFromEmployees(): void
    {
        $this->hidden = array_values(array_unique(
            array_merge($this->hidden ?? [], static::costAttributes())
        ));
    }

    /**
     * Re-reveal the cost attributes when the viewer is allowed to see them.
     *
     * Chainable, and safe to call with null: no user means no cost.
     *
     *     $grn->revealCostTo($request->user());
     *     $items->each->revealCostTo($request->user());
     */
    public function revealCostTo(?User $user): static
    {
        if (self::costFieldsVisibleTo($user)) {
            $this->makeVisible(static::costAttributes());
        }

        return $this;
    }

    /**
     * Whether this user may see cost and margin at all.
     *
     * One place, so the rule cannot drift between endpoints - which is how the
     * frontend ended up with the check written out at eleven separate call
     * sites (Reports.jsx:337, 420, 518, 777, ...).
     */
    public static function costFieldsVisibleTo(?User $user): bool
    {
        return $user !== null && $user->role === 'admin';
    }
}

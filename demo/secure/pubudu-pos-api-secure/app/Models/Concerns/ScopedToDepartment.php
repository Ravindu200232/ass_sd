<?php
// app/Models/Concerns/ScopedToDepartment.php

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * V-03: branch (tenant) isolation for records that belong to a department.
 *
 * THE PROBLEM
 *   Every {id} handler in the application was a bare primary-key lookup:
 *
 *     CustomerController.php:101   Customer::with('department')->find($id);
 *     InvoiceController.php:229    Invoice::with([...])->find($id);
 *     GrnController.php:207        Grn::with([...])->find($id);
 *
 *   Users carry a department_id (User.php:24) and so do the records
 *   (Invoice.php:16, Grn.php:15, customers.department_id) - so branch isolation
 *   was MODELLED and never ENFORCED. Confirmed against the original: the
 *   Colombo cashier fetched GET /customers/2 and received
 *   "Dilani Wickramasinghe", a Kandy customer, together with her 78,500 LKR
 *   credit balance; and GET /invoices/2 returned the Kandy branch's invoice.
 *
 *   Ids are sequential integers, so an employee could walk the whole database.
 *
 *   Notably DiscountRequestController::index:116 DID scope its query to the
 *   caller. One place in the codebase got it right, which shows the pattern was
 *   understood and simply not applied anywhere else - the classic shape of a
 *   broken-access-control defect.
 *
 * THE APPROACH
 *   A trait rather than a global scope, deliberately. A global scope would
 *   silently filter every query in the application including reports and
 *   background work, and would be bypassed by anyone who wrote
 *   withoutGlobalScopes() without understanding why it was there. An explicit
 *   ->visibleTo($user) at each call site is greppable and reviewable: you can
 *   list the places that are scoped, and the places that are not are obvious.
 *
 *   Administrators are unrestricted - they run the business across branches.
 *   Employees see only their own department. A user with no department sees
 *   nothing rather than everything, because failing closed is the point.
 *
 *   OWASP A01:2021 Broken Access Control
 *         API1:2023 Broken Object Level Authorization
 *   CWE-639 Authorization Bypass Through User-Controlled Key (IDOR)
 *   CWE-284 Improper Access Control
 */
trait ScopedToDepartment
{
    /**
     * Restrict a query to the records this user may see.
     *
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        // No user: no rows. Should be unreachable behind auth:sanctum, but a
        // scope that returns everything when handed null is a trap.
        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        if ($user->role === 'admin') {
            return $query;
        }

        // An employee with no department assigned sees nothing. The alternative
        // - treating "no department" as "all departments" - would turn a data
        // entry omission into a privilege escalation.
        if ($user->department_id === null) {
            return $query->whereRaw('1 = 0');
        }

        return $query->where(
            $query->getModel()->getTable() . '.department_id',
            $user->department_id
        );
    }

    /**
     * Find a record by primary key, or null if this user may not see it.
     *
     * Callers turn null into a 404, NOT a 403. A 403 confirms the record
     * exists, which lets an attacker enumerate ids and map the other branch's
     * data volumes even without reading any of it. "Not found" and "not yours"
     * must be indistinguishable from outside.
     */
    public static function findVisible(?User $user, $id, array $with = []): ?static
    {
        $query = static::query()->visibleTo($user);

        if ($with) {
            $query->with($with);
        }

        return $query->find($id);
    }

    /**
     * Whether this particular record is visible to the user.
     *
     * For cases where the record has already been loaded by other means.
     */
    public function isVisibleTo(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return $user->department_id !== null
            && (int) $this->department_id === (int) $user->department_id;
    }
}

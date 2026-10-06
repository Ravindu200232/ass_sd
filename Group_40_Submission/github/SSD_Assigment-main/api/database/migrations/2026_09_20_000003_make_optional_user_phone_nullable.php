<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Align users.phone_no_02 with the validation that has always described it.
 *
 * FOUND BY: tests/Feature/Security/AccessControlTest.php
 *   test_registration_no_longer_returns_a_session_token
 *
 * THE MISMATCH
 *   The migration declares the column NOT NULL:
 *
 *     2025_12_02_211822_create_users_table.php:18
 *       $table->string('phone_no_02');
 *
 *   while every validation rule in the application declares it optional:
 *
 *     AuthController::register  'phone_no_02' => 'nullable|string'
 *     AuthController::update    'phone_no_02' => 'nullable|string'
 *
 *   So a perfectly valid request that simply omits a second phone number
 *   passes validation and then dies in the database:
 *
 *     SQLSTATE[HY000]: 1364 Field 'phone_no_02' doesn't have a default value
 *
 *   The same mismatch exists on customers.phone_no_02, which the customers
 *   migration DID mark nullable - so this is an oversight in the users table
 *   rather than a deliberate rule.
 *
 * WHY IT IS IN A SECURITY BRANCH
 *   Two reasons.
 *
 *   1. Before V-07, the raw SQLSTATE text above was returned to the client,
 *      leaking the table name, the column and the database engine. A defect
 *      that reliably triggers a 500 is a reliable way to make an application
 *      talk about its own internals.
 *
 *   2. It is availability. Creating staff accounts is the ONLY way in now that
 *      public registration has been removed (V-01), so an administrator who
 *      leaves the optional field blank cannot onboard anybody.
 *
 *   OWASP  A05:2021 Security Misconfiguration
 *   CWE    CWE-1289 Improper Validation of Unsafe Equivalence in Input
 *          (validation and storage disagreeing about the same field)
 *
 * Raw DDL rather than ->change(), because ->change() needs doctrine/dbal on
 * this Laravel line and adding a dependency to alter one column is a poor
 * trade - see V-12 on dependency surface.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'phone_no_02')) {
            return;
        }

        DB::statement('ALTER TABLE `users` MODIFY `phone_no_02` VARCHAR(255) NULL');
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'phone_no_02')) {
            return;
        }

        // Existing NULLs would block the NOT NULL constraint, so give them a
        // placeholder first rather than failing the rollback.
        DB::statement("UPDATE `users` SET `phone_no_02` = '' WHERE `phone_no_02` IS NULL");
        DB::statement('ALTER TABLE `users` MODIFY `phone_no_02` VARCHAR(255) NOT NULL');
    }
};

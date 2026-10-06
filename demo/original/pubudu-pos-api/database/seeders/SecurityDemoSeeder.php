<?php
// database/seeders/SecurityDemoSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Deterministic fixtures for the SE4030 security proof-of-concept suite.
 *
 * Creates two departments (branches) so that cross-tenant access (IDOR) can be
 * demonstrated, one admin, two employees in different branches, and enough
 * catalogue/stock/invoice data for the price-tampering and credit-adjustment
 * PoCs to run end to end.
 *
 *   php artisan db:seed --class=SecurityDemoSeeder
 *
 * Credentials are intentionally fixed and documented in evidence/poc/README.md.
 * They are local-only demo accounts and must never be seeded in production, so
 * the seeder aborts unless APP_ENV is local or testing.
 */
class SecurityDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command->error('SecurityDemoSeeder refuses to run outside local/testing.');

            return;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        foreach ([
            'invoice_items', 'invoice_stock_movements', 'invoices', 'credit_transactions',
            'discount_requests', 'grn_items', 'grns', 'customers', 'products',
            'personal_access_tokens', 'users', 'departments', 'inv_paras',
        ] as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                DB::table($table)->truncate();
            }
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // --- Branches -------------------------------------------------------
        $colomboId = DB::table('departments')->insertGetId([
            'department_code'    => 'DEP001',
            'department_name'    => 'Colombo Main Branch',
            'department_address' => '42 Galle Road, Colombo 03',
            'department_contact' => '0112345678',
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $kandyId = DB::table('departments')->insertGetId([
            'department_code'    => 'DEP002',
            'department_name'    => 'Kandy Branch',
            'department_address' => '17 Peradeniya Road, Kandy',
            'department_contact' => '0812345678',
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        // --- Staff ----------------------------------------------------------
        $mkUser = fn (array $a) => DB::table('users')->insertGetId($a + [
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $adminId = $mkUser([
            'user_code'     => 'EMP001',
            'full_name'     => 'Nimal Perera (Owner)',
            'nic_no'        => '801234567V',
            'phone_no_01'   => '0771111111',
            'phone_no_02'   => '0112345678',
            'username'      => 'admin',
            'password'      => Hash::make('Admin@Pass123'),
            'role'          => 'admin',
            'is_active'     => true,
            'department_id' => $colomboId,
        ]);

        $mkUser([
            'user_code'     => 'EMP002',
            'full_name'     => 'Kamal Silva (Colombo Cashier)',
            'nic_no'        => '952345678V',
            'phone_no_01'   => '0772222222',
            'phone_no_02'   => '0112345679',
            'username'      => 'cashier.colombo',
            'password'      => Hash::make('Cashier@Pass123'),
            'role'          => 'employee',
            'is_active'     => true,
            'department_id' => $colomboId,
        ]);

        $mkUser([
            'user_code'     => 'EMP003',
            'full_name'     => 'Sunil Fernando (Kandy Cashier)',
            'nic_no'        => '963456789V',
            'phone_no_01'   => '0773333333',
            'phone_no_02'   => '0812345679',
            'username'      => 'cashier.kandy',
            'password'      => Hash::make('Cashier@Pass123'),
            'role'          => 'employee',
            'is_active'     => true,
            'department_id' => $kandyId,
        ]);

        // A soon-to-be-terminated account: used to prove that deactivating a
        // user does not revoke the tokens they were already issued (V-06).
        $mkUser([
            'user_code'     => 'EMP004',
            'full_name'     => 'Ruwan Jayasuriya (to be terminated)',
            'nic_no'        => '974567890V',
            'phone_no_01'   => '0774444444',
            'phone_no_02'   => '0112345680',
            'username'      => 'terminated.staff',
            'password'      => Hash::make('Cashier@Pass123'),
            'role'          => 'employee',
            'is_active'     => true, // flipped to false by the PoC at runtime
            'department_id' => $colomboId,
        ]);

        // --- Customers (one per branch, so IDOR is observable) ---------------
        DB::table('customers')->insert([
            [
                'customer_code'  => 'CUS0001',
                'customer_name'  => 'Ajith Kumara',
                'address'        => '12 Lake Road, Colombo 05',
                'phone_no_01'    => '0765551111',
                'phone_no_02'    => null,
                'nic_no'         => '881234567V',
                'department_id'  => $colomboId,
                'credit_balance' => 45000.00,
                'credit_limit'   => 100000.00,
                'credit_enabled' => true,
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            [
                'customer_code'  => 'CUS0002',
                'customer_name'  => 'Dilani Wickramasinghe',
                'address'        => '88 Temple Street, Kandy',
                'phone_no_01'    => '0765552222',
                'phone_no_02'    => null,
                'nic_no'         => '892345678V',
                'department_id'  => $kandyId,
                'credit_balance' => 78500.00,
                'credit_limit'   => 150000.00,
                'credit_enabled' => true,
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            // Deliberately has NO invoices. The invoices.customer_code foreign
            // key masks the customer_code mass-assignment defect on customers
            // that do have invoices, so the PoC needs an unreferenced row to
            // show the business key really is rewritable.
            [
                'customer_code'  => 'CUS0003',
                'customer_name'  => 'Tharindu Rajapaksha',
                'address'        => '5 Marine Drive, Colombo 04',
                'phone_no_01'    => '0765553333',
                'phone_no_02'    => null,
                'nic_no'         => '903456789V',
                'department_id'  => $colomboId,
                'credit_balance' => 12000.00,
                'credit_limit'   => 50000.00,
                'credit_enabled' => true,
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
        ]);

        // --- Catalogue + stock ----------------------------------------------
        DB::table('products')->insert([
            'product_code' => 'PRD0001',
            'product_name' => 'Michelin Primacy 4 205/55R16',
            'description'  => 'Michelin Primacy 4 205/55R16 touring tyre',
            'brand_name'   => 'Michelin',
            'category'     => 'Tyre',
            'group'        => 'Car',
            'size'         => '205/55R16',
            'pattern'      => 'Primacy 4',
            'weight'       => '9.5kg',
            'type'         => 'tire',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        DB::table('grns')->insert([
            'grn_code'             => 'GRN0001',
            'grn_date'             => now()->toDateString(),
            'department_id'        => $colomboId,
            'total_cost'           => 240000.00,
            'total_selling_amount' => 320000.00,
            'total_profit'         => 80000.00,
            'total_item'           => 10,
            'grn_by'               => $adminId,
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        DB::table('grn_items')->insert([
            'grn_code'          => 'GRN0001',
            'product_code'      => 'PRD0001',
            'product_name'      => 'Michelin Primacy 4 205/55R16',
            'date'              => now()->toDateString(),
            'stock_price'       => 24000.00,
            'selling_price'     => 32000.00,
            'main_branch_price' => 32000.00,
            'discount1'         => 0,
            'discount2'         => 0,
            'discount3'         => 0,
            'discount4'         => 0,
            'actual_cost'       => 24000.00,
            'discount_price'    => 0,
            'qty'               => 10,
            'hisqty'            => 10,
            'subtotal'          => 240000.00,
            'status'            => 'on',
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        // --- One invoice per branch (targets for the cancel / IDOR PoCs) -----
        foreach ([
            ['INV0001', 'CUS0001', $colomboId, 'EMP002'],
            ['INV0002', 'CUS0002', $kandyId,   'EMP003'],
        ] as [$invNo, $custCode, $deptId, $by]) {
            DB::table('invoices')->insert([
                'inv_no'           => $invNo,
                'inv_date'         => now()->toDateString(),
                'customer_code'    => $custCode,
                'department_id'    => $deptId,
                'type'             => 'tire',
                'service'          => null,
                'payment_status'   => 'paid',
                'total_amount'     => 64000.00,
                'total_discount'   => 0.00,
                'net_total'        => 64000.00,
                'pay_amount'       => 64000.00,
                'balance'          => 0.00,
                'credit_allocated' => 0.00,
                'credit_paid'      => 0.00,
                'is_credit_paid'   => false,
                'inv_by'           => $by,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            DB::table('invoice_items')->insert([
                'inv_no'             => $invNo,
                'product_code'       => 'PRD0001',
                'grn_code'           => 'GRN0001',
                'product_name'       => 'Michelin Primacy 4 205/55R16',
                'date'               => now()->toDateString(),
                'selling_price'      => 32000.00,
                'discount'           => 0.00,
                'last_selling_price' => 32000.00,
                'qty'                => 2,
                'description'        => null,
                'type'               => 'product',
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        }

        // --- Document / counter parameters ----------------------------------
        // InvPara holds the next-number counters the controllers use to build
        // INV/GRN/CUS/USER codes. They must start AFTER the fixture rows above,
        // otherwise the first API-created record collides with a seeded one.
        DB::table('inv_paras')->insert([
            'company_name'  => 'Pubudu Tyres (Pvt) Ltd',
            'logo'          => 'logo.png',
            'address'       => '42 Galle Road, Colombo 03',
            'email'         => 'info@pubudutyres.example',
            'phone_no_01'   => '0112345678',
            'phone_no_02'   => '0112345679',
            'product_code'  => 2,
            'brand_code'    => 1,
            'category_code' => 1,
            'user_code'     => 5,
            'customer_code' => 4,
            'labour_code'   => 1,
            'grn_code'      => 2,
            'inv_code'      => 3,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        $this->command->info('SecurityDemoSeeder: 2 branches, 4 users, 3 customers, 1 GRN, 2 invoices.');
        $this->command->info('  admin            / Admin@Pass123    (admin,    Colombo)');
        $this->command->info('  cashier.colombo  / Cashier@Pass123  (employee, Colombo)');
        $this->command->info('  cashier.kandy    / Cashier@Pass123  (employee, Kandy)');
        $this->command->info('  terminated.staff / Cashier@Pass123  (employee, Colombo)');
    }
}

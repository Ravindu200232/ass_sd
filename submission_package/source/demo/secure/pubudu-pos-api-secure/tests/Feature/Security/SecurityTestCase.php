<?php
// tests/Feature/Security/SecurityTestCase.php

namespace Tests\Feature\Security;

use App\Models\Customer;
use App\Models\Department;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\InvPara;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Shared fixtures for the security regression suite.
 *
 * Mirrors SecurityDemoSeeder, but built through the models so a schema change
 * that breaks the application breaks these tests too. Two departments so
 * cross-tenant access is observable; an admin and one employee per branch.
 */
abstract class SecurityTestCase extends TestCase
{
    use RefreshDatabase;

    protected Department $colombo;
    protected Department $kandy;

    protected User $admin;
    protected User $colomboCashier;
    protected User $kandyCashier;

    protected Customer $colomboCustomer;
    protected Customer $kandyCustomer;

    protected Invoice $colomboInvoice;
    protected Invoice $kandyInvoice;

    /**
     * Exposed because MySQL's AUTO_INCREMENT is NOT transactional: RefreshDatabase
     * rolls each test back, but the counter keeps climbing, so the fixture's id is
     * 1 only in the first test of a run. Tests must build URLs from the real id.
     */
    protected Grn $colomboGrn;

    /** Catalogue price of the seeded product, in LKR. */
    protected const CATALOGUE_PRICE = 32000.00;

    protected function setUp(): void
    {
        parent::setUp();

        $this->colombo = Department::create([
            'department_code' => 'DEP001',
            'department_name' => 'Colombo Main Branch',
            'department_address' => '42 Galle Road, Colombo 03',
            'department_contact' => '0112345678',
        ]);

        $this->kandy = Department::create([
            'department_code' => 'DEP002',
            'department_name' => 'Kandy Branch',
            'department_address' => '17 Peradeniya Road, Kandy',
            'department_contact' => '0812345678',
        ]);

        $this->admin = $this->makeUser('EMP001', 'admin', 'admin', $this->colombo->id);
        $this->colomboCashier = $this->makeUser('EMP002', 'cashier.colombo', 'employee', $this->colombo->id);
        $this->kandyCashier = $this->makeUser('EMP003', 'cashier.kandy', 'employee', $this->kandy->id);

        $this->colomboCustomer = $this->makeCustomer('CUS0001', 'Ajith Kumara', $this->colombo->id, 45000);
        $this->kandyCustomer = $this->makeCustomer('CUS0002', 'Dilani Wickramasinghe', $this->kandy->id, 78500);

        Product::create([
            'product_code' => 'PRD0001',
            'product_name' => 'Michelin Primacy 4 205/55R16',
            'description' => 'Michelin Primacy 4 205/55R16 touring tyre',
            'brand_name' => 'Michelin',
            'category' => 'Tyre',
            'group' => 'Car',
            'size' => '205/55R16',
            'type' => 'tire',
        ]);

        $this->colomboGrn = Grn::create([
            'grn_code' => 'GRN0001',
            'grn_date' => now()->toDateString(),
            'department_id' => $this->colombo->id,
            'total_cost' => 240000,
            'total_selling_amount' => 320000,
            'total_profit' => 80000,
            'total_item' => 10,
            'grn_by' => $this->admin->id,
        ]);

        GrnItem::create([
            'grn_code' => 'GRN0001',
            'product_code' => 'PRD0001',
            'product_name' => 'Michelin Primacy 4 205/55R16',
            'date' => now()->toDateString(),
            'stock_price' => 24000,
            'selling_price' => self::CATALOGUE_PRICE,
            'main_branch_price' => self::CATALOGUE_PRICE,
            'actual_cost' => 24000,
            'qty' => 10,
            'hisqty' => 10,
            'subtotal' => 240000,
            'status' => 'on',
        ]);

        $this->colomboInvoice = $this->makeInvoice('INV0001', $this->colomboCustomer, $this->colombo->id, 'EMP002');
        $this->kandyInvoice = $this->makeInvoice('INV0002', $this->kandyCustomer, $this->kandy->id, 'EMP003');

        InvPara::create([
            'company_name' => 'Pubudu Tyres (Pvt) Ltd',
            'logo' => 'logo.png',
            'address' => '42 Galle Road, Colombo 03',
            'email' => 'info@pubudutyres.example',
            'phone_no_01' => '0112345678',
            'product_code' => 2,
            'brand_code' => 1,
            'category_code' => 1,
            'user_code' => 4,
            'customer_code' => 3,
            'labour_code' => 1,
            'grn_code' => 2,
            'inv_code' => 3,
        ]);
    }

    private function makeUser(string $code, string $username, string $role, int $departmentId): User
    {
        $user = new User([
            'user_code' => $code,
            'full_name' => ucfirst($username),
            'nic_no' => substr(md5($username), 0, 9) . 'V',
            'phone_no_01' => '0770000000',
            'phone_no_02' => '0110000000',
            'username' => $username,
            'role' => $role,
            'is_active' => true,
            'department_id' => $departmentId,
        ]);

        // Assigned directly: the 'hashed' cast handles the hashing, and
        // password is not in $fillable's spirit for tests to mass-assign.
        $user->password = 'Correct-Horse-Battery-9!';
        $user->save();

        return $user;
    }

    private function makeCustomer(string $code, string $name, int $departmentId, float $balance): Customer
    {
        // customer_code is intentionally NOT mass-assignable (V-04), so it is
        // set by direct assignment here exactly as the controller does.
        $customer = new Customer([
            'customer_name' => $name,
            'address' => 'Test address',
            'phone_no_01' => '0760000000',
            'nic_no' => substr(md5($code), 0, 9) . 'V',
            'department_id' => $departmentId,
            'credit_balance' => $balance,
            'credit_limit' => 150000,
            'credit_enabled' => true,
        ]);
        $customer->customer_code = $code;
        $customer->save();

        return $customer;
    }

    private function makeInvoice(string $invNo, Customer $customer, int $departmentId, string $by): Invoice
    {
        $invoice = Invoice::create([
            'inv_no' => $invNo,
            'inv_date' => now()->toDateString(),
            'customer_code' => $customer->customer_code,
            'department_id' => $departmentId,
            'type' => 'tire',
            'payment_status' => 'paid',
            'total_amount' => 64000,
            'total_discount' => 0,
            'net_total' => 64000,
            'pay_amount' => 64000,
            'balance' => 0,
            'credit_allocated' => 0,
            'credit_paid' => 0,
            'inv_by' => $by,
        ]);

        InvoiceItem::create([
            'inv_no' => $invNo,
            'product_code' => 'PRD0001',
            'grn_code' => 'GRN0001',
            'product_name' => 'Michelin Primacy 4 205/55R16',
            'date' => now()->toDateString(),
            'selling_price' => self::CATALOGUE_PRICE,
            'discount' => 0,
            'last_selling_price' => self::CATALOGUE_PRICE,
            'qty' => 2,
            'type' => 'product',
        ]);

        return $invoice;
    }

    /** The password every fixture user is created with. */
    protected function fixturePassword(): string
    {
        return 'Correct-Horse-Battery-9!';
    }
}

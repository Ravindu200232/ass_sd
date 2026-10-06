<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\LabourController;
use App\Http\Controllers\Api\GrnController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\DiscountRequestController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\AuditLogController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| V-01 / V-02 fix. Two things were wrong with this file.
|
| 1. POST /register sat outside every middleware group, and the controller
|    accepted a caller-supplied `role` (AuthController.php:163
|    'role' => 'required|in:admin,employee') which it wrote straight through
|    before minting a token. An anonymous request with "role":"admin" returned
|    a working administrator bearer token - confirmed against the original
|    application, which then listed every user in the system with it. That one
|    flaw collapsed every other access control here.
|
| 2. The application HAS a working role gate. app/Http/Middleware/
|    AdminMiddleware.php implements it correctly and app/Http/Kernel.php:67
|    registers it as 'admin'. It was never applied to a single route. A grep of
|    routes/ found exactly one middleware call in the whole file:
|    Route::middleware('auth:sanctum'). So authentication was the ONLY gate, and
|    any cashier could cancel invoices, rewrite stock quantities, reprice goods,
|    zero a customer's debt and read every profit report.
|
|    AuthServiceProvider had an empty $policies array and there was no
|    Gate::define anywhere in the project.
|
| The structure below is now explicit about who may reach what:
|
|   (public)                     login, Google OIDC handshake
|   auth:sanctum + active        anything a signed-in employee may do
|   auth:sanctum + active + admin  privileged operations
|
| 'active' is EnsureUserIsActive (V-06): is_active was checked only at login, so
| a deactivated employee's existing token kept working forever.
|
*/

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------
// Login is rate limited per username+IP (V-05b): the original had no limiter of
// its own, so the global 60/minute allowed unlimited password spraying. Note
// /register is NOT here any more - see the admin group.
Route::middleware('throttle:login')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Google OpenID Connect, Authorization Code + PKCE.
// The redirect endpoint hands out state/nonce/PKCE parameters and the callback
// exchanges the code. Both are unauthenticated by necessity - the user has no
// token yet - so both are throttled.
Route::middleware('throttle:oauth')->prefix('auth/google')->group(function () {
    Route::get('/redirect', [GoogleAuthController::class, 'redirect']);
    Route::post('/callback', [GoogleAuthController::class, 'callback']);
});

// ---------------------------------------------------------------------------
// Authenticated routes
// ---------------------------------------------------------------------------
Route::middleware(['auth:sanctum', 'active'])->group(function () {

    // ---- Session -----------------------------------------------------------
    Route::post('/logout',     [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    Route::get('/me',          [AuthController::class, 'me']);

    // Self-service password change. Requires the CURRENT password, which the
    // admin-driven update never did (V-05).
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Link or unlink a Google account to the signed-in user.
    Route::post('/auth/google/link',     [GoogleAuthController::class, 'link']);
    Route::delete('/auth/google/unlink', [GoogleAuthController::class, 'unlink']);

    // ---- Catalogue: readable by all staff, writable by admins only --------
    Route::get('categories',       [CategoryController::class, 'index']);
    Route::get('brands',           [BrandController::class, 'index']);
    Route::get('groups',           [GroupController::class, 'index']);
    Route::get('groups/{id}',      [GroupController::class, 'show']);
    Route::get('labours',          [LabourController::class, 'index']);
    Route::get('labours/{id}',     [LabourController::class, 'show']);
    Route::get('departments',      [DepartmentController::class, 'index']);
    Route::get('departments/{id}', [DepartmentController::class, 'show']);
    Route::get('services',         [ServiceController::class, 'index']);
    Route::get('services/{service}', [ServiceController::class, 'show']);

    Route::get('products',                    [ProductController::class, 'index']);
    Route::get('products/{id}',               [ProductController::class, 'show']);
    Route::get('products/{productCode}/stock', [ProductController::class, 'getStock']);

    // ---- Customers ---------------------------------------------------------
    // Cashiers need to create and look up customers to ring up a credit sale.
    // Every lookup is department-scoped in the controller (V-03).
    Route::prefix('customers')->group(function () {
        Route::get('/',        [CustomerController::class, 'index']);
        Route::post('/',       [CustomerController::class, 'store']);
        Route::get('/search',  [CustomerController::class, 'search']);
        Route::get('/{id}',    [CustomerController::class, 'show']);
        Route::put('/{id}',    [CustomerController::class, 'update']);

        Route::get('/{id}/credit-invoices',        [CustomerController::class, 'getCreditInvoices']);
        Route::get('/{id}/credit-payment-history', [CustomerController::class, 'creditPaymentHistory']);
        Route::get('/{id}/credit-transactions',    [CustomerController::class, 'creditTransactions']);

        // Taking a payment reduces what the customer owes and is a normal
        // counter activity, so cashiers keep it. Both paths write a
        // CreditTransaction ledger row.
        Route::post('/{id}/pay-credit',     [CustomerController::class, 'payCreditBalance']);
        Route::post('/{id}/credit-payment', [CustomerController::class, 'creditPayment']);
    });

    // ---- Stock: read -------------------------------------------------------
    Route::prefix('grns')->group(function () {
        Route::get('/',                              [GrnController::class, 'index']);
        Route::get('/stock',                         [GrnController::class, 'getAvailableStock']);
        Route::get('/product/{productCode}/batches', [GrnController::class, 'getProductBatches']);
        Route::get('/{id}',                          [GrnController::class, 'show']);
        Route::get('/code/{grnCode}',                [GrnController::class, 'getByCode']);
    });

    // ---- Invoices ----------------------------------------------------------
    // Creating and reading invoices IS the cashier's job. Cancellation is not -
    // see the admin group.
    Route::prefix('invoices')->group(function () {
        Route::get('/',                   [InvoiceController::class, 'index']);
        Route::post('/',                  [InvoiceController::class, 'store']);
        Route::get('/today',              [InvoiceController::class, 'todaySales']);
        Route::get('/monthly',            [InvoiceController::class, 'monthlySales']);
        Route::get('/{id}',               [InvoiceController::class, 'show']);
        Route::get('/invoice-no/{invNo}', [InvoiceController::class, 'getByInvoiceNo']);
        Route::get('/print/{invNo}',      [InvoiceController::class, 'printInvoice']);
    });

    // ---- Discount requests -------------------------------------------------
    // An employee raises and cancels their own; only an admin decides. The
    // approve/reject handlers already had inline role checks
    // (DiscountRequestController.php:156, :244) - the middleware makes that
    // visible at the route and means a future handler cannot forget.
    Route::prefix('discount-requests')->group(function () {
        Route::get('/',              [DiscountRequestController::class, 'index']);
        Route::post('/',             [DiscountRequestController::class, 'store']);
        Route::get('/pending-count', [DiscountRequestController::class, 'pendingCount']);
        Route::get('/{id}',          [DiscountRequestController::class, 'show']);
        Route::post('/{id}/cancel',  [DiscountRequestController::class, 'cancel']);

        Route::middleware('admin')->group(function () {
            Route::post('/{id}/approve', [DiscountRequestController::class, 'approve']);
            Route::post('/{id}/reject',  [DiscountRequestController::class, 'reject']);
        });
    });

    // ---- Reports a cashier legitimately needs ------------------------------
    // Only the ones that describe the shop floor. Everything that exposes
    // cost, margin or profit is in the admin group below - the frontend used to
    // fetch those for everyone and merely HIDE the columns (V-16), so the
    // figures were in the employee's browser regardless.
    Route::prefix('reports')->group(function () {
        Route::get('/stock',          [ReportController::class, 'stockReport']);
        Route::get('/low-stock',      [ReportController::class, 'lowStockReport']);
        Route::get('/stock-summary',  [ReportController::class, 'stockSummary']);
        Route::get('/filter-options', [ReportController::class, 'filterOptions']);
    });

    // -----------------------------------------------------------------------
    // ADMINISTRATOR ONLY
    // -----------------------------------------------------------------------
    Route::middleware('admin')->group(function () {

        // ---- User administration (V-01) ----------------------------------
        // /register moved here from the public section. It is the endpoint that
        // creates staff accounts and assigns roles; it was reachable with no
        // authentication at all.
        Route::post('/register',    [AuthController::class, 'register']);
        Route::get('/all-users',    [AuthController::class, 'getAllUsers']);
        Route::put('users/{id}',    [AuthController::class, 'update']);
        Route::delete('users/{id}', [AuthController::class, 'destroy']);

        // ---- Catalogue writes ---------------------------------------------
        Route::post('categories',        [CategoryController::class, 'store']);
        Route::put('categories/{id}',    [CategoryController::class, 'update']);
        Route::delete('categories/{id}', [CategoryController::class, 'destroy']);

        Route::post('brands',        [BrandController::class, 'store']);
        Route::put('brands/{id}',    [BrandController::class, 'update']);
        Route::delete('brands/{id}', [BrandController::class, 'destroy']);

        Route::post('groups',        [GroupController::class, 'store']);
        Route::put('groups/{id}',    [GroupController::class, 'update']);
        Route::delete('groups/{id}', [GroupController::class, 'destroy']);

        Route::post('labours',        [LabourController::class, 'store']);
        Route::put('labours/{id}',    [LabourController::class, 'update']);
        Route::delete('labours/{id}', [LabourController::class, 'destroy']);

        Route::post('departments',        [DepartmentController::class, 'store']);
        Route::put('departments/{id}',    [DepartmentController::class, 'update']);
        Route::delete('departments/{id}', [DepartmentController::class, 'destroy']);

        Route::post('products',              [ProductController::class, 'store']);
        Route::put('products/{id}',          [ProductController::class, 'update']);
        Route::delete('products/{id}',       [ProductController::class, 'destroy']);
        Route::post('products/import/bulk',  [ProductController::class, 'bulkImport']);
        Route::put('products/import/{id}',   [ProductController::class, 'updateForImport']);

        // Repricing a service or a stock batch sets the figure the invoice
        // endpoint now resolves sale prices from (V-10), so it is privileged
        // and audited (V-11).
        Route::post('services/update-price', [ServiceController::class, 'updatePrice']);
        Route::post('services',              [ServiceController::class, 'store']);
        Route::put('services/{service}',     [ServiceController::class, 'update']);
        Route::delete('services/{service}',  [ServiceController::class, 'destroy']);
        Route::post('services/import/bulk',  [ServiceController::class, 'bulkImport']);

        Route::post('grn-items/update-selling-price', [GrnController::class, 'updateSellingPrice']);
        Route::post('grn-items/update-price',         [GrnController::class, 'updatePrice']);

        // ---- Deleting a customer, and moving money without a sale ---------
        Route::delete('customers/{id}',            [CustomerController::class, 'destroy']);
        Route::post('customers/{id}/adjust-credit', [CustomerController::class, 'adjustCreditBalance']);

        // ---- Goods receipt and stock adjustment ---------------------------
        Route::prefix('grns')->group(function () {
            Route::post('/',                     [GrnController::class, 'store']);
            Route::post('/adjust-quantity',      [GrnController::class, 'adjustQuantity']);
            Route::post('/bulk-adjust-quantity', [GrnController::class, 'bulkAdjustQuantity']);

            Route::get('/{grnCode}/adjustment-history', [GrnController::class, 'getAdjustmentHistory']);
            Route::get('/adjustment-history/all',       [GrnController::class, 'getAllAdjustmentHistory']);
            Route::get('/adjustment-history/search',    [GrnController::class, 'searchAdjustments']);
            Route::get('/adjustment-statistics',        [GrnController::class, 'getAdjustmentStatistics']);

            // Self-approval of one's own stock return was possible before.
            Route::get('/returns/pending',        [GrnController::class, 'getPendingReturns']);
            Route::post('/returns/{id}/approve',  [GrnController::class, 'approveReturn']);
            Route::post('/returns/{id}/reject',   [GrnController::class, 'rejectReturn']);
        });

        // ---- Invoice cancellation ----------------------------------------
        // Voiding a sale returns the stock to the shelf and zeroes the revenue.
        // It is how theft is concealed in a POS, so it is admin-only and writes
        // a critical audit entry with the full pre-cancellation figures (V-11).
        Route::put('invoices/{id}', [InvoiceController::class, 'update']);

        // ---- Financial reporting ------------------------------------------
        Route::prefix('reports')->group(function () {
            Route::get('/products',          [ReportController::class, 'productsReport']);
            Route::get('/grn',               [ReportController::class, 'grnReport']);
            Route::get('/invoices',          [ReportController::class, 'invoicesReport']);
            Route::get('/customers',         [ReportController::class, 'customersReport']);
            Route::get('/daily-profit',      [ReportController::class, 'dailyProfit']);
            Route::get('/monthly-profit',    [ReportController::class, 'monthlyProfit']);
            Route::get('/daily-sales',       [ReportController::class, 'dailySales']);
            Route::get('/dashboard-summary', [ReportController::class, 'dashboardSummary']);
        });

        // ---- Security audit trail (V-11) ---------------------------------
        // Read-only. Entries are written solely by App\Support\AuditLogger, and
        // App\Models\AuditLog throws on update() and delete().
        Route::prefix('audit-logs')->group(function () {
            Route::get('/',        [AuditLogController::class, 'index']);
            Route::get('/summary', [AuditLogController::class, 'summary']);
        });
    });

    // Fallback
    Route::fallback(function () {
        return response()->json(['success' => false, 'message' => 'Endpoint not found'], 404);
    });
});

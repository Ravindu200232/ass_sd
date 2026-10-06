<?php
// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
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

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Routes
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected Routes (Require Authentication)
Route::middleware('auth:sanctum')->group(function () {

    // Auth Routes
    Route::post('/logout',       [AuthController::class, 'logout']);
    Route::get('/me',            [AuthController::class, 'me']);
    Route::get('/all-users',     [AuthController::class, 'getAllUsers']);
    Route::put('users/{id}',     [AuthController::class, 'update']);
    Route::delete('users/{id}',  [AuthController::class, 'destroy']);

    // Category Routes
    Route::prefix('categories')->group(function () {
        Route::get('/',      [CategoryController::class, 'index']);
        Route::post('/',     [CategoryController::class, 'store']);
        Route::put('/{id}',  [CategoryController::class, 'update']);
        Route::delete('/{id}', [CategoryController::class, 'destroy']);
    });

    // Brand Routes
    Route::prefix('brands')->group(function () {
        Route::get('/',      [BrandController::class, 'index']);
        Route::post('/',     [BrandController::class, 'store']);
        Route::put('/{id}',  [BrandController::class, 'update']);
        Route::delete('/{id}', [BrandController::class, 'destroy']);
    });

    // Product Routes
    Route::prefix('products')->group(function () {
        Route::get('/',                      [ProductController::class, 'index']);
        Route::post('/',                     [ProductController::class, 'store']);
        Route::post('/import/bulk',          [ProductController::class, 'bulkImport']);
        Route::get('/{id}',                  [ProductController::class, 'show']);
        Route::put('/{id}',                  [ProductController::class, 'update']);
        Route::delete('/{id}',               [ProductController::class, 'destroy']);
        Route::put('/import/{id}',           [ProductController::class, 'updateForImport']);
        Route::get('/{productCode}/stock',   [ProductController::class, 'getStock']);
    });

    // Service Routes
    Route::post('services/update-price', [ServiceController::class, 'updatePrice']);
    Route::apiResource('services', ServiceController::class);
    Route::post('services/import/bulk', [ServiceController::class, 'bulkImport']);

    // Customer Routes
    Route::prefix('customers')->group(function () {
        Route::get('/',                              [CustomerController::class, 'index']);
        Route::post('/',                             [CustomerController::class, 'store']);
        Route::get('/search',                        [CustomerController::class, 'search']);
        Route::get('/{id}',                          [CustomerController::class, 'show']);
        Route::put('/{id}',                          [CustomerController::class, 'update']);
        Route::delete('/{id}',                       [CustomerController::class, 'destroy']);
        Route::get('/{id}/credit-invoices',          [CustomerController::class, 'getCreditInvoices']);
        Route::post('/{id}/pay-credit',              [CustomerController::class, 'payCreditBalance']);
        Route::get('/{id}/credit-payment-history',   [CustomerController::class, 'creditPaymentHistory']);
        Route::post('/{id}/adjust-credit',           [CustomerController::class, 'adjustCreditBalance']);
        Route::get('/{id}/credit-transactions',      [CustomerController::class, 'creditTransactions']);
        Route::post('/{id}/credit-payment',          [CustomerController::class, 'creditPayment']);
    });

    // Group Routes
    Route::prefix('groups')->group(function () {
        Route::get('/',      [GroupController::class, 'index']);
        Route::post('/',     [GroupController::class, 'store']);
        Route::get('/{id}',  [GroupController::class, 'show']);
        Route::put('/{id}',  [GroupController::class, 'update']);
        Route::delete('/{id}', [GroupController::class, 'destroy']);
    });

    // Labour Routes
    Route::prefix('labours')->group(function () {
        Route::get('/',      [LabourController::class, 'index']);
        Route::post('/',     [LabourController::class, 'store']);
        Route::get('/{id}',  [LabourController::class, 'show']);
        Route::put('/{id}',  [LabourController::class, 'update']);
        Route::delete('/{id}', [LabourController::class, 'destroy']);
    });

    // Department Routes
    Route::prefix('departments')->group(function () {
        Route::get('/',      [DepartmentController::class, 'index']);
        Route::post('/',     [DepartmentController::class, 'store']);
        Route::get('/{id}',  [DepartmentController::class, 'show']);
        Route::put('/{id}',  [DepartmentController::class, 'update']);
        Route::delete('/{id}', [DepartmentController::class, 'destroy']);
    });

    // GRN Routes
    Route::prefix('grns')->group(function () {
        Route::get('/',                                   [GrnController::class, 'index']);
        Route::post('/',                                  [GrnController::class, 'store']);
        Route::get('/stock',                              [GrnController::class, 'getAvailableStock']);
        Route::get('/product/{productCode}/batches',      [GrnController::class, 'getProductBatches']);
        Route::get('/{id}',                               [GrnController::class, 'show']);
        Route::get('/code/{grnCode}',                     [GrnController::class, 'getByCode']);
        Route::post('/adjust-quantity',                   [GrnController::class, 'adjustQuantity']);
        Route::post('/bulk-adjust-quantity',              [GrnController::class, 'bulkAdjustQuantity']);
        Route::get('/{grnCode}/adjustment-history',       [GrnController::class, 'getAdjustmentHistory']);
        Route::get('/adjustment-history/all',             [GrnController::class, 'getAllAdjustmentHistory']);
        Route::get('/adjustment-history/search',          [GrnController::class, 'searchAdjustments']);
        Route::get('/adjustment-statistics',              [GrnController::class, 'getAdjustmentStatistics']);
        Route::get('/returns/pending',                    [GrnController::class, 'getPendingReturns']);
        Route::post('/returns/{id}/approve',              [GrnController::class, 'approveReturn']);
        Route::post('/returns/{id}/reject',               [GrnController::class, 'rejectReturn']);
    });

    // GRN Item Price Routes
    Route::prefix('grn-items')->group(function () {
        // Legacy: update selling_price only
        Route::post('/update-selling-price', [GrnController::class, 'updateSellingPrice']);

        // ✅ NEW: update either selling_price OR actual_cost
        Route::post('/update-price',         [GrnController::class, 'updatePrice']);
    });

// Invoice Routes
Route::prefix('invoices')->group(function () {
    Route::get('/',                          [InvoiceController::class, 'index']);
    Route::post('/',                         [InvoiceController::class, 'store']);
    Route::get('/today',                     [InvoiceController::class, 'todaySales']);
    Route::get('/monthly',                   [InvoiceController::class, 'monthlySales']);
    Route::get('/{id}',                      [InvoiceController::class, 'show']);
    Route::put('/{id}',                      [InvoiceController::class, 'update']); // ← ADD THIS
    Route::get('/invoice-no/{invNo}',        [InvoiceController::class, 'getByInvoiceNo']);
    Route::get('/print/{invNo}',             [InvoiceController::class, 'printInvoice']);
});

    // Discount Request Routes
    Route::prefix('discount-requests')->group(function () {
        Route::get('/',                  [DiscountRequestController::class, 'index']);
        Route::post('/',                 [DiscountRequestController::class, 'store']);
        Route::get('/pending-count',     [DiscountRequestController::class, 'pendingCount']);
        Route::get('/{id}',              [DiscountRequestController::class, 'show']);
        Route::post('/{id}/approve',     [DiscountRequestController::class, 'approve']);
        Route::post('/{id}/reject',      [DiscountRequestController::class, 'reject']);
    });

    // Reports Routes
    Route::prefix('reports')->group(function () {
        Route::get('/carts',             [ReportController::class, 'cartsReport']);
        Route::get('/products',          [ReportController::class, 'productsReport']);
        Route::get('/grn',               [ReportController::class, 'grnReport']);
        Route::get('/invoices',          [ReportController::class, 'invoicesReport']);
        Route::get('/customers',         [ReportController::class, 'customersReport']);
        Route::get('/stock',             [ReportController::class, 'stockReport']);
        Route::get('/low-stock',         [ReportController::class, 'lowStockReport']);
        Route::get('/daily-profit',      [ReportController::class, 'dailyProfit']);
        Route::get('/monthly-profit',    [ReportController::class, 'monthlyProfit']);
        Route::get('/daily-sales',       [ReportController::class, 'dailySales']);
        Route::get('/stock-summary',     [ReportController::class, 'stockSummary']);
        Route::get('/dashboard-summary', [ReportController::class, 'dashboardSummary']);

        Route::get('/filter-options', function () {
            $products    = \App\Models\Product::select('product_code', 'product_name')->get();
            $customers   = \App\Models\Customer::select('customer_code', 'customer_name')->get();
            $departments = \App\Models\Department::select('id', 'department_name')->get();
            return response()->json([
                'success' => true,
                'data'    => compact('products', 'customers', 'departments'),
            ]);
        });
    });

    // Fallback
    Route::fallback(function () {
        return response()->json(['success' => false, 'message' => 'Endpoint not found'], 404);
    });
});

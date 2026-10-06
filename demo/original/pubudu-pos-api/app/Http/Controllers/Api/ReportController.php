<?php
// app/Http/Controllers/Api/ReportController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceStockMovement;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Cart;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // Carts Report
    public function cartsReport(Request $request)
    {
        $query = Cart::with(['customer', 'items'])
            ->whereBetween('created_at', [$request->from_date, $request->to_date]);

        if ($request->customer_code) {
            $query->where('customer_code', $request->customer_code);
        }

        $carts = $query->get()->map(function($cart) {
            return [
                'id' => $cart->id,
                'customer_name' => $cart->customer?->customer_name,
                'items_count' => $cart->items->count(),
                'total_amount' => $cart->items->sum('total'),
                'status' => $cart->status,
                'created_at' => $cart->created_at
            ];
        });

        return response()->json([
            'success' => true,
            'data' => ['carts' => $carts]
        ]);
    }

    // Products Sales Report
    public function productsReport(Request $request)
    {
        $query = InvoiceItem::with('product')
            ->whereHas('invoice', function($q) use ($request) {
                $q->whereBetween('inv_date', [$request->from_date, $request->to_date])
                    ->where('type', '!=', 'cancel');
            });

        if ($request->product_code) {
            $query->where('product_code', $request->product_code);
        }

        $products = $query->get()->groupBy('product_code')->map(function($items, $productCode) {
            $firstItem = $items->first();
            return [
                'product_code' => $productCode,
                'product_name' => $firstItem->product_name,
                'quantity_sold' => $items->sum('qty'),
                'total_sales' => $items->sum(function($item) {
                    return ($item->selling_price - $item->discount) * $item->qty;
                }),
                'average_price' => $items->avg('selling_price')
            ];
        })->values();

        $summary = [
            'total_products' => $products->count(),
            'total_quantity' => $products->sum('quantity_sold'),
            'total_sales' => $products->sum('total_sales')
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products,
                'summary' => $summary
            ]
        ]);
    }

    // GRN Report
    public function grnReport(Request $request)
    {
        $query = Grn::with(['department', 'items'])
            ->whereBetween('grn_date', [$request->from_date, $request->to_date]);

        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        if ($request->product_code) {
            $query->whereHas('items', function($q) use ($request) {
                $q->where('product_code', $request->product_code);
            });
        }

        $grns = $query->get()->map(function($grn) {
            return [
                'grn_code' => $grn->grn_code,
                'grn_date' => $grn->grn_date,
                'department_name' => $grn->department->department_name,
                'total_items' => $grn->items->count(),
                'total_cost' => $grn->total_cost,
                'total_selling' => $grn->total_selling_amount,
                'total_profit' => $grn->total_profit
            ];
        });

        return response()->json([
            'success' => true,
            'data' => ['grns' => $grns]
        ]);
    }

    // Invoices Report
    public function invoicesReport(Request $request)
    {
        $query = Invoice::with('customer')
            ->whereBetween('inv_date', [$request->from_date, $request->to_date])
            ->where('type', '!=', 'cancel');

        if ($request->customer_code) {
            $query->where('customer_code', $request->customer_code);
        }

        if ($request->payment_status && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->product_code) {
            $query->whereHas('items', function($q) use ($request) {
                $q->where('product_code', $request->product_code);
            });
        }

        $invoices = $query->get()->map(function($invoice) {
            return [
                'inv_no' => $invoice->inv_no,
                'inv_date' => $invoice->inv_date,
                'customer_name' => $invoice->customer?->customer_name ?? 'Cash Sale',
                'net_total' => $invoice->net_total,
                'payment_status' => $invoice->payment_status,
                'payment_method' => $invoice->payment_method
            ];
        });

        return response()->json([
            'success' => true,
            'data' => ['invoices' => $invoices]
        ]);
    }

    // Customers Report
    public function customersReport(Request $request)
    {
        $query = Customer::with(['invoices' => function($q) use ($request) {
            $q->whereBetween('inv_date', [$request->from_date, $request->to_date])
                ->where('type', '!=', 'cancel');
        }]);

        if ($request->customer_code) {
            $query->where('customer_code', $request->customer_code);
        }

        $customers = $query->get()->map(function($customer) {
            $invoices = $customer->invoices;
            
            return [
                'customer_code' => $customer->customer_code,
                'customer_name' => $customer->customer_name,
                'phone_no_01' => $customer->phone_no_01,
                'total_invoices' => $invoices->count(),
                'total_spent' => $invoices->sum('net_total'),
                'credit_balance' => $customer->credit_balance
            ];
        });

        return response()->json([
            'success' => true,
            'data' => ['customers' => $customers]
        ]);
    }

    // Stock Report
    public function stockReport(Request $request)
    {
        $query = Product::with(['grnItems' => function($q) {
            $q->where('status', 'on')->where('qty', '>', 0);
        }]);

        if ($request->product_code) {
            $query->where('product_code', $request->product_code);
        }

        $stock = $query->get()->map(function($product) {
            $grnItems = $product->grnItems;
            $lastGrn = $grnItems->sortByDesc('date')->first();
            
            return [
                'product_code' => $product->product_code,
                'product_name' => $product->product_name,
                'current_stock' => $grnItems->sum('qty'),
                'average_cost' => $grnItems->avg('actual_cost'),
                'stock_value' => $grnItems->sum(function($item) {
                    return $item->actual_cost * $item->qty;
                }),
                'last_grn_date' => $lastGrn?->date
            ];
        });

        return response()->json([
            'success' => true,
            'data' => ['stock' => $stock]
        ]);
    }

    // Daily Profit Report (Enhanced)
    public function dailyProfit(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $invoices = Invoice::with('items')
            ->whereDate('inv_date', $date)
            ->where('type', '!=', 'cancel')
            ->get();

        $totalRevenue = $invoices->sum('net_total');
        $totalDiscount = $invoices->sum('total_discount');
        
        $totalCost = $this->calculateCostOfGoodsSold($invoices);

        $grossProfit = $totalRevenue - $totalCost;
        $profitMargin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'total_revenue' => round($totalRevenue, 2),
                'total_cost' => round($totalCost, 2),
                'gross_profit' => round($grossProfit, 2),
                'profit_margin' => round($profitMargin, 2),
                'total_discount' => round($totalDiscount, 2),
                'total_invoices' => $invoices->count(),
                'invoices' => $invoices
            ]
        ]);
    }

    // Monthly Profit Report (Enhanced)
    public function monthlyProfit(Request $request)
    {
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        $invoices = Invoice::with('items')
            ->whereYear('inv_date', $year)
            ->whereMonth('inv_date', $month)
            ->where('type', '!=', 'cancel')
            ->get();

        $totalRevenue = $invoices->sum('net_total');
        $totalDiscount = $invoices->sum('total_discount');
        
        $totalCost = $this->calculateCostOfGoodsSold($invoices);

        $grossProfit = $totalRevenue - $totalCost;
        $profitMargin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;

        // Daily breakdown
        $dailyBreakdown = $invoices->groupBy(function ($invoice) {
            return $invoice->inv_date->format('Y-m-d');
        })->map(function ($dayInvoices) {
            return [
                'date' => $dayInvoices->first()->inv_date->format('Y-m-d'),
                'revenue' => $dayInvoices->sum('net_total'),
                'invoices_count' => $dayInvoices->count()
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $month,
                'year' => $year,
                'total_revenue' => round($totalRevenue, 2),
                'total_cost' => round($totalCost, 2),
                'gross_profit' => round($grossProfit, 2),
                'profit_margin' => round($profitMargin, 2),
                'total_discount' => round($totalDiscount, 2),
                'total_invoices' => $invoices->count(),
                'daily_breakdown' => $dailyBreakdown
            ]
        ]);
    }

    // Daily Sales Report (Enhanced)
    public function dailySales(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $invoices = Invoice::with(['items', 'customer'])
            ->whereDate('inv_date', $date)
            ->where('type', '!=', 'cancel')
            ->get();

        $totalSales = $invoices->sum('net_total');
        $totalDiscount = $invoices->sum('total_discount');
        $totalPaid = $invoices->sum('pay_amount');
        $totalBalance = $invoices->sum('balance');

        // Product-wise sales
        $productSales = InvoiceItem::whereHas('invoice', function ($query) use ($date) {
                $query->whereDate('inv_date', $date)
                    ->where('type', '!=', 'cancel');
            })
            ->select(
                'product_code',
                'product_name',
                DB::raw('SUM(qty) as total_qty'),
                DB::raw('SUM((selling_price - discount) * qty) as total_amount')
            )
            ->groupBy('product_code', 'product_name')
            ->orderBy('total_amount', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date,
                'total_sales' => round($totalSales, 2),
                'total_discount' => round($totalDiscount, 2),
                'total_paid' => round($totalPaid, 2),
                'total_balance' => round($totalBalance, 2),
                'total_invoices' => $invoices->count(),
                'invoices' => $invoices,
                'product_sales' => $productSales
            ]
        ]);
    }

    // Stock Summary Report (Enhanced)
    public function stockSummary()
    {
        $stock = GrnItem::with('product')
            ->where('status', 'on')
            ->where('qty', '>', 0)
            ->get()
            ->groupBy('product_code')
            ->map(function ($items, $productCode) {
                $totalQty = $items->sum('qty');
                $totalValue = $items->sum(function ($item) {
                    return $item->qty * $item->actual_cost;
                });
                $avgCost = $totalQty > 0 ? $totalValue / $totalQty : 0;

                return [
                    'product_code' => $productCode,
                    'product_name' => $items->first()->product_name,
                    'total_qty' => $totalQty,
                    'avg_cost' => round($avgCost, 2),
                    'total_value' => round($totalValue, 2),
                    'batches_count' => $items->count()
                ];
            })
            ->values();

        $totalStockValue = $stock->sum('total_value');

        return response()->json([
            'success' => true,
            'data' => [
                'total_stock_value' => round($totalStockValue, 2),
                'total_products' => $stock->count(),
                'stock' => $stock
            ]
        ]);
    }

    // Dashboard Summary
    public function dashboardSummary()
    {
        $today = now()->toDateString();
        $thisMonth = now()->month;
        $thisYear = now()->year;

        // Today's summary
        $todayInvoices = Invoice::whereDate('inv_date', $today)
            ->where('type', '!=', 'cancel')
            ->get();
        $todaySales = $todayInvoices->sum('net_total');
        $todayInvoicesCount = $todayInvoices->count();

        // This month's summary
        $monthInvoices = Invoice::whereYear('inv_date', $thisYear)
            ->whereMonth('inv_date', $thisMonth)
            ->where('type', '!=', 'cancel')
            ->get();
        $monthSales = $monthInvoices->sum('net_total');
        $monthInvoicesCount = $monthInvoices->count();

        // Stock summary
        $totalStock = GrnItem::where('status', 'on')->sum('qty');
        $stockValue = GrnItem::where('status', 'on')
            ->get()
            ->sum(function ($item) {
                return $item->qty * $item->actual_cost;
            });

        // Pending payments
        $pendingPayments = Invoice::where('type', '!=', 'cancel')
            ->where(function ($query) {
                $query->where('payment_status', 'unpaid')
                    ->orWhere('payment_status', 'partial');
            })
            ->sum('balance');

        return response()->json([
            'success' => true,
            'data' => [
                'today' => [
                    'sales' => round($todaySales, 2),
                    'invoices_count' => $todayInvoicesCount
                ],
                'this_month' => [
                    'sales' => round($monthSales, 2),
                    'invoices_count' => $monthInvoicesCount
                ],
                'stock' => [
                    'total_items' => $totalStock,
                    'total_value' => round($stockValue, 2)
                ],
                'pending_payments' => round($pendingPayments, 2)
            ]
        ]);
    }

    // Low Stock Report (Stock below 10)
public function lowStockReport(Request $request)
{
    $query = Product::with(['grnItems' => function($q) {
        $q->where('status', 'on')->where('qty', '>', 0);
    }]);

    if ($request->product_code && $request->product_code !== 'all') {
        $query->where('product_code', $request->product_code);
    }

    $lowStock = $query->get()->map(function($product) {
        $grnItems = $product->grnItems;
        $totalStock = $grnItems->sum('qty');
        $lastGrn = $grnItems->sortByDesc('date')->first();
        
        $totalValue = $grnItems->sum(function($item) {
            return $item->qty * $item->actual_cost;
        });
        
        $avgCost = $totalStock > 0 ? $totalValue / $totalStock : 0;

        return [
            'product_code' => $product->product_code,
            'product_name' => $product->product_name,
            'current_stock' => $totalStock,
            'average_cost' => round($avgCost, 2),
            'stock_value' => round($totalValue, 2),
            'last_grn_date' => $lastGrn?->date
        ];
    })->filter(function($item) {
        return $item['current_stock'] > 0 && $item['current_stock'] < 10;
    })->values();

    $criticalItems = $lowStock->filter(fn($item) => $item['current_stock'] <= 5)->count();
    $lowItems = $lowStock->filter(fn($item) => $item['current_stock'] > 5 && $item['current_stock'] < 10)->count();

    $summary = [
        'total_low_stock' => $lowStock->count(),
        'critical_items' => $criticalItems,
        'low_items' => $lowItems,
        'total_value_at_risk' => $lowStock->sum('stock_value')
    ];

    return response()->json([
        'success' => true,
        'data' => [
            'low_stock' => $lowStock,
            'summary' => $summary
        ]
    ]);
}

    private function calculateCostOfGoodsSold($invoices): float
    {
        if ($invoices->isEmpty()) {
            return 0;
        }

        $invoiceNos = $invoices->pluck('inv_no')->filter()->values();
        $movementCosts = InvoiceStockMovement::whereIn('inv_no', $invoiceNos)
            ->where('movement_type', 'sale')
            ->selectRaw('inv_no, SUM(qty * unit_cost) as cost')
            ->groupBy('inv_no')
            ->pluck('cost', 'inv_no');

        $totalCost = (float) $movementCosts->sum();

        $legacyInvoices = $invoices->filter(function ($invoice) use ($movementCosts) {
            return !$movementCosts->has($invoice->inv_no);
        });

        foreach ($legacyInvoices as $invoice) {
            foreach ($invoice->items as $item) {
                $totalCost += $this->estimateLegacyItemCost($item);
            }
        }

        return round($totalCost, 2);
    }

    private function estimateLegacyItemCost($item): float
    {
        if (($item->type ?? 'product') === 'service' || !$item->grn_code || $item->grn_code === 'SERVICE') {
            return 0;
        }

        $tokens = collect(explode(',', $item->grn_code))
            ->map(fn ($code) => trim($code))
            ->filter()
            ->values();

        if ($tokens->isEmpty()) {
            return 0;
        }

        $remainingQty = (float) $item->qty;
        $cost = 0;

        foreach ($tokens as $token) {
            if ($remainingQty <= 0.0001) {
                break;
            }

            [$code, $qtyFromToken] = array_pad(explode(':', $token, 2), 2, null);
            $grnItem = GrnItem::where('grn_code', trim($code))
                ->where('product_code', $item->product_code)
                ->first();

            if (!$grnItem) {
                continue;
            }

            if ($qtyFromToken !== null && is_numeric($qtyFromToken)) {
                $allocatedQty = min($remainingQty, (float) $qtyFromToken);
            } elseif ($tokens->count() === 1) {
                $allocatedQty = $remainingQty;
            } else {
                $allocatedQty = min($remainingQty, (float) ($grnItem->hisqty ?: $remainingQty));
            }

            $cost += $allocatedQty * (float) $grnItem->actual_cost;
            $remainingQty = round($remainingQty - $allocatedQty, 3);
        }

        return round($cost, 2);
    }
}

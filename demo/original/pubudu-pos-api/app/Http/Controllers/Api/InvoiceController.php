<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InvoiceStockMovement;
use App\Models\GrnItem;
use App\Models\InvPara;
use App\Models\Customer;
use App\Models\CreditTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index()
    {
        $invoices = Invoice::with(['items.stockMovements', 'customer', 'createdBy', 'department'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $invoices]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'inv_date' => 'required|date',
            'customer_type' => 'required|in:cash,save',
            'customer_code' => 'required_unless:customer_type,cash|string|exists:customers,customer_code',
            'payment_status' => 'required|in:credit,card,bank,slip,cash',
            'pay_amount' => 'required|numeric|min:0',
            'department_id' => 'required|exists:departments,id',
            'type' => 'required|in:tire,other,tire and other',
            'service' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_code' => 'required|string',
            'items.*.product_name' => 'required|string',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.selling_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'items.*.description' => 'nullable|string',
            'items.*.type' => 'nullable|in:product,service',
        ]);

        DB::beginTransaction();

        try {
            $invPara = InvPara::lockForUpdate()->first();
            if (!$invPara) {
                throw new \Exception('Invoice parameters are not configured.');
            }

            $invNo = 'INV' . str_pad($invPara->inv_code, 4, '0', STR_PAD_LEFT);
            $invPara->increment('inv_code');

            $totalAmount = 0;
            $totalDiscount = 0;
            foreach ($request->items as $item) {
                $qty = (float) $item['qty'];
                $sellingPrice = (float) $item['selling_price'];
                $discount = (float) ($item['discount'] ?? 0);

                $totalAmount += round($sellingPrice * $qty, 2);
                $totalDiscount += round($discount * $qty, 2);
            }

            $netBeforeSurcharge = max(0, round($totalAmount - $totalDiscount, 2));
            $cardSurcharge = $request->payment_status === 'card'
                ? round($netBeforeSurcharge * 0.03, 2)
                : 0;
            $netTotal = round($netBeforeSurcharge + $cardSurcharge, 2);
            $payAmount = min(max(0, (float) $request->pay_amount), $netTotal);
            $balance = max(0, round($netTotal - $payAmount, 2));

            $creditAllocated = 0;

            $customerCode = null;
            if ($request->customer_type === 'save') {
                $customerCode = $request->customer_code;
                $customerExists = Customer::where('customer_code', $customerCode)->exists();
                
                if (!$customerExists) {
                    throw new \Exception("Customer with code '{$customerCode}' does not exist.");
                }
            }

            $invoice = Invoice::create([
                'inv_no' => $invNo,
                'inv_date' => $request->inv_date,
                'customer_type' => $request->customer_type,
                'customer_code' => $customerCode,
                'department_id' => $request->department_id,
                'type' => $request->type,
                'service' => $request->service,
                'payment_status' => $request->payment_status,
                'total_amount' => $totalAmount,
                'total_discount' => $totalDiscount,
                'net_total' => $netTotal,
                'pay_amount' => $payAmount,
                'balance' => $balance,
                'credit_allocated' => 0,
                'credit_paid' => 0,
                'inv_by' => $request->user()->user_code,
            ]);

            foreach ($request->items as $item) {
                $itemType = $item['type'] ?? 'product';
                $qty = (float) $item['qty'];
                $sellingPrice = (float) $item['selling_price'];
                $discount = (float) ($item['discount'] ?? 0);
                $allocations = [];
                $grnCode = 'SERVICE';

                if ($itemType === 'product') {
                    $allocations = $this->allocateStockForInvoiceItem(
                        $item,
                        (int) $request->department_id
                    );
                    $grnCode = collect($allocations)
                        ->pluck('grn_code')
                        ->unique()
                        ->implode(',');
                }

                $invoiceItem = InvoiceItem::create([
                    'inv_no' => $invNo,
                    'product_code' => $item['product_code'],
                    'grn_code' => $grnCode,
                    'product_name' => $item['product_name'],
                    'date' => $request->inv_date,
                    'selling_price' => $sellingPrice,
                    'discount' => $discount,
                    'last_selling_price' => max(0, $sellingPrice - $discount),
                    'qty' => $qty,
                    'description' => $item['description'] ?? $item['product_name'],
                    'type' => $itemType,
                ]);

                foreach ($allocations as $allocation) {
                    InvoiceStockMovement::create([
                        'inv_no' => $invNo,
                        'invoice_item_id' => $invoiceItem->id,
                        'grn_item_id' => $allocation['grn_item_id'],
                        'grn_code' => $allocation['grn_code'],
                        'product_code' => $item['product_code'],
                        'product_name' => $item['product_name'],
                        'department_id' => (int) $request->department_id,
                        'movement_type' => 'sale',
                        'qty' => $allocation['qty'],
                        'unit_cost' => $allocation['unit_cost'],
                        'unit_selling_price' => $sellingPrice,
                        'unit_discount' => $discount,
                        'movement_date' => $request->inv_date,
                        'created_by' => $request->user()->user_code,
                    ]);
                }
            }

            if ($request->payment_status === 'credit' && $request->customer_type === 'save' && $customerCode) {
                $customer = Customer::where('customer_code', $customerCode)->lockForUpdate()->first();
                
                if ($customer && $customer->credit_enabled) {
                    $availableCredit = $customer->credit_limit - $customer->credit_balance;
                    $creditToUse = min($balance, $availableCredit);
                    
                    if ($creditToUse > 0) {
                        $previousBalance = $customer->credit_balance;
                        $newBalance = $previousBalance + $creditToUse;
                        
                        // Update customer credit balance
                        $customer->credit_balance = $newBalance;
                        $customer->save();

                        // Update the invoice with credit_allocated
                        $invoice->update([
                            'credit_allocated' => $creditToUse,
                            'remaining_balance' => $balance - $creditToUse
                        ]);

                        // Create credit transaction record
                        CreditTransaction::create([
                            'customer_code' => $customer->customer_code,
                            'type' => 'invoice',
                            'amount' => $creditToUse,
                            'previous_balance' => $previousBalance,
                            'new_balance' => $newBalance,
                            'reference' => $invNo,
                            'notes' => 'Invoice created with credit allocation',
                            'transaction_date' => $request->inv_date,
                        ]);

                        $creditAllocated = $creditToUse;
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Invoice created successfully',
                'data' => $invoice->fresh(['items.stockMovements', 'customer', 'department']),
                'credit_allocated' => $creditAllocated
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        if (!is_numeric($id) || $id <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid invoice ID.'
            ], 400);
        }

        $invoice = Invoice::with(['items.stockMovements', 'customer', 'createdBy', 'department'])
            ->find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $invoice
        ]);
    }

    public function getByInvoiceNo($invNo)
    {
        $invoice = Invoice::with(['items.stockMovements', 'customer', 'createdBy', 'department'])
            ->where('inv_no', $invNo)
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $invoice]);
    }

    public function printInvoice($invNo)
    {
        $invoice = Invoice::with(['items.stockMovements', 'customer', 'createdBy', 'department'])
            ->where('inv_no', $invNo)
            ->firstOrFail();

        $company = InvPara::first();

        return response()->json([
            'success' => true,
            'data' => [
                'invoice' => $invoice,
                'company' => $company
            ]
        ]);
    }

    public function todaySales()
    {
        $today = now()->toDateString();

        $sales = Invoice::whereDate('inv_date', $today)
            ->where('type', '!=', 'cancel')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $today,
                'total_sales' => $sales->sum('net_total'),
                'total_invoices' => $sales->count(),
                'total_paid' => $sales->sum('pay_amount'),
                'total_unpaid' => $sales->sum('balance'),
                'invoices' => $sales
            ]
        ]);
    }

    public function monthlySales(Request $request)
    {
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        $sales = Invoice::whereYear('inv_date', $year)
            ->whereMonth('inv_date', $month)
            ->where('type', '!=', 'cancel')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $month,
                'year' => $year,
                'total_sales' => $sales->sum('net_total'),
                'total_invoices' => $sales->count(),
                'total_discount' => $sales->sum('total_discount'),
                'invoices' => $sales
            ]
        ]);
    }

    public function recordCreditPayment(Request $request, $customerId)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($request, $customerId) {
            $customer = Customer::findOrFail($customerId);
            
            if ($customer->credit_balance <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer has no credit balance'
                ], 400);
            }

            $paymentAmount = min($request->amount, $customer->credit_balance);
            $previousBalance = $customer->credit_balance;
            
            // Update customer credit balance
            $customer->decrement('credit_balance', $paymentAmount);
            
            // Create credit transaction record
            CreditTransaction::create([
                'customer_code' => $customer->customer_code,
                'type' => 'payment',
                'amount' => $paymentAmount,
                'previous_balance' => $previousBalance,
                'new_balance' => $customer->credit_balance,
                'reference' => $request->reference ?? 'PAY-' . time(),
                'notes' => $request->notes,
                'transaction_date' => $request->payment_date
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Credit payment recorded successfully',
                'data' => $customer
            ]);
        });
    }
    
    
public function update(Request $request, $id)
{
    // Guard: only integer IDs accepted
    if (!is_numeric($id) || $id <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid invoice ID.'
        ], 400);
    }

    DB::beginTransaction();

    try {
        $invoice = Invoice::with('items')->find($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.'
            ], 404);
        }

        // Prevent cancelling twice
        if ($invoice->type === 'cancel') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice already cancelled.'
            ], 400);
        }

        if ($request->type !== 'cancel') {
            return response()->json([
                'success' => false,
                'message' => 'Invalid update request. Only cancellation is supported.'
            ], 400);
        }

        $saleMovements = InvoiceStockMovement::where('inv_no', $invoice->inv_no)
            ->where('movement_type', 'sale')
            ->lockForUpdate()
            ->get();

        if ($saleMovements->isNotEmpty()) {
            foreach ($saleMovements as $movement) {
                $batch = GrnItem::where('id', $movement->grn_item_id)
                    ->lockForUpdate()
                    ->first();

                if (!$batch) {
                    $batch = GrnItem::where('grn_code', $movement->grn_code)
                        ->where('product_code', $movement->product_code)
                        ->lockForUpdate()
                        ->first();
                }

                if (!$batch) {
                    throw new \Exception("Cannot restore stock. GRN batch {$movement->grn_code} was not found.");
                }

                $this->restoreStockBatch($batch, (float) $movement->qty);

                InvoiceStockMovement::create([
                    'inv_no' => $invoice->inv_no,
                    'invoice_item_id' => $movement->invoice_item_id,
                    'grn_item_id' => $batch->id,
                    'grn_code' => $batch->grn_code,
                    'product_code' => $movement->product_code,
                    'product_name' => $movement->product_name,
                    'department_id' => $movement->department_id,
                    'movement_type' => 'sale_cancel',
                    'qty' => $movement->qty,
                    'unit_cost' => $movement->unit_cost,
                    'unit_selling_price' => $movement->unit_selling_price,
                    'unit_discount' => $movement->unit_discount,
                    'movement_date' => now()->toDateString(),
                    'created_by' => $request->user()->user_code,
                ]);
            }
        } else {
            foreach ($invoice->items as $item) {
                $this->restoreLegacyInvoiceItemStock($item);
            }
        }

        // Zero-out all invoice items
        foreach ($invoice->items as $item) {
            $item->selling_price      = 0;
            $item->discount           = 0;
            $item->last_selling_price = 0;
            $item->save();
        }

        if ($invoice->credit_allocated > 0 && $invoice->customer_code) {
            $customer = Customer::where('customer_code', $invoice->customer_code)->lockForUpdate()->first();
            if ($customer) {
                $previousBalance = $customer->credit_balance;
                $outstandingCredit = max(0, (float) $invoice->credit_allocated - (float) $invoice->credit_paid);
                $reversalAmount = min((float) $customer->credit_balance, $outstandingCredit);
                $customer->credit_balance = max(0, (float) $customer->credit_balance - $reversalAmount);
                $customer->save();

                if ($reversalAmount > 0) {
                    CreditTransaction::create([
                        'customer_code'    => $customer->customer_code,
                        'type'             => 'cancel',
                        'amount'           => -$reversalAmount,
                        'previous_balance' => $previousBalance,
                        'new_balance'      => $customer->credit_balance,
                        'reference'        => $invoice->inv_no,
                        'notes'            => 'Invoice cancelled - outstanding credit reversed',
                        'transaction_date' => now()->toDateString(),
                    ]);
                }
            }
        }

        // Update the invoice itself
        $invoice->update([
            'type'             => 'cancel',
            'total_amount'     => 0,
            'total_discount'   => 0,
            'net_total'        => 0,
            'pay_amount'       => 0,
            'balance'          => 0,
            'credit_allocated' => 0,
            'credit_paid'      => 0,
        ]);

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Invoice cancelled successfully.',
            'data'    => $invoice->fresh(['items.stockMovements', 'customer', 'department']),
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Failed to cancel invoice.',
            'error'   => $e->getMessage(),
        ], 500);
    }
}

    private function allocateStockForInvoiceItem(array $item, int $departmentId): array
    {
        $requestedQty = (float) $item['qty'];

        $batches = GrnItem::where('product_code', $item['product_code'])
            ->where('status', 'on')
            ->where('qty', '>', 0)
            ->whereHas('grn', function ($query) use ($departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->orderBy('date', 'asc')
            ->orderBy('id', 'asc')
            ->lockForUpdate()
            ->get();

        $availableQty = (float) $batches->sum('qty');
        if ($availableQty + 0.0001 < $requestedQty) {
            throw new \Exception(
                "Insufficient stock for {$item['product_name']} in selected department: Available {$availableQty}, Requested {$requestedQty}"
            );
        }

        $remaining = $requestedQty;
        $allocations = [];

        foreach ($batches as $batch) {
            if ($remaining <= 0.0001) {
                break;
            }

            $deductQty = min((float) $batch->qty, $remaining);
            $batch->qty = round((float) $batch->qty - $deductQty, 3);
            $batch->subtotal = round((float) $batch->actual_cost * (float) $batch->qty, 2);
            $batch->status = $batch->qty <= 0.0001 ? 'off' : 'on';
            $batch->save();

            $allocations[] = [
                'grn_item_id' => $batch->id,
                'grn_code' => $batch->grn_code,
                'qty' => round($deductQty, 3),
                'unit_cost' => (float) $batch->actual_cost,
            ];

            $remaining = round($remaining - $deductQty, 3);
        }

        if ($remaining > 0.0001) {
            throw new \Exception("Unable to allocate full stock quantity for {$item['product_name']}.");
        }

        return $allocations;
    }

    private function restoreStockBatch(GrnItem $batch, float $qty): void
    {
        if ($qty <= 0) {
            return;
        }

        $batch->qty = round((float) $batch->qty + $qty, 3);
        $batch->subtotal = round((float) $batch->actual_cost * (float) $batch->qty, 2);
        $batch->status = 'on';
        $batch->save();
    }

    private function restoreLegacyInvoiceItemStock(InvoiceItem $item): void
    {
        if (($item->type ?? 'product') === 'service' || !$item->grn_code || $item->grn_code === 'SERVICE') {
            return;
        }

        $tokens = collect(explode(',', $item->grn_code))
            ->map(fn ($code) => trim($code))
            ->filter()
            ->values();

        if ($tokens->isEmpty()) {
            return;
        }

        $remaining = (float) $item->qty;

        foreach ($tokens as $token) {
            [$code, $qtyFromToken] = array_pad(explode(':', $token, 2), 2, null);
            $code = trim($code);

            $batch = GrnItem::where('grn_code', $code)
                ->where('product_code', $item->product_code)
                ->lockForUpdate()
                ->first();

            if (!$batch) {
                continue;
            }

            if ($qtyFromToken !== null && is_numeric($qtyFromToken)) {
                $restoreQty = min($remaining, (float) $qtyFromToken);
            } elseif ($tokens->count() === 1) {
                $restoreQty = $remaining;
            } else {
                $originalQty = (float) ($batch->hisqty ?: $batch->qty);
                $restoreQty = min($remaining, max(0, $originalQty - (float) $batch->qty));
            }

            $this->restoreStockBatch($batch, $restoreQty);
            $remaining = round($remaining - $restoreQty, 3);

            if ($remaining <= 0.0001) {
                break;
            }
        }

        if ($remaining > 0.0001) {
            throw new \Exception(
                "Legacy invoice {$item->inv_no} does not contain exact batch quantities for {$item->product_name}. Restore the remaining {$remaining} units with GRN Adjust after reviewing stock."
            );
        }
    }
}

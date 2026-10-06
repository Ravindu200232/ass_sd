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
use App\Models\DiscountRequest;
use App\Models\Service;
use App\Support\AuditLogger;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $invoices = Invoice::with(['items.stockMovements', 'customer', 'createdBy', 'department'])
            ->visibleTo($request->user())
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

            // ---------------------------------------------------------------
            // V-10. PRICE RESOLUTION AND STOCK ALLOCATION
            //
            // This loop previously read the unit price straight off the
            // request:
            //
            //     $sellingPrice = (float) $item['selling_price'];
            //     $discount     = (float) ($item['discount'] ?? 0);
            //
            // The server computed the TOTALS itself, which looks like
            // server-side control but is not: the totals were computed from
            // numbers the attacker supplied. A cashier could post
            // selling_price = 1 for a 32,000 LKR tyre and the server stored
            // net_total = 1, making the entire DiscountRequest approval
            // workflow decorative.
            //
            // Prices and discounts are now resolved from the database BEFORE
            // anything is totalled or persisted:
            //   - product unit price  -> the FIFO-allocated grn_items batches
            //   - service unit price  -> services.price
            //   - discount            -> an approved, unconsumed DiscountRequest
            //
            // Stock allocation moves up here too, because for products the
            // authoritative price depends on which batches FIFO selects. The
            // whole method already runs inside one transaction, so moving the
            // allocation earlier does not change its atomicity.
            // ---------------------------------------------------------------
            $resolvedItems = [];
            $totalAmount = 0;
            $totalDiscount = 0;

            foreach ($request->items as $index => $item) {
                $itemType = $item['type'] ?? 'product';
                $qty = (float) $item['qty'];
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

                $sellingPrice = $this->resolveUnitSellingPrice($item, $itemType, $allocations, $index);

                $discount = $this->resolveApprovedDiscount(
                    $item,
                    $index,
                    $sellingPrice,
                    $request->user()->user_code,
                    $invNo
                );

                $resolvedItems[] = [
                    'source' => $item,
                    'type' => $itemType,
                    'qty' => $qty,
                    'selling_price' => $sellingPrice,
                    'discount' => $discount,
                    'allocations' => $allocations,
                    'grn_code' => $grnCode,
                ];

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

            // V-10: persist from the RESOLVED values computed above. Stock was
            // already allocated during resolution, so this loop only writes.
            foreach ($resolvedItems as $resolved) {
                $item = $resolved['source'];
                $itemType = $resolved['type'];
                $qty = $resolved['qty'];
                $sellingPrice = $resolved['selling_price'];
                $discount = $resolved['discount'];
                $allocations = $resolved['allocations'];
                $grnCode = $resolved['grn_code'];

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

        } catch (ValidationException $e) {
            // V-10: resolveUnitSellingPrice() and resolveApprovedDiscount()
            // reject tampered prices and unapproved discounts by throwing
            // ValidationException. Roll the transaction back, then re-throw so
            // the handler renders a 422 naming the offending line - the generic
            // clause below would have turned it into an unhelpful 500.
            DB::rollBack();

            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        if (!is_numeric($id) || $id <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid invoice ID.'
            ], 400);
        }

        $invoice = Invoice::with(['items.stockMovements', 'customer', 'createdBy', 'department'])
            ->visibleTo($request->user())
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
        $invoice = Invoice::with('items')->visibleTo($request->user())->find($id);

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

        // V-11: capture the financial state BEFORE it is zeroed. Cancellation
        // overwrites the amounts in place, so without this snapshot the
        // original value of the sale is unrecoverable - there is no way to tell
        // a cancelled 500,000 LKR invoice from a cancelled 500 LKR one.
        $priorState = [
            'type'           => $invoice->type,
            'payment_status' => $invoice->payment_status,
            'total_amount'   => (float) $invoice->total_amount,
            'total_discount' => (float) $invoice->total_discount,
            'net_total'      => (float) $invoice->net_total,
            'pay_amount'     => (float) $invoice->pay_amount,
            'balance'        => (float) $invoice->balance,
            'credit_allocated' => (float) $invoice->credit_allocated,
            'items' => $invoice->items->map(fn ($i) => [
                'product_code'  => $i->product_code,
                'product_name'  => $i->product_name,
                'qty'           => (float) $i->qty,
                'selling_price' => (float) $i->selling_price,
                'discount'      => (float) $i->discount,
            ])->all(),
        ];

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

        // V-11: record who destroyed this revenue, from where, and what it was
        // worth before they did. Rated critical: cancelling an invoice is how
        // theft is concealed in a POS system - take the cash, void the sale,
        // and the stock goes back on the shelf as if nothing happened.
        AuditLogger::record(
            action: 'invoice.cancelled',
            description: sprintf(
                'Invoice %s cancelled. Original net total %s LKR across %d line(s).',
                $invoice->inv_no,
                number_format($priorState['net_total'], 2),
                count($priorState['items'])
            ),
            subject: ['invoice', $invoice->inv_no],
            old: $priorState,
            new: ['type' => 'cancel', 'net_total' => 0.0, 'reason' => $request->input('reason')],
            severity: AuditLogger::SEVERITY_CRITICAL,
        );

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
            'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
        ], 500);
    }
}

    /**
     * V-10: resolve the authoritative unit selling price for an invoice line.
     *
     * The client's `selling_price` is treated as advisory. It is compared
     * against the catalogue and a mismatch is REJECTED rather than silently
     * corrected, because a silent correction would let the cashier hand the
     * customer a receipt showing one figure while the books record another,
     * and would hide genuine price drift between the till and the catalogue.
     *
     * @param  array<int, array<string, mixed>>  $allocations  FIFO batches (products only)
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    private function resolveUnitSellingPrice(array $item, string $itemType, array $allocations, int $index): float
    {
        $field = "items.$index.selling_price";
        $submitted = round((float) ($item['selling_price'] ?? 0), 2);

        if ($itemType === 'service') {
            // Service lines are sent as product_code "SVC-<services.id>"
            // (frontend: CreateInvoice.jsx:725).
            $serviceId = null;
            if (preg_match('/^SVC-(\d+)$/i', (string) ($item['product_code'] ?? ''), $m)) {
                $serviceId = (int) $m[1];
            }

            $service = $serviceId ? Service::find($serviceId) : null;

            if (! $service) {
                throw ValidationException::withMessages([
                    $field => 'This service is not in the catalogue, so its price cannot be verified.',
                ]);
            }

            if (! $service->status) {
                throw ValidationException::withMessages([
                    $field => "The service \"{$service->name}\" is inactive and cannot be sold.",
                ]);
            }

            $authoritative = round((float) $service->price, 2);
        } else {
            if (empty($allocations)) {
                throw ValidationException::withMessages([
                    $field => 'No stock batch could be allocated, so the price cannot be verified.',
                ]);
            }

            // A product can be filled from several FIFO batches, each with its
            // own selling price. The line carries one price, so use the
            // quantity-weighted average of the batches actually allocated.
            $qtyTotal = 0.0;
            $valueTotal = 0.0;
            foreach ($allocations as $allocation) {
                $qtyTotal += (float) $allocation['qty'];
                $valueTotal += (float) $allocation['qty'] * (float) $allocation['unit_selling_price'];
            }

            if ($qtyTotal <= 0) {
                throw ValidationException::withMessages([
                    $field => 'No stock batch could be allocated, so the price cannot be verified.',
                ]);
            }

            $authoritative = round($valueTotal / $qtyTotal, 2);
        }

        // One cent of tolerance absorbs floating-point noise from the client.
        if (abs($submitted - $authoritative) > 0.01) {
            throw ValidationException::withMessages([
                $field => sprintf(
                    'Price mismatch for %s. The catalogue price is %s but %s was submitted. '
                    .'To sell below the catalogue price, raise a discount request for approval.',
                    $item['product_name'] ?? ($item['product_code'] ?? 'this item'),
                    number_format($authoritative, 2),
                    number_format($submitted, 2)
                ),
            ]);
        }

        return $authoritative;
    }

    /**
     * V-10: accept a per-line discount only when an administrator approved it.
     *
     * The original code took `discount` straight from the request, which meant
     * the entire DiscountRequest approval workflow - request, admin review,
     * approve/reject, push notification - could be skipped by simply putting a
     * number in the field. Any discount now has to be backed by an approved
     * request that has not already been spent.
     *
     * The approval is matched on product_code and requester rather than on
     * inv_no, because the frontend raises the request against a TEMPORARY
     * invoice number before the invoice exists
     * (DiscountRequestController::store:25 "allow temporary inv_no too").
     * Matching on the requester keeps one cashier from spending another's
     * approval, and consumed_at makes each approval single-use.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    private function resolveApprovedDiscount(array $item, int $index, float $unitPrice, string $userCode, string $invNo): float
    {
        $requested = round((float) ($item['discount'] ?? 0), 2);

        if ($requested <= 0.0) {
            return 0.0;
        }

        if ($requested > $unitPrice) {
            throw ValidationException::withMessages([
                "items.$index.discount" => 'A discount cannot exceed the unit price.',
            ]);
        }

        $approval = DiscountRequest::where('product_code', $item['product_code'] ?? '')
            ->where('status', 'approved')
            ->where('requested_by', $userCode)
            ->whereNull('consumed_at')
            ->orderByDesc('approved_at')
            ->lockForUpdate()
            ->first();

        if (! $approval) {
            throw ValidationException::withMessages([
                "items.$index.discount" => sprintf(
                    'No approved discount is available for %s. Raise a discount request and have it approved first.',
                    $item['product_name'] ?? ($item['product_code'] ?? 'this item')
                ),
            ]);
        }

        if ($requested > (float) $approval->requested_discount + 0.01) {
            throw ValidationException::withMessages([
                "items.$index.discount" => sprintf(
                    'The approved discount for %s is %s; %s was requested.',
                    $item['product_name'] ?? 'this item',
                    number_format((float) $approval->requested_discount, 2),
                    number_format($requested, 2)
                ),
            ]);
        }

        // Spend the approval so it cannot be replayed on another sale.
        $approval->forceFill([
            'consumed_at' => now(),
            'consumed_inv_no' => $invNo,
        ])->save();

        return $requested;
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
                // V-10: the batch's own selling price is the authoritative
                // figure for this allocation. Carried out of here so the
                // caller never has to trust the client for it.
                'unit_selling_price' => (float) $batch->selling_price,
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

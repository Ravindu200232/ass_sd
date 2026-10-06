<?php
// app/Http/Controllers/Api/GrnController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grn;
use App\Models\GrnItem;
use App\Models\InvPara;
use App\Models\Department;
use Illuminate\Http\Request;
use App\Models\GrnAdjustmentHistory;
use App\Models\ReturnToStock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class GrnController extends Controller
{
    // =========================================================================
    //  ALLOWED FIELDS THAT CAN BE UPDATED VIA updatePrice()
    // =========================================================================
    private const UPDATABLE_PRICE_FIELDS = [
        'selling_price',
        'actual_cost',
        'stock_price',
    ];

    // =========================================================================
    //  INDEX
    // =========================================================================
    public function index(Request $request)
    {
        try {
            $query = Grn::with(['items', 'createdBy', 'department'])
                ->orderBy('created_at', 'desc');

            if ($request->filled('department_id') && $request->department_id !== 'all') {
                $query->where('department_id', $request->department_id);
            }

            $grns = $query->get();

            return response()->json([
                'success' => true,
                'data'    => $grns,
                'message' => 'GRNs retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('GRN Index Error: ' . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve GRNs',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    // =========================================================================
    //  STORE
    // =========================================================================
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $validator = Validator::make($request->all(), [
                'grn_date'                      => 'required|date',
                'department_id'                 => 'required|exists:departments,id',
                'items'                         => 'required|array|min:1',
                'items.*.product_code'          => 'required|string|max:255',
                'items.*.product_name'          => 'required|string|max:255',
                'items.*.stock_price'           => 'required|numeric|min:0',
                'items.*.main_branch_price'     => 'required|numeric|min:0',
                'items.*.selling_price'         => 'required|numeric|min:0',
                'items.*.discount1'             => 'nullable|numeric|min:0|max:100',
                'items.*.discount2'             => 'nullable|numeric|min:0|max:100',
                'items.*.discount3'             => 'nullable|numeric|min:0|max:100',
                'items.*.discount4'             => 'nullable|numeric|min:0|max:100',
                'items.*.actual_cost'           => 'required|numeric|min:0',
                'items.*.qty'                   => 'required|integer|min:0',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $department = Department::find($request->department_id);
            if (!$department) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected department not found',
                ], 404);
            }

            // Generate GRN code (race-condition-safe)
            $invPara = InvPara::lockForUpdate()->first();
            if (!$invPara) {
                throw new \Exception('Inventory parameters not configured');
            }

            $grnCode = 'GRN' . str_pad($invPara->grn_code, 4, '0', STR_PAD_LEFT);
            $invPara->increment('grn_code');

            // Totals
            $totalCost          = 0;
            $totalSellingAmount = 0;
            $totalItem          = count($request->items);

            foreach ($request->items as $item) {
                $totalCost          += $item['actual_cost']   * $item['qty'];
                $totalSellingAmount += $item['selling_price'] * $item['qty'];
            }

            $grn = Grn::create([
                'grn_code'             => $grnCode,
                'grn_date'             => $request->grn_date,
                'department_id'        => $request->department_id,
                'total_cost'           => $totalCost,
                'total_selling_amount' => $totalSellingAmount,
                'total_profit'         => $totalSellingAmount - $totalCost,
                'total_item'           => $totalItem,
                'grn_by'               => $request->user()->id,
            ]);

            if (!$grn) {
                throw new \Exception('Failed to create GRN record');
            }

            foreach ($request->items as $item) {
                $grnItem = GrnItem::create([
                    'grn_code'          => $grnCode,
                    'product_code'      => $item['product_code'],
                    'product_name'      => $item['product_name'],
                    'date'              => $request->grn_date,
                    'stock_price'       => $item['stock_price'],
                    'selling_price'     => $item['selling_price'],
                    'main_branch_price' => $item['main_branch_price'],
                    'discount1'         => $item['discount1'] ?? 0,
                    'discount2'         => $item['discount2'] ?? 0,
                    'discount3'         => $item['discount3'] ?? 0,
                    'discount4'         => $item['discount4'] ?? 0,
                    'actual_cost'       => $item['actual_cost'],
                    'qty'               => $item['qty'],
                    'subtotal'          => $item['actual_cost'] * $item['qty'],
                    'status'            => 'on',
                ]);

                if (!$grnItem) {
                    throw new \Exception("Failed to create GRN item for: {$item['product_name']}");
                }
            }

            DB::commit();

            $grn->load(['items', 'department', 'createdBy']);

            Log::info('GRN created', [
                'grn_code'     => $grnCode,
                'department'   => $request->department_id,
                'total_items'  => $totalItem,
                'created_by'   => $request->user()->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'GRN created successfully',
                'data'    => $grn,
            ], 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('GRN Store Error: ' . $e->getMessage(), [
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'user_id' => $request->user()->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create GRN',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    // =========================================================================
    //  SHOW
    // =========================================================================
    public function show($id)
    {
        try {
            $grn = Grn::with(['items', 'createdBy', 'department'])->find($id);

            if (!$grn) {
                return response()->json(['success' => false, 'message' => 'GRN not found'], 404);
            }

            return response()->json(['success' => true, 'data' => $grn, 'message' => 'GRN retrieved successfully']);

        } catch (\Exception $e) {
            Log::error('GRN Show Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve GRN', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    // =========================================================================
    //  GET BY CODE
    // =========================================================================
    public function getByCode($grnCode)
    {
        try {
            $grn = Grn::with(['items', 'createdBy', 'department'])
                ->where('grn_code', $grnCode)
                ->first();

            if (!$grn) {
                return response()->json(['success' => false, 'message' => 'GRN not found'], 404);
            }

            return response()->json(['success' => true, 'data' => $grn, 'message' => 'GRN retrieved successfully']);

        } catch (\Exception $e) {
            Log::error('GRN GetByCode Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve GRN', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    // =========================================================================
    //  GET AVAILABLE STOCK
    // =========================================================================
    public function getAvailableStock(Request $request)
    {
        try {
            $query = GrnItem::with(['grn.department'])
                ->select(['id', 'grn_code', 'product_code', 'product_name', 'date', 'stock_price', 'selling_price', 'main_branch_price', 'discount1', 'discount2', 'discount3', 'discount4', 'actual_cost', 'discount_price', 'qty', 'status'])
                ->where('status', 'on')
                ->where('qty', '>', 0)
                ->orderBy('date', 'asc')
                ->orderBy('id', 'asc');

            if ($request->filled('department_id') && $request->department_id !== 'all') {
                $query->whereHas('grn', function ($q) use ($request) {
                    $q->where('department_id', $request->department_id);
                });
            }

            $stock = $query->get()
                ->groupBy('product_code')
                ->map(function ($items, $productCode) {
                    $itemsWithFinalPrice = $items->map(function ($item) {
                        $item->final_price = $this->calculateFinalPrice($item->main_branch_price, $item->discount1, $item->discount2, $item->discount3, $item->discount4);
                        return $item;
                    });

                    return [
                        'product_code' => $productCode,
                        'product_name' => $items->first()->product_name,
                        'total_qty'    => $items->sum('qty'),
                        'actual_cost'  => $items->first()->actual_cost,
                        'batches'      => $itemsWithFinalPrice->map(fn($i) => [
                            'id'                => $i->id,
                            'grn_code'          => $i->grn_code,
                            'department_id'     => $i->grn->department_id    ?? null,
                            'department_name'   => $i->grn->department->department_name ?? null,
                            'date'              => $i->date,
                            'stock_price'       => $i->stock_price,
                            'selling_price'     => $i->selling_price,
                            'main_branch_price' => $i->main_branch_price,
                            'discount1'         => $i->discount1,
                            'discount2'         => $i->discount2,
                            'discount3'         => $i->discount3,
                            'discount4'         => $i->discount4,
                            'actual_cost'       => $i->actual_cost,
                            'discount_price'    => $i->discount_price,
                            'final_price'       => $i->final_price,
                            'qty'               => $i->qty,
                            'status'            => $i->status,
                        ]),
                    ];
                })
                ->values();

            return response()->json(['success' => true, 'data' => $stock, 'message' => 'Available stock retrieved successfully']);

        } catch (\Exception $e) {
            Log::error('Get Available Stock Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve available stock', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    // =========================================================================
    //  GET PRODUCT BATCHES
    // =========================================================================
    public function getProductBatches(Request $request, $productCode)
    {
        try {
            $query = GrnItem::with('grn.department')
                ->select(['id', 'grn_code', 'product_code', 'product_name', 'date', 'stock_price', 'selling_price', 'main_branch_price', 'discount1', 'discount2', 'discount3', 'discount4', 'actual_cost', 'discount_price', 'qty', 'status'])
                ->where('product_code', $productCode)
                ->where('status', 'on')
                ->where('qty', '>', 0)
                ->orderBy('date', 'asc')
                ->orderBy('id', 'asc');

            if ($request->filled('department_id') && $request->department_id !== 'all') {
                $query->whereHas('grn', function ($q) use ($request) {
                    $q->where('department_id', $request->department_id);
                });
            }

            $batches = $query->get();

            if ($batches->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'No available batches found for this product'], 404);
            }

            $batchesWithFinalPrice = $batches->map(function ($b) {
                $b->final_price = $this->calculateFinalPrice($b->main_branch_price, $b->discount1, $b->discount2, $b->discount3, $b->discount4);
                return $b;
            });

            return response()->json([
                'success' => true,
                'data'    => [
                    'product_code' => $productCode,
                    'product_name' => $batches->first()->product_name,
                    'total_qty'    => $batches->sum('qty'),
                    'batches'      => $batchesWithFinalPrice->map(fn($b) => [
                        'id'                => $b->id,
                        'grn_code'          => $b->grn_code,
                        'date'              => $b->date,
                        'stock_price'       => $b->stock_price,
                        'selling_price'     => $b->selling_price,
                        'main_branch_price' => $b->main_branch_price,
                        'discount1'         => $b->discount1,
                        'discount2'         => $b->discount2,
                        'discount3'         => $b->discount3,
                        'discount4'         => $b->discount4,
                        'actual_cost'       => $b->actual_cost,
                        'discount_price'    => $b->discount_price,
                        'final_price'       => $b->final_price,
                        'qty'               => $b->qty,
                        'department_id'     => $b->grn->department_id ?? null,
                        'department_name'   => $b->grn->department->department_name ?? null,
                    ]),
                ],
                'message' => 'Product batches retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Get Product Batches Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve product batches', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    // =========================================================================
    //  UPDATE SELLING PRICE  (legacy – kept for backward compatibility)
    // =========================================================================
    public function updateSellingPrice(Request $request)
    {
        // Delegate to the new unified method with field forced to selling_price
        $request->merge(['field' => 'selling_price']);

        // Map old param name → new param name if needed
        if ($request->has('selling_price') && !$request->has('value')) {
            $request->merge(['value' => $request->selling_price]);
        }

        return $this->updatePrice($request);
    }

    // =========================================================================
    //  ✅  UPDATE PRICE  (NEW – supports selling_price OR actual_cost)
    // =========================================================================
    /**
     * POST /api/grn-items/update-price
     *
     * Body (JSON):
     * {
     *   "product_code": "PRD001",
     *   "grn_code":     "GRN0001",
     *   "field":        "selling_price" | "actual_cost",
     *   "value":        150.00,
     *   "reason":       "Optional note"          // optional
     * }
     *
     * On success the GRN totals are automatically recalculated.
     */
    public function updatePrice(Request $request)
    {
        DB::beginTransaction();

        try {
            // ── Validation ────────────────────────────────────────────────────
            $validator = Validator::make($request->all(), [
                'product_code' => 'required|string|max:255',
                'grn_code'     => 'required|string|max:255',
                'field'        => 'required|string|in:' . implode(',', self::UPDATABLE_PRICE_FIELDS),
                'value'        => 'required|numeric|min:0',
                'reason'       => 'nullable|string|max:500',
            ], [
                'field.in' => 'The field must be one of: ' . implode(', ', self::UPDATABLE_PRICE_FIELDS),
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $field    = $request->field;   // "selling_price" or "actual_cost"
            $newValue = round((float) $request->value, 2);

            // ── Find GRN item ─────────────────────────────────────────────────
            $grnItem = GrnItem::where('product_code', $request->product_code)
                ->where('grn_code', $request->grn_code)
                ->first();

            if (!$grnItem) {
                return response()->json([
                    'success' => false,
                    'message' => "GRN item not found for product [{$request->product_code}] in GRN [{$request->grn_code}]",
                ], 404);
            }

            // ── Store original values ─────────────────────────────────────────
            $originalValue       = (float) $grnItem->{$field};
            $originalSubtotal    = (float) $grnItem->subtotal;
            $originalActualCost  = (float) $grnItem->actual_cost;

            // ── Apply update ──────────────────────────────────────────────────
            $grnItem->{$field} = $newValue;

            // If actual_cost changed → recalculate subtotal
            if ($field === 'actual_cost') {
                $grnItem->subtotal = round($newValue * $grnItem->qty, 2);
            }

            $grnItem->save();

            // ── Recalculate parent GRN totals ─────────────────────────────────
            $grn = Grn::where('grn_code', $request->grn_code)->first();
            if ($grn) {
                $this->recalculateGrnTotals($grn);
            }

            DB::commit();

            // ── Logging ───────────────────────────────────────────────────────
            Log::info('GRN item price updated', [
                'product_code'   => $request->product_code,
                'grn_code'       => $request->grn_code,
                'field'          => $field,
                'original_value' => $originalValue,
                'new_value'      => $newValue,
                'user_id'        => $request->user()->id,
                'reason'         => $request->reason ?? 'Price Controller update',
            ]);

            return response()->json([
                'success' => true,
                'message' => ucfirst(str_replace('_', ' ', $field)) . ' updated successfully',
                'data'    => [
                    'grn_item'       => $grnItem->fresh(),
                    'field_updated'  => $field,
                    'original_value' => $originalValue,
                    'new_value'      => $newValue,
                    'change'         => round($newValue - $originalValue, 2),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Update price error: ' . $e->getMessage(), [
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'request' => $request->except(['token', 'password']),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update price',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    // =========================================================================
    //  ADJUST QUANTITY
    // =========================================================================
    public function adjustQuantity(Request $request)
    {
        DB::beginTransaction();

        try {
            $validator = Validator::make($request->all(), [
                'grn_code'        => 'required|string|exists:grns,grn_code',
                'product_code'    => 'required|string',
                'adjustment_qty'  => 'required|integer',
                'adjustment_type' => 'required|in:add,subtract,set',
                'reason'          => 'nullable|string|max:500',
                'is_return'       => 'nullable|boolean',
                'return_to_stock' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }

            $grn = Grn::where('grn_code', $request->grn_code)->first();
            if (!$grn) {
                return response()->json(['success' => false, 'message' => 'GRN not found'], 404);
            }

            $grnItem = GrnItem::where('grn_code', $request->grn_code)
                ->where('product_code', $request->product_code)
                ->first();

            if (!$grnItem) {
                return response()->json(['success' => false, 'message' => 'GRN item not found'], 404);
            }

            $originalQty      = $grnItem->qty;
            $originalSubtotal = $grnItem->subtotal;

            $newQty = $this->calculateNewQuantity($originalQty, $request->adjustment_qty, $request->adjustment_type);

            if ($newQty < 0) {
                throw new \Exception('Quantity cannot be negative');
            }

            $newSubtotal       = $grnItem->actual_cost * $newQty;
            $grnItem->qty      = $newQty;
            $grnItem->subtotal = $newSubtotal;
            $grnItem->status   = $newQty == 0 ? 'off' : 'on';
            $grnItem->save();

            $this->recalculateGrnTotals($grn);

            $this->createAdjustmentHistory($grnItem, [
                'original_qty'      => $originalQty,
                'new_qty'           => $newQty,
                'adjustment_qty'    => $request->adjustment_qty,
                'adjustment_type'   => $request->adjustment_type,
                'original_subtotal' => $originalSubtotal,
                'new_subtotal'      => $newSubtotal,
                'reason'            => $request->reason,
                'is_return'         => $request->is_return         ?? false,
                'return_to_stock'   => $request->return_to_stock   ?? false,
                'adjusted_by'       => $request->user()->id,
            ]);

            if ($request->is_return && $request->return_to_stock &&
                in_array($request->adjustment_type, ['subtract', 'set']) &&
                $newQty < $originalQty) {
                $this->createReturnToStockRecord($grnItem, [
                    'returned_qty' => $originalQty - $newQty,
                    'reason'       => $request->reason,
                    'returned_by'  => $request->user()->id,
                ]);
            }

            DB::commit();

            $grn->load(['items', 'department', 'createdBy']);

            return response()->json([
                'success' => true,
                'message' => 'Quantity adjusted successfully',
                'data'    => [
                    'grn'        => $grn,
                    'item'       => $grnItem,
                    'adjustment' => [
                        'original_qty'       => $originalQty,
                        'new_qty'            => $newQty,
                        'change'             => $newQty - $originalQty,
                        'original_subtotal'  => $originalSubtotal,
                        'new_subtotal'       => $newSubtotal,
                        'subtotal_change'    => $newSubtotal - $originalSubtotal,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('GRN Quantity Adjustment Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to adjust quantity', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    // =========================================================================
    //  BULK ADJUST QUANTITY
    // =========================================================================
    public function bulkAdjustQuantity(Request $request)
    {
        DB::beginTransaction();

        try {
            $validator = Validator::make($request->all(), [
                'adjustments'                     => 'required|array|min:1',
                'adjustments.*.grn_code'          => 'required|string',
                'adjustments.*.product_code'      => 'required|string',
                'adjustments.*.adjustment_qty'    => 'required|integer',
                'adjustments.*.adjustment_type'   => 'required|in:add,subtract,set',
                'adjustments.*.reason'            => 'nullable|string',
                'bulk_reason'                     => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }

            $results = [];
            $failed  = [];

            foreach ($request->adjustments as $index => $adjustment) {
                try {
                    $sv = Validator::make($adjustment, [
                        'grn_code'        => 'required|string|exists:grns,grn_code',
                        'product_code'    => 'required|string',
                        'adjustment_qty'  => 'required|integer',
                        'adjustment_type' => 'required|in:add,subtract,set',
                    ]);

                    if ($sv->fails()) {
                        $failed[] = ['index' => $index, 'success' => false, 'grn_code' => $adjustment['grn_code'] ?? 'unknown', 'product_code' => $adjustment['product_code'] ?? 'unknown', 'error' => 'Validation failed: ' . json_encode($sv->errors())];
                        continue;
                    }

                    $grnItem = GrnItem::where('grn_code', $adjustment['grn_code'])->where('product_code', $adjustment['product_code'])->first();

                    if (!$grnItem) {
                        $failed[] = ['index' => $index, 'success' => false, 'grn_code' => $adjustment['grn_code'], 'product_code' => $adjustment['product_code'], 'error' => 'GRN item not found'];
                        continue;
                    }

                    $originalQty = $grnItem->qty;
                    $newQty      = $this->calculateNewQuantity($originalQty, $adjustment['adjustment_qty'], $adjustment['adjustment_type']);

                    if ($newQty < 0) {
                        $failed[] = ['index' => $index, 'success' => false, 'grn_code' => $adjustment['grn_code'], 'product_code' => $adjustment['product_code'], 'error' => 'Resulting quantity would be negative'];
                        continue;
                    }

                    $grnItem->qty      = $newQty;
                    $grnItem->subtotal = $grnItem->actual_cost * $newQty;
                    $grnItem->status   = $newQty == 0 ? 'off' : 'on';
                    $grnItem->save();

                    GrnAdjustmentHistory::create([
                        'grn_item_id'       => $grnItem->id,
                        'grn_code'          => $grnItem->grn_code,
                        'product_code'      => $grnItem->product_code,
                        'original_qty'      => $originalQty,
                        'new_qty'           => $newQty,
                        'adjustment_qty'    => $adjustment['adjustment_qty'],
                        'adjustment_type'   => $adjustment['adjustment_type'],
                        'original_subtotal' => $originalQty * $grnItem->actual_cost,
                        'new_subtotal'      => $newQty      * $grnItem->actual_cost,
                        'reason'            => $adjustment['reason'] ?? $request->bulk_reason,
                        'is_return'         => $adjustment['is_return']       ?? false,
                        'return_to_stock'   => $adjustment['return_to_stock'] ?? false,
                        'adjusted_by'       => $request->user()->id,
                        'adjusted_at'       => now(),
                    ]);

                    $results[] = ['index' => $index, 'success' => true, 'grn_code' => $adjustment['grn_code'], 'product_code' => $adjustment['product_code'], 'original_qty' => $originalQty, 'new_qty' => $newQty, 'message' => 'Adjusted successfully'];

                } catch (\Exception $e) {
                    $failed[] = ['index' => $index, 'success' => false, 'grn_code' => $adjustment['grn_code'] ?? 'unknown', 'product_code' => $adjustment['product_code'] ?? 'unknown', 'error' => $e->getMessage()];
                }
            }

            // Recalculate totals for affected GRNs
            collect($results)->pluck('grn_code')->unique()->each(function ($code) {
                $grn = Grn::where('grn_code', $code)->first();
                if ($grn) $this->recalculateGrnTotals($grn);
            });

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bulk adjustment completed',
                'data'    => [
                    'successful'   => $results,
                    'failed'       => $failed,
                    'total'        => count($request->adjustments),
                    'success_count'=> count($results),
                    'failed_count' => count($failed),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk GRN Adjustment Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Bulk adjustment failed', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    // =========================================================================
    //  ADJUSTMENT HISTORY
    // =========================================================================
    public function getAdjustmentHistory($grnCode)
    {
        try {
            $grn = Grn::where('grn_code', $grnCode)->first();
            if (!$grn) return response()->json(['success' => false, 'message' => 'GRN not found'], 404);

            $history = GrnAdjustmentHistory::with(['adjustedBy'])->where('grn_code', $grnCode)->orderBy('adjusted_at', 'desc')->get();

            return response()->json(['success' => true, 'data' => $history, 'message' => 'Adjustment history retrieved successfully']);

        } catch (\Exception $e) {
            Log::error('Get Adjustment History Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve adjustment history', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    public function getAllAdjustmentHistory(Request $request)
    {
        try {
            $query = GrnAdjustmentHistory::with(['adjustedBy', 'grn'])->orderBy('adjusted_at', 'desc');

            if ($request->has('grn_code'))        $query->where('grn_code', $request->grn_code);
            if ($request->has('product_code'))    $query->where('product_code', $request->product_code);
            if ($request->has('adjustment_type')) $query->where('adjustment_type', $request->adjustment_type);
            if ($request->has('date_from'))       $query->whereDate('adjusted_at', '>=', $request->date_from);
            if ($request->has('date_to'))         $query->whereDate('adjusted_at', '<=', $request->date_to);
            if ($request->has('is_return'))       $query->where('is_return', $request->is_return);

            return response()->json(['success' => true, 'data' => $query->paginate($request->get('per_page', 20)), 'message' => 'Adjustment history retrieved successfully']);

        } catch (\Exception $e) {
            Log::error('Get All Adjustment History Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve adjustment history', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    public function searchAdjustments(Request $request)
    {
        try {
            $query = GrnAdjustmentHistory::with(['adjustedBy', 'grn'])->orderBy('adjusted_at', 'desc');

            if ($request->has('search')) {
                $s = $request->search;
                $query->where(fn($q) => $q->where('grn_code', 'like', "%{$s}%")->orWhere('product_code', 'like', "%{$s}%")->orWhere('reason', 'like', "%{$s}%"));
            }

            if ($request->has('date_from') && $request->has('date_to')) {
                $query->whereBetween('adjusted_at', [$request->date_from . ' 00:00:00', $request->date_to . ' 23:59:59']);
            }

            return response()->json(['success' => true, 'data' => $query->paginate($request->get('per_page', 20)), 'message' => 'Adjustments retrieved successfully']);

        } catch (\Exception $e) {
            Log::error('Search Adjustments Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to search adjustments', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    public function getAdjustmentStatistics()
    {
        try {
            return response()->json([
                'success' => true,
                'data'    => [
                    'total_adjustments' => GrnAdjustmentHistory::count(),
                    'today_adjustments' => GrnAdjustmentHistory::whereDate('adjusted_at', today())->count(),
                    'total_returns'     => ReturnToStock::count(),
                    'pending_returns'   => ReturnToStock::where('status', 'pending')->count(),
                    'recent_adjustments'=> GrnAdjustmentHistory::with(['adjustedBy', 'grn'])->orderBy('adjusted_at', 'desc')->limit(10)->get(),
                ],
                'message' => 'Statistics retrieved successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Get Adjustment Statistics Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve statistics', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    // =========================================================================
    //  RETURNS
    // =========================================================================
    public function getPendingReturns()
    {
        try {
            $returns = ReturnToStock::with(['returnedBy', 'grn'])->where('status', 'pending')->orderBy('returned_at', 'desc')->get();
            return response()->json(['success' => true, 'data' => $returns, 'message' => 'Pending returns retrieved successfully']);
        } catch (\Exception $e) {
            Log::error('Get Pending Returns Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve pending returns', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    public function approveReturn(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $return = ReturnToStock::find($id);
            if (!$return) return response()->json(['success' => false, 'message' => 'Return record not found'], 404);
            if ($return->status !== 'pending') return response()->json(['success' => false, 'message' => 'Return has already been processed'], 400);

            $return->update(['status' => 'approved', 'approved_by' => $request->user()->id, 'approved_at' => now(), 'approval_notes' => $request->approval_notes]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Return approved successfully', 'data' => $return]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to approve return', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    public function rejectReturn(Request $request, $id)
    {
        DB::beginTransaction();
        try {
            $return = ReturnToStock::find($id);
            if (!$return) return response()->json(['success' => false, 'message' => 'Return record not found'], 404);
            if ($return->status !== 'pending') return response()->json(['success' => false, 'message' => 'Return has already been processed'], 400);

            $return->update(['status' => 'rejected', 'approved_by' => $request->user()->id, 'approved_at' => now(), 'approval_notes' => $request->approval_notes]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Return rejected successfully', 'data' => $return]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to reject return', 'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'], 500);
        }
    }

    // =========================================================================
    //  PRIVATE HELPERS
    // =========================================================================

    private function calculateFinalPrice($mainBranchPrice, $discount1, $discount2, $discount3, $discount4): float
    {
        $price = (float) $mainBranchPrice;
        foreach ([$discount1, $discount2, $discount3, $discount4] as $d) {
            if ($d > 0) $price -= $price * ($d / 100);
        }
        return max(0, round($price, 2));
    }

    private function calculateNewQuantity(int $currentQty, int $adjustmentQty, string $adjustmentType): int
    {
        return match ($adjustmentType) {
            'add'      => $currentQty + $adjustmentQty,
            'subtract' => $currentQty - $adjustmentQty,
            'set'      => $adjustmentQty,
            default    => $currentQty,
        };
    }

    private function recalculateGrnTotals(Grn $grn): void
    {
        $items = GrnItem::where('grn_code', $grn->grn_code)->where('qty', '>', 0)->get();

        $grn->update([
            'total_cost'           => $items->sum(fn($i) => $i->actual_cost   * $i->qty),
            'total_selling_amount' => $items->sum(fn($i) => $i->selling_price * $i->qty),
            'total_profit'         => $items->sum(fn($i) => ($i->selling_price - $i->actual_cost) * $i->qty),
            'total_item'           => $items->count(),
        ]);
    }

    private function createAdjustmentHistory(GrnItem $grnItem, array $data): void
    {
        GrnAdjustmentHistory::create([
            'grn_item_id'       => $grnItem->id,
            'grn_code'          => $grnItem->grn_code,
            'product_code'      => $grnItem->product_code,
            'original_qty'      => $data['original_qty'],
            'new_qty'           => $data['new_qty'],
            'adjustment_qty'    => $data['adjustment_qty'],
            'adjustment_type'   => $data['adjustment_type'],
            'original_subtotal' => $data['original_subtotal'],
            'new_subtotal'      => $data['new_subtotal'],
            'reason'            => $data['reason'],
            'is_return'         => $data['is_return'],
            'return_to_stock'   => $data['return_to_stock'],
            'adjusted_by'       => $data['adjusted_by'],
            'adjusted_at'       => now(),
        ]);
    }

    private function createReturnToStockRecord(GrnItem $grnItem, array $data): void
    {
        ReturnToStock::create([
            'grn_item_id'  => $grnItem->id,
            'grn_code'     => $grnItem->grn_code,
            'product_code' => $grnItem->product_code,
            'product_name' => $grnItem->product_name,
            'returned_qty' => $data['returned_qty'],
            'stock_price'  => $grnItem->stock_price,
            'actual_cost'  => $grnItem->actual_cost,
            'selling_price'=> $grnItem->selling_price,
            'reason'       => $data['reason'],
            'returned_by'  => $data['returned_by'],
            'returned_at'  => now(),
            'status'       => 'pending',
        ]);
    }
}

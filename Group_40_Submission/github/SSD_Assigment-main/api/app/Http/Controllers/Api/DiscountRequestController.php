<?php
// app/Http/Controllers/Api/DiscountRequestController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscountRequest;
use App\Models\InvoiceItem;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Services\OneSignalService;

use Exception;

class DiscountRequestController extends Controller
{
    // Employee: Create discount request
    public function store(Request $request)
    {
        try {
            $request->validate([
                'inv_no' => 'required|string', // allow temporary inv_no too
                'product_code' => 'required|string',
                'original_price' => 'required|numeric|min:0',
                'requested_discount' => 'required|numeric|min:0',
                'reason' => 'nullable|string|max:500'
            ]);

            if ($request->requested_discount > $request->original_price) {
                return response()->json([
                    'success' => false,
                    'message' => 'Requested discount cannot be greater than original price.'
                ], 422);
            }

            // If invoice exists, validate product is part of it (best-effort)
            $invoice = Invoice::where('inv_no', $request->inv_no)->first();
            if ($invoice) {
                $invoiceItem = InvoiceItem::where('inv_no', $request->inv_no)
                    ->where('product_code', $request->product_code)
                    ->first();

                if (!$invoiceItem) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Product not found in the specified invoice.'
                    ], 404);
                }
            }

            // Check for existing pending request for same product in same invoice
            $existingRequest = DiscountRequest::where('inv_no', $request->inv_no)
                ->where('product_code', $request->product_code)
                ->where('status', 'pending')
                ->exists();

            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'A pending discount request already exists for this product in the invoice.'
                ], 409);
            }

            $finalPrice = $request->original_price - $request->requested_discount;

            $discountRequest = DiscountRequest::create([
                'inv_no' => $request->inv_no,
                'product_code' => $request->product_code,
                'requested_by' => $request->user()->user_code,
                'original_price' => $request->original_price,
                'requested_discount' => $request->requested_discount,
                'final_price' => $finalPrice,
                'reason' => $request->reason,
                'status' => 'pending'
            ]);
            
        OneSignalService::sendToAdmins(
        'New Discount Request',
        "Invoice: {$discountRequest->inv_no}\nProduct: {$discountRequest->product_code}",
        [
        'discount_request_id' => $discountRequest->id,
        'type' => 'discount_request'
        ]
    );

            return response()->json([
                'success' => true,
                'message' => 'Discount request sent to admin for approval.',
                'data' => $discountRequest->load(['requestedByUser', 'product'])
            ], 201);

        } catch (ValidationException $e) {
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed.';
            return response()->json(['success' => false, 'message' => $firstError], 422);
        } catch (Exception $e) {
            Log::error('Discount request creation error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id,
                'inv_no' => $request->inv_no,
                'product_code' => $request->product_code
            ]);
            return response()->json(['success' => false, 'message' => 'Failed to create discount request. Please try again.'], 500);
        }
    }

    // Get all discount requests (Admin & Employee)
    public function index(Request $request)
    {
        try {
            $query = DiscountRequest::with(['requestedByUser', 'approvedByUser', 'product', 'invoice']);

            // If employee, show only their requests
            if ($request->user()->role === 'employee') {
                $query->where('requested_by', $request->user()->user_code);
            }

            // status filter
            $status = $request->get('status');
            if ($status && in_array($status, ['pending', 'approved', 'rejected', 'cancelled'])) {
                $query->where('status', $status);
            }

            // inv_no filter (important for frontend using tempInvNo)
            if ($request->has('inv_no') && $request->inv_no) {
                $query->where('inv_no', $request->inv_no);
            }

            // Add date range filtering
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            $requests = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Discount requests retrieved successfully.',
                'data' => $requests
            ]);
        } catch (Exception $e) {
            Log::error('Discount requests retrieval error: ' . $e->getMessage(), ['user_id' => $request->user()->id]);
            return response()->json(['success' => false, 'message' => 'Failed to retrieve discount requests.'], 500);
        }
    }

    // Admin: Approve discount request
    public function approve(Request $request, $id)
    {
        try {
            if ($request->user()->role !== 'admin') {
                return response()->json(['success' => false, 'message' => 'Only admin can approve discount requests.'], 403);
            }

            $request->validate(['admin_note' => 'nullable|string|max:500']);

            if (!is_numeric($id) || $id <= 0) {
                return response()->json(['success' => false, 'message' => 'Invalid discount request ID.'], 400);
            }

            DB::beginTransaction();

            $discountRequest = DiscountRequest::find($id);

            if (!$discountRequest) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Discount request not found.'], 404);
            }

            if ($discountRequest->status !== 'pending') {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'This request has already been processed.'], 400);
            }

            // Mark approved (always)
            $discountRequest->update([
                'status' => 'approved',
                'approved_by' => $request->user()->user_code,
                'approved_at' => now(),
                'admin_note' => $request->admin_note
            ]);

            // If invoice + invoice item exist already, apply discount immediately (backwards compatibility).
            $invoiceItem = InvoiceItem::where('inv_no', $discountRequest->inv_no)
                ->where('product_code', $discountRequest->product_code)
                ->first();

            if ($invoiceItem) {
                $invoiceItem->update([
                    'discount' => $discountRequest->requested_discount,
                    'last_selling_price' => $discountRequest->final_price
                ]);

                // Recalculate invoice totals if invoice exists
                $invoice = $invoiceItem->invoice;
                if ($invoice) {
                    $totalAmount = $invoice->items->sum(function ($item) {
                        return $item->selling_price * $item->qty;
                    });
                    $totalDiscount = $invoice->items->sum(function ($item) {
                        return $item->discount * $item->qty;
                    });
                    $netTotal = $totalAmount - $totalDiscount;
                    $balance = $netTotal - $invoice->pay_amount;

                    $invoice->update([
                        'total_amount' => $totalAmount,
                        'total_discount' => $totalDiscount,
                        'net_total' => $netTotal,
                        'balance' => $balance
                    ]);
                }
            }
            // If the invoice doesn't exist yet, that's fine — the frontend will apply approved discounts before creating the invoice.

            DB::commit();

            $discountRequest->load(['requestedByUser', 'approvedByUser', 'product', 'invoice']);

            return response()->json(['success' => true, 'message' => 'Discount request approved successfully.', 'data' => $discountRequest]);

        } catch (ValidationException $e) {
            DB::rollBack();
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed.';
            return response()->json(['success' => false, 'message' => $firstError], 422);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Discount request approval error: ' . $e->getMessage(), ['id' => $id, 'user_id' => $request->user()->id]);
            return response()->json(['success' => false, 'message' => 'Failed to approve discount request.'], 500);
        }
    }

    // Admin: Reject discount request
    public function reject(Request $request, $id)
    {
        try {
            if ($request->user()->role !== 'admin') {
                return response()->json(['success' => false, 'message' => 'Only admin can reject discount requests.'], 403);
            }

            $request->validate(['admin_note' => 'nullable|string|max:500']);

            if (!is_numeric($id) || $id <= 0) {
                return response()->json(['success' => false, 'message' => 'Invalid discount request ID.'], 400);
            }

            $discountRequest = DiscountRequest::find($id);

            if (!$discountRequest) {
                return response()->json(['success' => false, 'message' => 'Discount request not found.'], 404);
            }

            if ($discountRequest->status !== 'pending') {
                return response()->json(['success' => false, 'message' => 'This request has already been processed.'], 400);
            }

            $discountRequest->update([
                'status' => 'rejected',
                'approved_by' => $request->user()->user_code,
                'approved_at' => now(),
                'admin_note' => $request->admin_note
            ]);

            $discountRequest->load(['requestedByUser', 'approvedByUser']);

            return response()->json(['success' => true, 'message' => 'Discount request rejected.', 'data' => $discountRequest]);

        } catch (ValidationException $e) {
            $errors = $e->errors();
            $firstError = reset($errors)[0] ?? 'Validation failed.';
            return response()->json(['success' => false, 'message' => $firstError], 422);

        } catch (Exception $e) {
            Log::error('Discount request rejection error: ' . $e->getMessage(), ['id' => $id, 'user_id' => $request->user()->id]);
            return response()->json(['success' => false, 'message' => 'Failed to reject discount request.'], 500);
        }
    }

    // Get pending requests count (for notification)
    /**
     * Show a single discount request.
     *
     * V-07: routes/api.php pointed GET /discount-requests/{id} at this method,
     * but it was never written - every call raised BadMethodCallException and
     * returned a stack trace. Implemented here rather than deleting the route,
     * because the frontend links to individual requests.
     *
     * The ownership rule mirrors index() and cancel(): an employee may only
     * see their own requests, an administrator may see all. A request that
     * exists but belongs to someone else returns 404 rather than 403, so the
     * endpoint cannot be used to enumerate which request ids exist.
     */
    public function show(Request $request, $id)
    {
        try {
            if (!is_numeric($id) || $id <= 0) {
                return response()->json(['success' => false, 'message' => 'Invalid discount request ID.'], 400);
            }

            $query = DiscountRequest::with(['requestedByUser', 'approvedByUser', 'product', 'invoice']);

            if ($request->user()->role === 'employee') {
                $query->where('requested_by', $request->user()->user_code);
            }

            $discountRequest = $query->find($id);

            if (!$discountRequest) {
                return response()->json(['success' => false, 'message' => 'Discount request not found.'], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Discount request retrieved.',
                'data'    => $discountRequest,
            ]);
        } catch (Exception $e) {
            Log::error('Discount request retrieval error: ' . $e->getMessage(), ['id' => $id, 'user_id' => $request->user()->id]);

            return response()->json(['success' => false, 'message' => 'Failed to retrieve discount request.'], 500);
        }
    }

    public function pendingCount(Request $request)
    {
        try {
            $count = DiscountRequest::where('status', 'pending')->count();
            return response()->json(['success' => true, 'message' => 'Pending discount requests count retrieved.', 'data' => ['count' => $count]]);
        } catch (Exception $e) {
            Log::error('Pending count retrieval error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve pending discount requests count.'], 500);
        }
    }

    // Cancel own discount request
    public function cancel(Request $request, $id)
    {
        try {
            if (!is_numeric($id) || $id <= 0) return response()->json(['success' => false, 'message' => 'Invalid discount request ID.'], 400);

            $discountRequest = DiscountRequest::find($id);
            if (!$discountRequest) return response()->json(['success' => false, 'message' => 'Discount request not found.'], 404);
            if ($discountRequest->requested_by !== $request->user()->user_code) return response()->json(['success' => false, 'message' => 'You can only cancel your own discount requests.'], 403);
            if ($discountRequest->status !== 'pending') return response()->json(['success' => false, 'message' => 'Only pending discount requests can be cancelled.'], 400);

            $discountRequest->update([
                'status' => 'cancelled',
                'cancelled_at' => now()
            ]);

            return response()->json(['success' => true, 'message' => 'Discount request cancelled successfully.', 'data' => $discountRequest]);
        } catch (Exception $e) {
            Log::error('Discount request cancellation error: ' . $e->getMessage(), ['id' => $id, 'user_id' => $request->user()->id]);
            return response()->json(['success' => false, 'message' => 'Failed to cancel discount request.'], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\InvPara;
use App\Models\Invoice;
use App\Models\CreditTransaction;
use App\Support\AuditLogger;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        try {
            // ✅ include department details for table display
            $customers = Customer::with('department')
                ->visibleTo($request->user())
                ->orderBy('id', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $customers,
                'message' => 'Customers fetched successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching customers: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch customers.' . (config('app.debug') ? ' ' . $e->getMessage() : '')
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'customer_name' => 'required|string|max:255',
                'address' => 'nullable|string',
                'phone_no_01' => 'required|string',
                'phone_no_02' => 'nullable|string',
                'nic_no' => 'required|string',
                'department_id' => 'nullable|exists:departments,id',
                'credit_limit' => 'nullable|numeric|min:0',
                'credit_enabled' => 'boolean',
                'credit_balance' => 'nullable|numeric|min:0'
            ]);

            $invPara = InvPara::first();
            if (!$invPara) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice parameters not found'
                ], 500);
            }

            $customerCode = 'CUS' . str_pad($invPara->customer_code, 4, '0', STR_PAD_LEFT);
            $invPara->increment('customer_code');

            $openingBalance = round((float) ($request->credit_balance ?? 0), 2);

            // V-04: customer_code is no longer mass-assignable (it is absent
            // from Customer::$fillable), so it is set by direct attribute
            // assignment from the server-generated counter.
            $customer = new Customer([
                'customer_name'  => $request->customer_name,
                'address'        => $request->address,
                'phone_no_01'    => $request->phone_no_01,
                'phone_no_02'    => $request->phone_no_02,
                'nic_no'         => $request->nic_no,
                // normalize department_id to int (prevents type mismatch issues)
                'department_id'  => $request->filled('department_id') ? (int) $request->department_id : null,
                'credit_limit'   => $request->credit_limit ?? 0,
                'credit_enabled' => $request->credit_enabled ?? false,
                'credit_balance' => $openingBalance,
            ]);
            $customer->customer_code = $customerCode;
            $customer->save();

            // V-04/V-11: an opening balance is money owed, so it gets a ledger
            // row like every other balance movement. Without this, a customer
            // could be created carrying a debt that appears in no statement and
            // has no recorded origin.
            if ($openingBalance > 0) {
                CreditTransaction::create([
                    'customer_code'    => $customer->customer_code,
                    'type'             => 'opening_balance',
                    'amount'           => $openingBalance,
                    'previous_balance' => 0,
                    'new_balance'      => $openingBalance,
                    'reference'        => 'OPEN-' . $customer->customer_code,
                    'notes'            => 'Opening balance recorded at customer creation by '
                                          . ($request->user()->user_code ?? 'system'),
                    'transaction_date' => now()->toDateString(),
                ]);
            }

            // ✅ return with department so UI shows immediately after create
            $customer->load('department');

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer created successfully'
            ], 201);
        } catch (ValidationException $e) {
            // V-04: a validation failure is a 4xx, not a server fault. The
            // generic catch below used to swallow it and return 500, which hid
            // input-validation problems from clients and from monitoring.
            // Re-throw so the exception handler renders the standard 422 with
            // per-field messages.
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error creating customer: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer.' . (config('app.debug') ? ' ' . $e->getMessage() : '')
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            // ✅ include department
            $customer = Customer::with('department')->visibleTo($request->user())->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $customer
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching customer: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch customer.' . (config('app.debug') ? ' ' . $e->getMessage() : '')
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $customer = Customer::visibleTo($request->user())->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            // V-04. The rules below always existed, but the next line used to
            // read:
            //
            //     $data = $request->all();
            //     $customer->update($data);
            //
            // Validation CHECKS the listed keys; it does not FILTER the
            // payload. Every other key in the request - including any column
            // present in Customer::$fillable - was mass-assigned untouched.
            // Two exploits were demonstrated against the original code:
            //
            //   PUT /customers/1 {"credit_balance":0}
            //     erased 45,000 LKR of debt and wrote no ledger row.
            //   PUT /customers/3 {"customer_code":"CUS-HIJACKED"}
            //     rewrote the key that invoices and credit_transactions join
            //     on, re-pointing the customer at another customer's history.
            //
            // Both are now closed: customer_code is no longer in $fillable,
            // credit_balance is rejected here, and only $validated is assigned.
            $validated = $request->validate([
                'customer_name' => 'sometimes|string|max:255',
                'address' => 'nullable|string',
                'phone_no_01' => 'sometimes|string',
                'phone_no_02' => 'nullable|string',
                'nic_no' => 'sometimes|string',
                'department_id' => 'nullable|exists:departments,id',
                'credit_limit' => 'nullable|numeric|min:0',
                'credit_enabled' => 'boolean',

                // credit_balance is deliberately NOT accepted here. Money only
                // moves through payCreditBalance() and adjustCreditBalance(),
                // both of which write a CreditTransaction row. 'prohibited'
                // makes the refusal explicit and visible to the caller rather
                // than silently discarding the field.
                'credit_balance' => 'prohibited',
                'customer_code'  => 'prohibited',
            ], [
                'credit_balance.prohibited' => 'The credit balance cannot be changed here. Use the credit adjustment or credit payment endpoint, which records a ledger entry.',
                'customer_code.prohibited'  => 'The customer code is permanent and cannot be changed.',
            ]);

            // normalize department_id to int
            if (array_key_exists('department_id', $validated)) {
                $validated['department_id'] = $request->filled('department_id') ? (int) $request->department_id : null;
            }

            $customer->update($validated);

            // ✅ return with department
            $customer->load('department');

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer updated successfully'
            ]);
        } catch (ValidationException $e) {
            // V-04: a validation failure is a 4xx, not a server fault. The
            // generic catch below used to swallow it and return 500, which hid
            // input-validation problems from clients and from monitoring.
            // Re-throw so the exception handler renders the standard 422 with
            // per-field messages.
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error updating customer: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer.' . (config('app.debug') ? ' ' . $e->getMessage() : '')
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $customer = Customer::visibleTo($request->user())->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found.'
                ], 404);
            }

            // ✅ prevent deleting customers with invoices/credit transactions
            $hasInvoices = Invoice::where('customer_code', $customer->customer_code)->exists();
            $hasCreditTransactions = CreditTransaction::where('customer_code', $customer->customer_code)->exists();

            if ($hasInvoices || $hasCreditTransactions) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete customer. Customer has associated invoices or credit transactions.'
                ], 400);
            }

            $customer->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting customer: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete customer. Please try again.'
            ], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->get('q');

            if (!$query) {
                return response()->json([
                    'success' => false,
                    'message' => 'Search query is required'
                ], 400);
            }

            // ✅ include department in results too
            $customers = Customer::with('department')
                ->where(function ($q) use ($query) {
                    $q->where('customer_name', 'like', "%{$query}%")
                        ->orWhere('customer_code', 'like', "%{$query}%")
                        ->orWhere('phone_no_01', 'like', "%{$query}%")
                        ->orWhere('nic_no', 'like', "%{$query}%");
                })
                ->orderBy('id', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $customers
            ]);
        } catch (\Exception $e) {
            Log::error('Error searching customers: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to search customers'
            ], 500);
        }
    }

    // Credit Payment endpoint
    public function creditPayment(Request $request, $id)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:0.01',
                'payment_date' => 'required|date',
                'notes' => 'nullable|string'
            ]);

            return DB::transaction(function () use ($request, $id) {
                $customer = Customer::visibleTo($request->user())->find($id);

                if (!$customer) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Customer not found'
                    ], 404);
                }

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
                    'reference' => 'PAY-' . time(),
                    'notes' => $request->notes,
                    'transaction_date' => $request->payment_date
                ]);

                // ✅ return with department (optional but consistent)
                $customer->load('department');

                return response()->json([
                    'success' => true,
                    'message' => 'Credit payment recorded successfully',
                    'data' => $customer
                ]);
            });
        } catch (ValidationException $e) {
            // V-04: a validation failure is a 4xx, not a server fault. The
            // generic catch below used to swallow it and return 500, which hid
            // input-validation problems from clients and from monitoring.
            // Re-throw so the exception handler renders the standard 422 with
            // per-field messages.
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error processing credit payment: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to process credit payment'
            ], 500);
        }
    }

    // Get credit transactions
    public function creditTransactions(Request $request, $id)
    {
        try {
            $customer = Customer::visibleTo($request->user())->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            $transactions = CreditTransaction::where('customer_code', $customer->customer_code)
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'reference' => $transaction->reference,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'previous_balance' => $transaction->previous_balance,
                        'new_balance' => $transaction->new_balance,
                        'notes' => $transaction->notes,
                        'transaction_date' => $transaction->transaction_date,
                        'created_at' => $transaction->created_at,
                        'updated_at' => $transaction->updated_at,
                        'allocation' => $transaction->allocation
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching credit transactions: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch credit transactions'
            ], 500);
        }
    }

    public function getCreditInvoices(Request $request, $id)
    {
        try {
            $customer = Customer::visibleTo($request->user())->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            // Get invoices where payment_status is 'credit' (credit invoices)
            $invoices = Invoice::where('customer_code', $customer->customer_code)
                ->where('payment_status', 'credit')
                ->orderBy('inv_date', 'asc')
                ->get()
                ->map(function ($invoice) {
                    $totalAmount = floatval($invoice->net_total ?? 0);
                    $cashPaid = floatval($invoice->pay_amount ?? 0);
                    $originalBalance = floatval($invoice->balance ?? 0);
                    $creditPaid = floatval($invoice->credit_paid ?? 0);
                    $creditAllocated = floatval($invoice->credit_allocated ?? 0);

                    if ($creditAllocated <= 0) {
                        $creditAllocated = $originalBalance;
                    }

                    $remainingAmount = $creditAllocated - $creditPaid;

                    if ($remainingAmount <= 0) {
                        $paymentStatus = 'paid';
                    } elseif ($creditPaid > 0) {
                        $paymentStatus = 'partial';
                    } else {
                        $paymentStatus = 'unpaid';
                    }

                    $paidPercentage = $creditAllocated > 0 ? ($creditPaid / $creditAllocated) * 100 : 0;

                    return [
                        'id' => $invoice->id,
                        'invoice_number' => $invoice->inv_no,
                        'total_amount' => $totalAmount,
                        'paid_amount' => $cashPaid + $creditPaid,
                        'remaining_amount' => max(0, $remainingAmount),
                        'cash_paid' => $cashPaid,
                        'credit_allocated' => $creditAllocated,
                        'credit_paid' => $creditPaid,
                        'payment_status' => $paymentStatus,
                        'paid_percentage' => round($paidPercentage, 2),
                        'invoice_date' => $invoice->inv_date,
                        'created_at' => $invoice->created_at,
                        'updated_at' => $invoice->updated_at,
                        'total_discount' => $invoice->total_discount,
                        'remaining_balance' => $invoice->remaining_balance,
                        'is_credit_paid' => $invoice->is_credit_paid,
                        'original_balance' => $originalBalance,
                        'payment_method' => $invoice->payment_status
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $invoices
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching credit invoices: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch credit invoices.' . (config('app.debug') ? ' ' . $e->getMessage() : '')
            ], 500);
        }
    }

    // Pay towards credit balance (like paying a loan)
    public function payCreditBalance(Request $request, $id)
    {
        DB::beginTransaction();

        try {
            $request->validate([
                'amount' => 'required|numeric|min:0.01',
                'payment_date' => 'required|date',
                'notes' => 'nullable|string',
                'allocation' => 'sometimes|array'
            ]);

            $customer = Customer::visibleTo($request->user())->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            if (!$customer->credit_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer does not have credit enabled'
                ], 400);
            }

            $paymentAmount = floatval($request->amount);

            if ($paymentAmount <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment amount must be greater than 0'
                ], 400);
            }

            if ($paymentAmount > $customer->credit_balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment amount exceeds credit balance. Current balance: LKR ' . number_format($customer->credit_balance, 2)
                ], 400);
            }

            $previousBalance = $customer->credit_balance;

            // Process allocations to invoices
            $totalAllocated = 0;
            if (!empty($request->allocation)) {
                foreach ($request->allocation as $allocationItem) {
                    if (
                        isset($allocationItem['invoice_id']) &&
                        isset($allocationItem['payment_amount']) &&
                        $allocationItem['payment_amount'] > 0
                    ) {
                        $invoice = Invoice::find($allocationItem['invoice_id']);
                        if ($invoice && $invoice->customer_code === $customer->customer_code) {
                            $paymentAmountForInvoice = floatval($allocationItem['payment_amount']);
                            $newCreditPaid = floatval($invoice->credit_paid ?? 0) + $paymentAmountForInvoice;

                            $isFullyPaid = $newCreditPaid >= floatval($invoice->balance ?? 0);

                            $invoice->update([
                                'credit_paid' => $newCreditPaid,
                                'is_credit_paid' => $isFullyPaid,
                                'remaining_balance' => max(0, floatval($invoice->balance ?? 0) - $newCreditPaid)
                            ]);

                            $totalAllocated += $paymentAmountForInvoice;
                        }
                    }
                }
            }

            if ($totalAllocated === 0) {
                $totalAllocated = $paymentAmount;
            }

            // Update customer credit balance
            $customer->credit_balance = floatval($previousBalance) - floatval($totalAllocated);
            $customer->save();

            // Create credit transaction record
            $creditTransaction = CreditTransaction::create([
                'customer_code' => $customer->customer_code,
                'type' => 'credit_payment',
                'amount' => $totalAllocated,
                'previous_balance' => $previousBalance,
                'new_balance' => $customer->credit_balance,
                'reference' => 'CREDIT-PAY-' . time() . '-' . rand(1000, 9999),
                'notes' => $request->notes,
                'transaction_date' => $request->payment_date,
                'allocation' => $request->allocation
            ]);

            DB::commit();

            // ✅ return with department (consistent for UI)
            $customer->load('department');

            return response()->json([
                'success' => true,
                'message' => 'Credit payment recorded successfully',
                'data' => [
                    'customer' => $customer,
                    'transaction' => $creditTransaction,
                    'payment_reference' => $creditTransaction->reference
                ]
            ]);
        } catch (ValidationException $e) {
            // V-04: a validation failure is a 4xx, not a server fault. The
            // generic catch below used to swallow it and return 500, which hid
            // input-validation problems from clients and from monitoring.
            // Re-throw so the exception handler renders the standard 422 with
            // per-field messages.
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error processing credit payment: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to process credit payment.' . (config('app.debug') ? ' ' . $e->getMessage() : '')
            ], 500);
        }
    }

    // Get credit payment history
    public function creditPaymentHistory(Request $request, $id)
    {
        try {
            $customer = Customer::visibleTo($request->user())->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            $transactions = CreditTransaction::where('customer_code', $customer->customer_code)
                ->where('type', 'credit_payment')
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'reference' => $transaction->reference,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'previous_balance' => $transaction->previous_balance,
                        'new_balance' => $transaction->new_balance,
                        'notes' => $transaction->notes,
                        'transaction_date' => $transaction->transaction_date,
                        'created_at' => $transaction->created_at,
                        'updated_at' => $transaction->updated_at,
                        'allocation' => $transaction->allocation
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching credit payment history: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment history.' . (config('app.debug') ? ' ' . $e->getMessage() : '')
            ], 500);
        }
    }

    // Adjust credit balance (for corrections)
    public function adjustCreditBalance(Request $request, $id)
    {
        try {
            $request->validate([
                'adjustment_type' => 'required|in:set,increase,decrease',
                'amount' => 'required|numeric|min:0',
                'reason' => 'required|string',
                'adjustment_date' => 'required|date',
                'notes' => 'nullable|string'
            ]);

            return DB::transaction(function () use ($request, $id) {
                $customer = Customer::visibleTo($request->user())->find($id);

                if (!$customer) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Customer not found'
                    ], 404);
                }

                $previousBalance = floatval($customer->credit_balance ?? 0);
                $adjustmentAmount = floatval($request->amount);

                switch ($request->adjustment_type) {
                    case 'set':
                        $newBalance = $adjustmentAmount;
                        break;
                    case 'increase':
                        $newBalance = $previousBalance + $adjustmentAmount;
                        break;
                    case 'decrease':
                        $newBalance = max(0, $previousBalance - $adjustmentAmount);
                        break;
                    default:
                        $newBalance = $previousBalance;
                }

                // Update customer credit balance
                $customer->update(['credit_balance' => $newBalance]);

                // Create adjustment transaction
                CreditTransaction::create([
                    'customer_code' => $customer->customer_code,
                    'type' => 'adjustment',
                    'amount' => $newBalance - $previousBalance,
                    'previous_balance' => $previousBalance,
                    'new_balance' => $newBalance,
                    'reference' => 'ADJ-' . time(),
                    'notes' => "Reason: {$request->reason}" . ($request->notes ? " | {$request->notes}" : ''),
                    'transaction_date' => $request->adjustment_date
                ]);

                // V-11: a manual balance adjustment is the single most abusable
                // operation in this system - it moves money with no
                // corresponding sale - so it gets a security audit entry naming
                // the operator, their IP and the before/after figures, not just
                // a CreditTransaction row.
                AuditLogger::record(
                    action: 'customer.credit.adjusted',
                    description: sprintf(
                        'Credit balance of %s (%s) adjusted from %s to %s. Reason: %s',
                        $customer->customer_name,
                        $customer->customer_code,
                        number_format($previousBalance, 2),
                        number_format($newBalance, 2),
                        $request->reason
                    ),
                    subject: ['customer', $customer->customer_code],
                    old: ['credit_balance' => $previousBalance],
                    new: ['credit_balance' => $newBalance, 'reason' => $request->reason],
                    severity: AuditLogger::SEVERITY_WARNING,
                );

                // ✅ return with department (optional but consistent)
                $customer->load('department');

                return response()->json([
                    'success' => true,
                    'message' => 'Credit balance adjusted successfully',
                    'data' => $customer
                ]);
            });
        } catch (ValidationException $e) {
            // V-04: a validation failure is a 4xx, not a server fault. The
            // generic catch below used to swallow it and return 500, which hid
            // input-validation problems from clients and from monitoring.
            // Re-throw so the exception handler renders the standard 422 with
            // per-field messages.
            throw $e;
        } catch (\Exception $e) {
            Log::error('Error adjusting credit balance: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to adjust credit balance'
            ], 500);
        }
    }
}

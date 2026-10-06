import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard } from "lucide-react";

export default function PaymentDetailsSection({
  invoiceType,
  serviceDescription,
  paymentStatus,
  setPaymentStatus,
  selectedCustomerDetails,
  availableCredit,
  netTotal,
  creditAllocated,
  cashPaymentAmount,
  canUseCredit,
  customerType,
  payAmount,
  setPayAmount,
  note,
  setNote,
  totalAmount,
  totalDiscount,
  balance,
  saveDraftLocal,
  cart
}) {
  
  // Calculate the actual remaining balance
  const calculateRemainingBalance = () => {
    let remainingBalance = 0;
    
    if (paymentStatus === "credit" && selectedCustomerDetails?.credit_enabled) {
      // For credit payments: balance = netTotal - (creditAllocated + cashPaymentAmount)
      remainingBalance = netTotal - (creditAllocated + cashPaymentAmount);
    } else {
      // For other payment methods: balance = netTotal - payAmount
      remainingBalance = netTotal - payAmount;
    }
    
    // Round to 2 decimal places to avoid floating point issues
    return Math.round(remainingBalance * 100) / 100;
  };

  const remainingBalance = calculateRemainingBalance();

  const handleClearCart = () => {
    cart([]);
    // You can use alert or console.log instead of toast
    alert("Cart cleared successfully!");
    // Or if you have a toast context/provider:
    // toast.success("Cart cleared");
  };

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-green-500" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-2">
            Invoice Type & Services
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Type:</span>
              <span className="font-medium text-blue-900">
                {invoiceType === "tire and other"
                  ? "Tire + Service"
                  : invoiceType === "other"
                  ? "Service"
                  : "Tire"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Services:</span>
              <span className="font-medium text-blue-900 text-right">
                {serviceDescription || "No services"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Payment Method</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="credit" disabled={!canUseCredit}>
                Credit{" "}
                {!canUseCredit &&
                  selectedCustomerDetails?.credit_enabled &&
                  "(No Available Credit)"}
              </SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
              <SelectItem value="slip">Slip</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentStatus === "credit" &&
          selectedCustomerDetails?.credit_enabled && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Credit Payment Breakdown
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-blue-700">Available Credit:</div>
                <div className="text-right font-medium">
                  LKR {availableCredit.toLocaleString()}
                </div>

                <div className="text-blue-700">Invoice Total:</div>
                <div className="text-right font-medium">
                  LKR {netTotal.toLocaleString()}
                </div>

                <div className="text-green-600">Credit Used:</div>
                <div className="text-right font-medium text-green-600">
                  LKR {creditAllocated.toLocaleString()}
                </div>

                <div className="text-orange-600">Cash Payment:</div>
                <div className="text-right font-medium text-orange-600">
                  LKR {cashPaymentAmount.toLocaleString()}
                </div>

                <div className="text-green-700 font-medium">Total Payment:</div>
                <div className="text-right font-medium text-green-700">
                  LKR {(creditAllocated + cashPaymentAmount).toLocaleString()}
                </div>
              </div>
            </div>
          )}

        {!canUseCredit &&
          customerType === "save" &&
          selectedCustomerDetails?.credit_enabled && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">No Available Credit</span>
              </div>
              <div className="text-xs text-red-600 mt-1">
                Customer has reached credit limit. Available: LKR{" "}
                {availableCredit.toLocaleString()}
              </div>
            </div>
          )}

        <div>
          <Label className="text-sm font-medium">Payment Amount (LKR)</Label>
          <Input
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value || 0))}
            className="mt-1"
            placeholder="0.00"
            disabled={paymentStatus === "credit"}
          />
          {paymentStatus === "credit" && (
            <div className="text-xs text-gray-500 mt-1">
              Payment amount automatically set to cash portion: LKR{" "}
              {cashPaymentAmount.toLocaleString()}
            </div>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium">Notes</Label>
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1"
            placeholder="Additional notes for this invoice..."
          />
        </div>

        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <strong className="text-gray-900">
                LKR {totalAmount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount</span>
              <strong className="text-red-600">
                - LKR {totalDiscount.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between mt-3 pt-2 border-t font-semibold">
              <span className="text-gray-900">Net Total</span>
              <strong className="text-green-600">
                LKR {netTotal.toLocaleString()}
              </strong>
            </div>

            {paymentStatus === "credit" &&
              selectedCustomerDetails?.credit_enabled && (
                <>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-blue-600">Credit Used</span>
                    <strong className="text-blue-600">
                      - LKR {creditAllocated.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600">Cash Payment</span>
                    <strong className="text-orange-600">
                      LKR {cashPaymentAmount.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-green-700">Total Payment</span>
                    <strong className="text-green-700">
                      LKR {(creditAllocated + cashPaymentAmount).toLocaleString()}
                    </strong>
                  </div>
                </>
              )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Balance</span>
              <strong
                className={
                  Math.abs(remainingBalance) > 0.01 
                    ? remainingBalance > 0 
                      ? "text-orange-600" 
                      : "text-blue-600"
                    : "text-green-600"
                }
              >
                {Math.abs(remainingBalance) > 0.01 ? (
                  remainingBalance > 0 ? (
                    `LKR ${remainingBalance.toLocaleString()}`
                  ) : (
                    `LKR ${Math.abs(remainingBalance).toLocaleString()} change due`
                  )
                ) : (
                  "Paid in Full"
                )}
              </strong>
            </div>
            
            {/* Helper text for understanding the calculation */}
            <div className="text-xs text-gray-500 pt-2 border-t mt-2">
              {paymentStatus === "credit" && selectedCustomerDetails?.credit_enabled ? (
                <div>
                  Calculation: LKR {netTotal.toLocaleString()} (Net Total) - LKR {creditAllocated.toLocaleString()} (Credit) - LKR {cashPaymentAmount.toLocaleString()} (Cash) = LKR {remainingBalance.toLocaleString()} (Balance)
                </div>
              ) : (
                <div>
                  Calculation: LKR {netTotal.toLocaleString()} (Net Total) - LKR {payAmount.toLocaleString()} (Payment) = LKR {remainingBalance.toLocaleString()} (Balance)
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => saveDraftLocal()}
            className="flex-1"
          >
            Save Draft (Local)
          </Button>
          <Button
            variant="ghost"
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-700"
          >
            Clear Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
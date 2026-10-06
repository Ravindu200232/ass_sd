import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { AlertTriangle, CreditCard, Receipt, Check, Printer, Edit, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function PaymentDetailsDialog({
  isOpen,
  onClose,
  invoiceType,
  serviceDescription,
  paymentStatus,
  setPaymentStatus,
  selectedCustomerDetails,
  availableCredit,
  netTotal,
  cardSurcharge = 0,
  effectiveNetTotal,
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
  cart,
  setCart,
  handleCreateInvoice,
  autoPrintEnabled,
  printThermalReceipt,
  departments,
  departmentId,
  selectedCustomer,
  isLoading = false
}) {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [localPayAmount, setLocalPayAmount] = useState(payAmount || netTotal);
  const [customPaymentAmount, setCustomPaymentAmount] = useState("");
  
  // Update local pay amount when netTotal changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      const initialAmount = payAmount || (effectiveNetTotal ?? netTotal);
      setLocalPayAmount(initialAmount);
      setCustomPaymentAmount(initialAmount.toFixed(2));
      setIsEditingAmount(false);
    }
  }, [isOpen, netTotal, effectiveNetTotal, payAmount]);
  
  // Update parent pay amount when local changes
  useEffect(() => {
    setPayAmount(localPayAmount);
  }, [localPayAmount, setPayAmount]);

  // Reset payment amount when payment status changes
  useEffect(() => {
    if (paymentStatus === "credit" && selectedCustomerDetails?.credit_enabled) {
      setLocalPayAmount(cashPaymentAmount || 0);
      setCustomPaymentAmount((cashPaymentAmount || 0).toFixed(2));
    } else if (paymentStatus !== "credit") {
      const tot = effectiveNetTotal ?? netTotal;
      setLocalPayAmount(tot);
      setCustomPaymentAmount(tot.toFixed(2));
    }
    setIsEditingAmount(false);
  }, [paymentStatus, selectedCustomerDetails?.credit_enabled, cashPaymentAmount, netTotal, effectiveNetTotal]);

  const activeTotal = effectiveNetTotal ?? netTotal;

  const calculateRemainingBalance = () => {
    let remainingBalance = 0;

    if (paymentStatus === "credit" && selectedCustomerDetails?.credit_enabled) {
      remainingBalance = activeTotal - (creditAllocated + localPayAmount);
    } else {
      remainingBalance = activeTotal - localPayAmount;
    }

    return Math.round(remainingBalance * 100) / 100;
  };

  const remainingBalance = calculateRemainingBalance();

  const handleClearCart = () => {
    setCart([]);
    toast.success("Cart cleared successfully!");
    onClose();
  };

  const validateBeforeCreateInvoice = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return false;
    }
    
    if (customerType === "save" && !selectedCustomer) {
      toast.error("Please select a customer");
      return false;
    }
    
    if (!departmentId) {
      toast.error("Please select a department");
      return false;
    }
    
    if (paymentStatus === "credit" && !canUseCredit) {
      toast.error("No available credit. Cannot create invoice with credit payment.");
      return false;
    }
    
    return true;
  };

  const handleCreateAndPrint = async () => {
    if (!validateBeforeCreateInvoice()) return;
    
    setIsProcessing(true);
    try {
      await handleCreateInvoice();
      onClose();
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDraftAndClose = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    saveDraftLocal(`Draft - ${new Date().toLocaleString()}`);
    onClose();
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Parse formatted number string back to number
  const parseFormattedNumber = (str) => {
    // Remove all non-digit characters except decimal point
    const cleanStr = str.replace(/[^\d.]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  // Handle custom payment amount change
  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    
    // Allow only numbers and decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }
    
    setCustomPaymentAmount(cleanValue);
  };

  // Apply custom payment amount
  const applyCustomAmount = () => {
    if (!customPaymentAmount || customPaymentAmount.trim() === '') {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const amount = parseFloat(customPaymentAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }
    
    setLocalPayAmount(amount);
    toast.success(`Payment amount set to LKR ${formatNumber(amount)}`);
    setIsEditingAmount(false);
  };

  // Reset to net total (uses effective total for card)
  const resetToNetTotal = () => {
    const tot = effectiveNetTotal ?? netTotal;
    setLocalPayAmount(tot);
    setCustomPaymentAmount(tot.toFixed(2));
    toast.success("Payment amount reset to total invoice amount");
    setIsEditingAmount(false);
  };

  // Quick payment buttons
  const handleQuickPayment = (percentage) => {
    if (paymentStatus === "credit" && selectedCustomerDetails?.credit_enabled) {
      toast.info("For credit payments, only the cash portion can be adjusted.");
      return;
    }
    
    const amount = activeTotal * (percentage / 100);
    setLocalPayAmount(amount);
    setCustomPaymentAmount(amount.toFixed(2));
    setIsEditingAmount(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-green-500" />
            Payment & Invoice Processing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Summary */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">
              Invoice Summary
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-blue-700">Type:</div>
              <div className="font-medium text-blue-900 text-right">
                {invoiceType === "tire and other"
                  ? "Tire + Service"
                  : invoiceType === "other"
                  ? "Service"
                  : "Tire"}
              </div>
              <div className="text-blue-700">Items in Cart:</div>
              <div className="font-medium text-blue-900 text-right">
                {cart.length} items
              </div>
              <div className="text-blue-700">Services:</div>
              <div className="font-medium text-blue-900 text-right">
                {serviceDescription || "No services"}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-sm font-medium">Payment Method</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="mt-2">
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

          {/* Credit Details */}
          {paymentStatus === "credit" &&
            selectedCustomerDetails?.credit_enabled && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Credit Payment Breakdown
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-blue-700">Available Credit:</div>
                  <div className="text-right font-medium">
                    LKR {formatNumber(availableCredit)}
                  </div>

                  <div className="text-blue-700">Invoice Total:</div>
                  <div className="text-right font-medium">
                    LKR {formatNumber(netTotal)}
                  </div>

                  <div className="text-green-600">Credit Used:</div>
                  <div className="text-right font-medium text-green-600">
                    LKR {formatNumber(creditAllocated)}
                  </div>

                  <div className="text-orange-600">Cash Payment:</div>
                  <div className="text-right font-medium text-orange-600">
                    LKR {formatNumber(cashPaymentAmount)}
                  </div>

                  <div className="text-green-700 font-medium">Total Payment:</div>
                  <div className="text-right font-medium text-green-700">
                    LKR {formatNumber(creditAllocated + cashPaymentAmount)}
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
                  {formatNumber(availableCredit)}
                </div>
              </div>
            )}

          {/* PAYMENT AMOUNT SECTION */}
          <div className="space-y-3">
            <Label className="text-sm font-medium block">Payment Amount</Label>
            
            {/* Display current payment amount */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-green-700 font-medium mb-1">
                    Current Payment Amount
                  </div>
                  <div className="text-xl font-bold text-green-900">
                    LKR {formatNumber(localPayAmount)}
                  </div>
                </div>
                
                {!isEditingAmount ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => setIsEditingAmount(true)}
                    disabled={paymentStatus === "credit"}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Change
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setIsEditingAmount(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-green-600 mt-2">
                {paymentStatus === "credit" 
                  ? "Cash payment portion (credit covers rest)"
                  : localPayAmount === activeTotal
                  ? "Full invoice amount"
                  : `Partial payment (${((localPayAmount / activeTotal) * 100).toFixed(1)}% of total)`}
              </div>
            </div>

            {/* Edit Payment Amount Section */}
            {isEditingAmount && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Enter New Payment Amount
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={resetToNetTotal}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset to Total
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    LKR
                  </div>
                  <Input
                    type="text"
                    value={customPaymentAmount}
                    onChange={handleCustomAmountChange}
                    className="pl-12 pr-24 text-lg font-semibold"
                    placeholder="0.00"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyCustomAmount}
                      className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Enter amount in LKR (numbers only)
                </div>
                
                {/* Quick Payment Buttons */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Quick amounts:</div>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleQuickPayment(25)}
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleQuickPayment(50)}
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleQuickPayment(75)}
                    >
                      75%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleQuickPayment(100)}
                    >
                      100%
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2"
              placeholder="Additional notes for this invoice..."
            />
          </div>

          {/* Totals */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <strong className="text-gray-900">
                  LKR {formatNumber(totalAmount)}
                </strong>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <strong className="text-red-600">
                  - LKR {formatNumber(totalDiscount)}
                </strong>
              </div>
              <div className="flex justify-between mt-3 pt-2 border-t font-semibold">
                <span className="text-gray-900">Net Total</span>
                <strong className="text-green-600">
                  LKR {formatNumber(netTotal)}
                </strong>
              </div>

              {paymentStatus === "card" && cardSurcharge > 0 && (
                <>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-amber-600 flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5" /> Card Surcharge (3%)
                    </span>
                    <strong className="text-amber-600">
                      + LKR {formatNumber(cardSurcharge)}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-1 font-bold text-base">
                    <span className="text-gray-900">Total (incl. surcharge)</span>
                    <strong className="text-blue-700">
                      LKR {formatNumber(activeTotal)}
                    </strong>
                  </div>
                </>
              )}

              {paymentStatus === "credit" &&
                selectedCustomerDetails?.credit_enabled && (
                  <>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-blue-600">Credit Used</span>
                      <strong className="text-blue-600">
                        - LKR {formatNumber(creditAllocated)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600">Cash Payment</span>
                      <strong className="text-orange-600">
                        LKR {formatNumber(cashPaymentAmount)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-green-700">Total Payment</span>
                      <strong className="text-green-700">
                        LKR {formatNumber(creditAllocated + cashPaymentAmount)}
                      </strong>
                    </div>
                  </>
                )}

              <div className="flex justify-between text-sm font-bold pt-2 border-t">
                <span className="text-gray-900">Balance to Pay</span>
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
                      `LKR ${formatNumber(remainingBalance)}`
                    ) : (
                      `LKR ${formatNumber(Math.abs(remainingBalance))} change due`
                    )
                  ) : (
                    "Paid in Full"
                  )}
                </strong>
              </div>
              
              {/* Payment summary */}
              {paymentStatus !== "credit" && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Amount Paid:</span>
                    <strong className="text-blue-700">
                      LKR {formatNumber(localPayAmount)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-700">Remaining:</span>
                    <strong className={
                      remainingBalance > 0 ? "text-red-600" : "text-green-600"
                    }>
                      {remainingBalance > 0 
                        ? `LKR ${formatNumber(remainingBalance)}`
                        : `LKR ${formatNumber(Math.abs(remainingBalance))} change`
                      }
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <div className="flex flex-wrap gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleSaveDraftAndClose}
              className="flex-1 min-w-[120px]"
              disabled={cart.length === 0}
            >
              Save Draft
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={cart.length === 0}
            >
              Clear Cart
            </Button>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleCreateAndPrint}
              disabled={isProcessing || cart.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg flex-1 min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
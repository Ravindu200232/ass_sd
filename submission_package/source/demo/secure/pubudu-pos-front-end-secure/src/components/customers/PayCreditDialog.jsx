import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, FileText, RefreshCw } from "lucide-react";

export function PayCreditDialog({
  isOpen,
  onOpenChange,
  customer,
  creditInvoices,
  payCreditData,
  setPayCreditData,
  onPayCredit,
  onAllocationChange,
  onAutoAllocate,
  isLoading = false
}) {
  const calculateRemainingAllocation = () => {
    const totalAllocated = Object.values(payCreditData.allocations).reduce(
      (sum, amount) => sum + parseFloat(amount || 0),
      0
    );
    return parseFloat(payCreditData.amount || 0) - totalAllocated;
  };

  const remainingAllocation = calculateRemainingAllocation();
  const unpaidInvoices = creditInvoices.filter((inv) => {
    const creditAllocated = inv.credit_allocated || 0;
    const creditPaid = inv.credit_paid || 0;
    return creditAllocated > 0 && creditPaid < creditAllocated;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Pay Credit Balance
          </DialogTitle>
          <DialogDescription>
            Make a payment towards {customer?.customer_name}'s
            outstanding credit balance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onPayCredit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Amount (LKR) *</Label>
              <Input
                type="number"
                step="0.01"
                value={payCreditData.amount}
                onChange={(e) =>
                  setPayCreditData({
                    ...payCreditData,
                    amount: e.target.value,
                  })
                }
                placeholder="0.00"
                required
                disabled={isLoading}
              />
              <div className="text-sm text-gray-500 mt-1">
                Outstanding balance: LKR{" "}
                {customer?.credit_balance?.toLocaleString()}
              </div>
            </div>

            <div>
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={payCreditData.payment_date}
                onChange={(e) =>
                  setPayCreditData({
                    ...payCreditData,
                    payment_date: e.target.value,
                  })
                }
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Allocate to Credit Invoices</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAutoAllocate}
                disabled={isLoading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto Allocate
              </Button>
            </div>
            
            {unpaidInvoices.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No unpaid credit invoices found
              </div>
            ) : (
              <>
                <div className="space-y-3 mt-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                  {unpaidInvoices.map((invoice) => {
                    const creditAllocated = invoice.credit_allocated || 0;
                    const creditPaid = invoice.credit_paid || 0;
                    const maxAllocation = creditAllocated - creditPaid;
                    const paidPercentage = creditAllocated > 0
                      ? (creditPaid / creditAllocated) * 100
                      : 0;

                    return (
                      <InvoiceAllocationRow
                        key={invoice.id}
                        invoice={invoice}
                        maxAllocation={maxAllocation}
                        paidPercentage={paidPercentage}
                        allocation={payCreditData.allocations[invoice.id] || ""}
                        onAllocationChange={onAllocationChange}
                        disabled={isLoading}
                      />
                    );
                  })}
                </div>

                <AllocationStatus remainingAllocation={remainingAllocation} />
              </>
            )}
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={payCreditData.notes}
              onChange={(e) =>
                setPayCreditData({ ...payCreditData, notes: e.target.value })
              }
              placeholder="Payment reference or notes..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={remainingAllocation !== 0 || isLoading}
            >
              Process Payment
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceAllocationRow({
  invoice,
  maxAllocation,
  paidPercentage,
  allocation,
  onAllocationChange,
  disabled
}) {
  return (
    <div className="flex items-center justify-between p-2 border-b">
      <div className="flex-1">
        <div className="font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          {invoice.invoice_number}
        </div>
        <div className="text-sm text-gray-500">
          Allocated: LKR {(invoice.credit_allocated || 0)?.toLocaleString()} •
          Paid: LKR {(invoice.credit_paid || 0)?.toLocaleString()} • Due: LKR{" "}
          {maxAllocation?.toLocaleString()}
        </div>
        {paidPercentage > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className="bg-green-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, paidPercentage)}%` }}
            ></div>
          </div>
        )}
      </div>
      <div className="w-32">
        <Input
          type="number"
          step="0.01"
          placeholder="0.00"
          min="0"
          max={maxAllocation}
          value={allocation}
          onChange={(e) => onAllocationChange(invoice.id, e.target.value)}
          className="text-right"
          disabled={disabled}
        />
        <div className="text-xs text-gray-500 text-right mt-1">
          Max: LKR {maxAllocation.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function AllocationStatus({ remainingAllocation }) {
  const isFullyAllocated = remainingAllocation === 0;

  return (
    <div
      className={`flex justify-between items-center mt-2 p-2 rounded ${
        isFullyAllocated
          ? "bg-green-50 text-green-800"
          : "bg-red-50 text-red-800"
      }`}
    >
      <span className="font-medium">
        {isFullyAllocated ? "✓ Fully Allocated" : "Remaining to allocate:"}
      </span>
      <span className="font-bold">
        LKR {remainingAllocation.toLocaleString()}
      </span>
    </div>
  );
}
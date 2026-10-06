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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

export function AdjustCreditDialog({
  isOpen,
  onOpenChange,
  customer,
  adjustCreditData,
  setAdjustCreditData,
  onAdjustCredit,
  isLoading = false
}) {
  const calculateNewBalance = () => {
    const currentBalance = customer?.credit_balance || 0;
    const adjustmentAmount = parseFloat(adjustCreditData.amount) || 0;

    switch (adjustCreditData.adjustment_type) {
      case "set":
        return adjustmentAmount;
      case "increase":
        return currentBalance + adjustmentAmount;
      case "decrease":
        return Math.max(0, currentBalance - adjustmentAmount);
      default:
        return currentBalance;
    }
  };

  const getAdjustmentDescription = () => {
    const currentBalance = customer?.credit_balance || 0;
    const newBalance = calculateNewBalance();
    const difference = newBalance - currentBalance;

    if (difference === 0) return "No change";
    if (difference > 0)
      return `Increase credit by LKR ${difference.toLocaleString()}`;
    return `Decrease credit by LKR ${Math.abs(difference).toLocaleString()}`;
  };

  const getAmountLabel = () => {
    switch (adjustCreditData.adjustment_type) {
      case "set":
        return "New Balance (LKR) *";
      case "increase":
        return "Increase Amount (LKR) *";
      case "decrease":
        return "Decrease Amount (LKR) *";
      default:
        return "Amount (LKR) *";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Adjust Credit Balance
          </DialogTitle>
          <DialogDescription>
            Adjust credit balance for {customer?.customer_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onAdjustCredit} className="space-y-4">
          <CurrentBalanceDisplay balance={customer?.credit_balance} />

          <div>
            <Label>Adjustment Type</Label>
            <Select
              value={adjustCreditData.adjustment_type}
              onValueChange={(value) =>
                setAdjustCreditData({
                  ...adjustCreditData,
                  adjustment_type: value,
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="decrease">
                  Decrease Balance (Customer Payment)
                </SelectItem>
                <SelectItem value="increase">
                  Increase Balance (Credit Given)
                </SelectItem>
                <SelectItem value="set">Set to Specific Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{getAmountLabel()}</Label>
            <Input
              type="number"
              step="0.01"
              value={adjustCreditData.amount}
              onChange={(e) =>
                setAdjustCreditData({
                  ...adjustCreditData,
                  amount: e.target.value,
                })
              }
              placeholder="0.00"
              required
              disabled={isLoading}
            />
          </div>

          <BalancePreview
            currentBalance={customer?.credit_balance || 0}
            newBalance={calculateNewBalance()}
            description={getAdjustmentDescription()}
          />

          <div>
            <Label>Reason for Adjustment *</Label>
            <Select
              value={adjustCreditData.reason}
              onValueChange={(value) =>
                setAdjustCreditData({ ...adjustCreditData, reason: value })
              }
              required
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="correction">Data Correction</SelectItem>
                <SelectItem value="write_off">Bad Debt Write-off</SelectItem>
                <SelectItem value="dispute">
                  Customer Dispute Resolution
                </SelectItem>
                <SelectItem value="additional_credit">
                  Additional Credit Given
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Adjustment Date</Label>
            <Input
              type="date"
              value={adjustCreditData.adjustment_date}
              onChange={(e) =>
                setAdjustCreditData({
                  ...adjustCreditData,
                  adjustment_date: e.target.value,
                })
              }
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              value={adjustCreditData.notes}
              onChange={(e) =>
                setAdjustCreditData({
                  ...adjustCreditData,
                  notes: e.target.value,
                })
              }
              placeholder="Additional details about this adjustment..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              Apply Adjustment
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

function CurrentBalanceDisplay({ balance }) {
  return (
    <div className="p-3 bg-blue-50 rounded-lg">
      <div className="text-sm font-medium text-blue-800">
        Current Outstanding Balance
      </div>
      <div className="text-2xl font-bold text-blue-600">
        LKR {balance?.toLocaleString() || "0"}
      </div>
    </div>
  );
}

function BalancePreview({ currentBalance, newBalance, description }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium text-gray-700">
        Balance Preview
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-sm">New Balance:</span>
        <span className="text-lg font-bold text-purple-600">
          LKR {newBalance.toLocaleString()}
        </span>
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {description}
      </div>
    </div>
  );
}
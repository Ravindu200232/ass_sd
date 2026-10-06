// components/GrnAdjust/QuantityAdjustModal.jsx
import React, { useState } from "react";
import { X, Plus, Minus, RefreshCw, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import api from "@/lib/api";

export const QuantityAdjustModal = ({ 
  grnItem, 
  onClose, 
  onSuccess,
  grnDetails 
}) => {
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isReturn, setIsReturn] = useState(false);
  const [returnToStock, setReturnToStock] = useState(false);

  const currentQty = grnItem?.qty || 0;
  const productCode = grnItem?.product_code;
  const grnCode = grnDetails?.grn_code;

  const calculateNewQuantity = () => {
    const adjQty = parseFloat(quantity) || 0;
    
    switch (adjustmentType) {
      case "add":
        return currentQty + adjQty;
      case "subtract":
        return currentQty - adjQty;
      case "set":
        return adjQty;
      default:
        return currentQty;
    }
  };

  const calculateNewSubtotal = () => {
    const newQty = calculateNewQuantity();
    const actualCost = grnItem?.actual_cost || 0;
    return newQty * actualCost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (adjustmentType === "subtract" && parseFloat(quantity) > currentQty) {
      toast.error("Cannot subtract more than available quantity");
      return;
    }

    const payload = {
      grn_code: grnCode,
      product_code: productCode,
      adjustment_qty: parseInt(quantity),
      adjustment_type: adjustmentType,
      reason: reason,
      is_return: isReturn,
      return_to_stock: isReturn ? returnToStock : false
    };

    setLoading(true);
    try {
      const res = await api.post("/grns/adjust-quantity", payload);
      
      toast.success(res.data.message || "Quantity adjusted successfully");
      
      if (onSuccess) {
        onSuccess(res.data.data);
      }
      
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to adjust quantity");
      console.error("Adjustment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const newQty = calculateNewQuantity();
  const newSubtotal = calculateNewSubtotal();
  const changeAmount = newQty - currentQty;
  const currentSubtotal = (grnItem?.actual_cost || 0) * currentQty;
  const subtotalChange = newSubtotal - currentSubtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Adjust Quantity
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {productCode} - {grnItem?.product_name}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Quantity</p>
              <p className="text-2xl font-bold text-gray-800">{currentQty}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Subtotal</p>
              <p className="text-2xl font-bold text-blue-600">
                LKR {currentSubtotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <RadioGroup 
              value={adjustmentType} 
              onValueChange={setAdjustmentType}
              className="grid grid-cols-3 gap-2"
            >
              <div>
                <RadioGroupItem 
                  value="add" 
                  id="add" 
                  className="peer sr-only" 
                />
                <Label
                  htmlFor="add"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-400 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50"
                >
                  <Plus className="mb-2 h-6 w-6" />
                  <span>Add Stock</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem 
                  value="subtract" 
                  id="subtract" 
                  className="peer sr-only" 
                />
                <Label
                  htmlFor="subtract"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-400 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50"
                >
                  <Minus className="mb-2 h-6 w-6" />
                  <span>Subtract</span>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem 
                  value="set" 
                  id="set" 
                  className="peer sr-only" 
                />
                <Label
                  htmlFor="set"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-400 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50"
                >
                  <RefreshCw className="mb-2 h-6 w-6" />
                  <span>Set To</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {adjustmentType === "add" ? "Quantity to Add" :
               adjustmentType === "subtract" ? "Quantity to Subtract" :
               "Set Quantity To"}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="text-lg font-semibold"
              required
            />
          </div>

          {/* Return Options */}
          <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-return" 
                checked={isReturn}
                onCheckedChange={(checked) => {
                  setIsReturn(checked);
                  if (!checked) setReturnToStock(false);
                }}
              />
              <Label htmlFor="is-return" className="text-yellow-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  This is a return/refund
                </div>
              </Label>
            </div>
            
            {isReturn && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox 
                  id="return-to-stock" 
                  checked={returnToStock}
                  onCheckedChange={setReturnToStock}
                />
                <Label htmlFor="return-to-stock" className="text-gray-700">
                  Return to available stock
                </Label>
              </div>
            )}
          </div>

          {/* Preview */}
          {quantity && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">Preview</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">New Quantity</p>
                  <p className={`text-xl font-bold ${
                    newQty > currentQty ? 'text-green-600' :
                    newQty < currentQty ? 'text-red-600' : 'text-gray-800'
                  }`}>
                    {newQty}
                    {changeAmount !== 0 && (
                      <span className="text-sm ml-2">
                        ({changeAmount > 0 ? '+' : ''}{changeAmount})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Subtotal</p>
                  <p className={`text-xl font-bold ${
                    subtotalChange > 0 ? 'text-green-600' :
                    subtotalChange < 0 ? 'text-red-600' : 'text-gray-800'
                  }`}>
                    LKR {newSubtotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for adjustment</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adjustment..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`
                ${adjustmentType === 'add' ? 'bg-green-600 hover:bg-green-700' :
                  adjustmentType === 'subtract' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {loading ? "Processing..." : 
               adjustmentType === 'add' ? "Add Quantity" :
               adjustmentType === 'subtract' ? "Subtract Quantity" :
               "Set Quantity"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
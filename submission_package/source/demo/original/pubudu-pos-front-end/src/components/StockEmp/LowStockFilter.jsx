import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export const LowStockFilter = ({
  showLowStock,
  setShowLowStock,
  lowStockLimit,
  setLowStockLimit,
}) => {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Low Stock Filter</Label>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={showLowStock}
            onCheckedChange={setShowLowStock}
            id="low-stock-toggle"
          />
          <Label htmlFor="low-stock-toggle" className="cursor-pointer">
            Show Low Stock Items
          </Label>
        </div>
        {showLowStock && (
          <div className="flex items-center gap-2">
            <Label className="text-xs">Limit:</Label>
            <Input
              type="number"
              min="1"
              value={lowStockLimit}
              onChange={(e) => setLowStockLimit(Number(e.target.value))}
              className="h-8 w-20 text-sm"
            />
          </div>
        )}
      </div>
      {showLowStock && (
        <div className="text-xs text-gray-500 mt-1">
          Showing items with quantity ≤ {lowStockLimit}
        </div>
      )}
    </div>
  );
};
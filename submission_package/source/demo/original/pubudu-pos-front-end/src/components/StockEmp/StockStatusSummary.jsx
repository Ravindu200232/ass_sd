import React from "react";
import { Label } from "@/components/ui/label";

export const StockStatusSummary = ({ totals }) => {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Stock Status</Label>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-red-50 border border-red-200 rounded">
          <div className="font-bold text-red-700">{totals.criticalStock}</div>
          <div className="text-red-600">Critical (≤5)</div>
        </div>
        <div className="text-center p-2 bg-orange-50 border border-orange-200 rounded">
          <div className="font-bold text-orange-700">{totals.lowStock}</div>
          <div className="text-orange-600">Low Stock</div>
        </div>
        <div className="text-center p-2 bg-green-50 border border-green-200 rounded">
          <div className="font-bold text-green-700">{totals.normalStock}</div>
          <div className="text-green-600">Normal</div>
        </div>
      </div>
    </div>
  );
};
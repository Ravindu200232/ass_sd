// StockTableBody.jsx - Updated to show department info
import React from "react";
import { Badge } from "@/components/ui/badge";

export const StockTableBody = ({
  data,
  loading,
  error,
  activeRow,
  onRowClick,
}) => {
  // ------------ LOADING ------------
  if (loading) {
    return (
      <tr>
        <td colSpan={7} className="p-8 text-center">
          <div className="flex justify-center items-center gap-3">
            <div className="
              animate-spin h-6 w-6 rounded-full 
              border-2 border-[#D5E3F4] border-t-[#0A6ED1]
            "></div>
            <span className="text-[#0A294F] font-medium">
              Loading stock...
            </span>
          </div>
        </td>
      </tr>
    );
  }

  // ------------ ERROR ------------
  if (error) {
    return (
      <tr>
        <td colSpan={7} className="p-6 text-center text-red-500 font-semibold">
          {error}
        </td>
      </tr>
    );
  }

  // ------------ EMPTY ------------
  if (data.length === 0) {
    return (
      <tr>
        <td colSpan={7} className="p-6 text-center text-[#6B7A99]">
          No records found
        </td>
      </tr>
    );
  }

  // ------------ MAIN ROWS ------------
  return data.map((row) => {
    const minPrice = Math.min(...row.prices);
    const avgPrice =
      row.prices.reduce((a, b) => a + b, 0) / row.prices.length;

    const minMainBranch = Math.min(...row.main_branch_prices);
    const avgActualCost =
      row.actual_costs.reduce((a, b) => a + b, 0) / row.actual_costs.length;

    const isActive = activeRow === row.product_code;

    return (
      <tr
        key={row.product_code}
        onClick={() => onRowClick(row.product_code, row)}
        className={`
          cursor-pointer transition-all
          ${isActive 
            ? "bg-[#D5E9FF] text-[#0A294F] font-medium" 
            : "hover:bg-[#EAF2FB]"
          }
        `}
      >
        {/* PRODUCT CODE */}
        <td className="px-3 py-2 font-mono text-xs text-[#0A294F]">
          {row.product_code}
        </td>

        {/* NAME + CATEGORY */}
        <td className="px-3 py-2">
          <div className="font-semibold text-[#0A294F]">
            {row.product_name}
          </div>
          <div className="text-xs text-[#6B7A99]">{row.category}</div>
        </td>

        {/* BRAND */}
        <td className="px-3 py-2">
          <Badge
            variant="outline"
            className="
              text-xs border-[#C8D4E9] text-[#0A294F]
              bg-[#F5F8FC]
            "
          >
            {row.brand_name}
          </Badge>
        </td>

        {/* DEPARTMENT */}
        <td className="px-3 py-2">
          <Badge
            variant="outline"
            className="
              text-xs border-[#0A6ED1] text-[#0A6ED1]
              bg-[#0A6ED1]/10
            "
          >
            {row.department_name}
          </Badge>
        </td>

        {/* MIN PRICE */}
        <td className="px-3 py-2">
          <div className="font-semibold text-[#0A294F]">
            LKR {minPrice.toLocaleString()}
          </div>
          <div className="text-xs text-[#6B7A99]">
            Branch: LKR {minMainBranch.toLocaleString()}
          </div>
        </td>

        {/* AVG PRICE */}
        <td className="px-3 py-2">
          <div className="font-semibold text-[#0A294F]">
            LKR {avgPrice.toFixed(2)}
          </div>
          <div className="text-xs text-[#6B7A99]">
            Cost: LKR {avgActualCost.toFixed(2)}
          </div>
        </td>

        {/* STOCK QTY */}
        <td className="px-3 py-2 text-right">
          <Badge
            variant={row.total_qty > 0 ? "default" : "destructive"}
            className={`
              text-xs font-mono 
              ${row.total_qty > 0 
                ? "bg-[#0A6ED1] text-white" 
                : "bg-red-100 text-red-700"}
            `}
          >
            {row.total_qty}
          </Badge>
        </td>
      </tr>
    );
  });
};
import React from "react";
import { Search, Trash2 } from "lucide-react";

/* -----------------------------------------------------------
   GRN TABLE HEADER - COMPACT CLASSIC DESIGN
----------------------------------------------------------- */
export function GRNTableHeader() {
  return (
    <thead className="bg-[#F5F9FC] sticky top-0 z-10">
      <tr className="border-b-2 border-[#0A6ED1]">
       
        <th className="text-[#32363A] font-semibold text-left px-2 py-1.5 text-[11px] border-r border-[#E5E5E5] min-w-[200px]">
          Product
        </th>
        <th className="text-[#32363A] font-semibold text-right px-2 py-1.5 text-[11px] border-r border-[#E5E5E5] whitespace-nowrap">
          Stock Price
        </th>
        <th className="text-[#32363A] font-semibold text-right px-2 py-1.5 text-[11px] border-r border-[#E5E5E5] whitespace-nowrap">
          Main Branch
        </th>
        <th className="text-[#32363A] font-semibold text-right px-2 py-1.5 text-[11px] border-r border-[#E5E5E5] whitespace-nowrap">
          Selling Price
        </th>
        <th className="text-[#32363A] font-semibold text-center px-2 py-1.5 text-[11px] border-r border-[#E5E5E5]">
          D1%
        </th>
        <th className="text-[#32363A] font-semibold text-center px-2 py-1.5 text-[11px] border-r border-[#E5E5E5]">
          D2%
        </th>
        <th className="text-[#32363A] font-semibold text-center px-2 py-1.5 text-[11px] border-r border-[#E5E5E5]">
          D3%
        </th>
        <th className="text-[#32363A] font-semibold text-center px-2 py-1.5 text-[11px] border-r border-[#E5E5E5]">
          D4%
        </th>
        <th className="text-[#32363A] font-semibold text-right px-2 py-1.5 text-[11px] border-r border-[#E5E5E5] whitespace-nowrap">
          Actual Cost
        </th>
        <th className="text-[#32363A] font-semibold text-center px-2 py-1.5 text-[11px] border-r border-[#E5E5E5]">
          Qty
        </th>
        <th className="text-[#32363A] font-semibold text-right px-2 py-1.5 text-[11px] border-r border-[#E5E5E5]">
          Total
        </th>
        <th className="text-[#32363A] font-semibold text-center px-2 py-1.5 text-[11px]">
          Action
        </th>
      </tr>
    </thead>
  );
}

/* -----------------------------------------------------------
   GRN TABLE ROW - COMPACT CLASSIC DESIGN
----------------------------------------------------------- */
export function GRNTableRow({
  item,
  index,
  onProductSearchClick,
  onInlineSearchChange,
  onInlineSelect,
  onUpdateItem,
  onRemoveItem,
  inlineSuggestions,
  hideInlineSuggestions,
  latestStockPrices,
}) {
  const suggestions = inlineSuggestions[index] || { open: false, list: [] };
  
  // Format number with commas
  const formatNumber = (num) => {
    const value = parseFloat(num) || 0;
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Calculate total for this row
  const rowTotal = (parseFloat(item.actual_cost) || 0) * (parseInt(item.qty) || 0);

  // Check if product has latest GRN data
  const hasLatestData = item.product_code && latestStockPrices[item.product_code];

  return (
    <tr className="border-b border-[#E5E5E5] hover:bg-[#F5F9FC] transition-colors">
      {/* INDEX */}
      <td className="px-2 py-1 text-[11px] text-gray-600 border-r border-[#E5E5E5]">
        {index + 1}
      </td>

      {/* PRODUCT SEARCH */}
      <td className="px-2 py-1 border-r border-[#E5E5E5] relative">
        <div className="flex items-center gap-1">
          <div className="flex-1 relative">
            
            
            {/* Inline Suggestions Dropdown */}
            {suggestions.open && suggestions.list.length > 0 && (
              <div className="absolute top-full left-0 w-full max-w-md bg-white border border-[#0A6ED1] rounded shadow-lg mt-1 max-h-[300px] overflow-y-auto z-50">
                {suggestions.list.map((prod) => (
                  <div
                    key={prod.product_code}
                    onClick={() => onInlineSelect(index, prod)}
                    className="px-3 py-2 hover:bg-[#E7F2FF] cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-[11px] text-[#0A6ED1] leading-tight">
                      {prod.product_name}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-0.5">
                      Code: {prod.product_code} | {prod.brand || "N/A"} | {prod.size || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => onProductSearchClick(index)}
            className="flex-shrink-0 p-1.5 bg-[#0A6ED1] text-white rounded hover:bg-[#0858A8] transition-colors"
            title="Search Products"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
        
        {/* Product Code & Description */}
        {item.product_code && (
          <div className="mt-1 text-[10px] text-gray-600 leading-tight">
            <div className="flex items-center gap-1">
              <span className="font-medium text-[#0A6ED1]">{item.product_code}</span>
              {hasLatestData && (
                <span className="bg-green-100 text-green-700 px-1 py-0.5 rounded text-[9px]">
                  Latest
                </span>
              )}
            </div>
            {item.product_description && (
              <div className="text-gray-500 mt-0.5">{item.product_description}</div>
            )}
          </div>
        )}
      </td>

      {/* STOCK PRICE */}
      <td className="px-2 py-1 border-r border-[#E5E5E5]">
        <input
          type="number"
          step="0.01"
          value={item.stock_price}
          onChange={(e) => onUpdateItem(index, "stock_price", e.target.value)}
          className="w-full px-1 py-1 text-[11px] text-right border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] min-w-[80px]"
          placeholder="0.00"
        />
      </td>

      {/* MAIN BRANCH PRICE */}
      <td className="px-2 py-1 border-r border-[#E5E5E5]">
        <input
          type="number"
          step="0.01"
          value={item.main_branch_price}
          onChange={(e) => onUpdateItem(index, "main_branch_price", e.target.value)}
          className="w-full px-1 py-1 text-[11px] text-right border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] min-w-[80px]"
          placeholder="0.00"
        />
      </td>

      {/* SELLING PRICE */}
      <td className="px-2 py-1 border-r border-[#E5E5E5]">
        <input
          type="number"
          step="0.01"
          value={item.selling_price}
          onChange={(e) => onUpdateItem(index, "selling_price", e.target.value)}
          className="w-full px-1 py-1 text-[11px] text-right border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] min-w-[80px]"
          placeholder="0.00"
        />
      </td>

      {/* DISCOUNT 1 */}
      <td className="px-2 py-1 border-r border-[#E5E5E5]">
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={item.discount1}
          onChange={(e) => onUpdateItem(index, "discount1", e.target.value)}
          className={`w-full px-1 py-1 text-[11px] text-center border rounded focus:outline-none focus:ring-1 min-w-[50px] ${parseFloat(item.discount1) > 100 ? 'border-red-500 focus:border-red-500 focus:ring-red-400 bg-red-50' : 'border-gray-300 focus:border-[#0A6ED1] focus:ring-[#0A6ED1]'}`}
          placeholder="0"
        />
      </td>

      {/* DISCOUNT 2 */}
      <td className="px-2 py-1 border-r border-[#E5E5E5]">
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={item.discount2}
          onChange={(e) => onUpdateItem(index, "discount2", e.target.value)}
          className={`w-full px-1 py-1 text-[11px] text-center border rounded focus:outline-none focus:ring-1 min-w-[50px] ${parseFloat(item.discount2) > 100 ? 'border-red-500 focus:border-red-500 focus:ring-red-400 bg-red-50' : 'border-gray-300 focus:border-[#0A6ED1] focus:ring-[#0A6ED1]'}`}
          placeholder="0"
        />
      </td>

      {/* DISCOUNT 3 */}
      <td className="px-2 py-1 border-r border-[#E5E5E5]">
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={item.discount3}
          onChange={(e) => onUpdateItem(index, "discount3", e.target.value)}
          className={`w-full px-1 py-1 text-[11px] text-center border rounded focus:outline-none focus:ring-1 min-w-[50px] ${parseFloat(item.discount3) > 100 ? 'border-red-500 focus:border-red-500 focus:ring-red-400 bg-red-50' : 'border-gray-300 focus:border-[#0A6ED1] focus:ring-[#0A6ED1]'}`}
          placeholder="0"
        />
      </td>

      {/* DISCOUNT 4 */}
      <td className="px-2 py-1 border-r border-[#E5E5E5]">
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={item.discount4}
          onChange={(e) => onUpdateItem(index, "discount4", e.target.value)}
          className={`w-full px-1 py-1 text-[11px] text-center border rounded focus:outline-none focus:ring-1 min-w-[50px] ${parseFloat(item.discount4) > 100 ? 'border-red-500 focus:border-red-500 focus:ring-red-400 bg-red-50' : 'border-gray-300 focus:border-[#0A6ED1] focus:ring-[#0A6ED1]'}`}
          placeholder="0"
        />
      </td>

      {/* ACTUAL COST */}
      <td className="px-2 py-1 border-r border-[#E5E5E5] text-right text-[11px] font-medium text-[#0A6ED1] whitespace-nowrap">
        {formatNumber(item.actual_cost)}
      </td>

      {/* QUANTITY */}
      <td className="px-2 py-1 border-r border-[#E5E5E5]">
        <input
          type="number"
          min="0"
          value={item.qty}
          onChange={(e) => onUpdateItem(index, "qty", e.target.value)}
          className="w-full px-1 py-1 text-[11px] text-center border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] min-w-[50px]"
        />
      </td>

      {/* TOTAL */}
      <td className="px-2 py-1 border-r border-[#E5E5E5] text-right text-[11px] font-semibold text-[#0A6ED1] whitespace-nowrap">
        {formatNumber(rowTotal)}
      </td>

      {/* ACTION */}
      <td className="px-2 py-1 text-center">
        <button
          type="button"
          onClick={() => onRemoveItem(index)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Remove"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}
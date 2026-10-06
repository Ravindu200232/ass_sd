import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, Clock } from "lucide-react";

// Helper function to get latest selling price from GRN items
const getLatestSellingPrice = (grnItems) => {
  if (!grnItems || grnItems.length === 0) return 0;
  
  // Sort by date descending to get the latest
  const sortedItems = [...grnItems].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  return sortedItems[0]?.selling_price || 0;
};

// Helper function to get price trend
const getPriceTrend = (grnItems, currentPrice) => {
  if (!grnItems || grnItems.length < 2) return null;
  
  const sortedItems = [...grnItems].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  if (sortedItems.length < 2) return null;
  
  const previousPrice = sortedItems[1]?.selling_price;
  if (!previousPrice) return null;
  
  const difference = currentPrice - previousPrice;
  return {
    difference,
    isIncrease: difference > 0,
    isDecrease: difference < 0
  };
};

export const ProductTable = ({ 
  paged, 
  loading, 
  showLowStock, 
  lowStockLimit, 
  total, 
  setSelectedProduct,
  pageSize,
  setPageSize,
  setPage,
  getDepartmentName,
  departmentFilter,
  selectedProduct // Add selectedProduct prop
}) => {
  // Get stock status with early design colors
  const getStockStatus = (quantity, lowStockLimit) => {
    if (quantity <= 5) return { 
      status: "CRITICAL", 
      color: "bg-red-100 text-red-800 border-red-200",
      badgeColor: "bg-red-500/20 text-red-700 border-red-300"
    };
    if (quantity <= lowStockLimit) return { 
      status: "LOW", 
      color: "bg-orange-100 text-orange-800 border-orange-200",
      badgeColor: "bg-orange-500/20 text-orange-700 border-orange-300"
    };
    return { 
      status: "NORMAL", 
      color: "bg-green-100 text-green-800 border-green-200",
      badgeColor: "bg-green-500/20 text-green-700 border-green-300"
    };
  };

  return (
    <div className="relative">
      {/* Table container with custom scrollbar */}
      <div className="
        overflow-x-auto rounded-xl border 
        border-[#D5E3F4] shadow-lg
        bg-white
        scrollbar-thin scrollbar-thumb-[#003366]/30 scrollbar-track-gray-100
        hover:scrollbar-thumb-[#003366]/50
      ">
        <table className="min-w-full text-sm">
          {/* Title Header */}
          <thead className="sticky top-0 z-20">
            <tr className="
              bg-gradient-to-r from-[#003366] via-[#0A294F] to-[#003366]
              shadow-lg
            ">
              <th colSpan="7" className="px-6 py-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg font-bold">📦</span>
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg">
                        Live Stock Inventory
                      </h2>
                      <p className="text-white/80 text-xs">
                        Showing {paged.length} of {total} products • {getDepartmentName(departmentFilter)}
                        {showLowStock && (
                          <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-white rounded">
                            Low Stock (≤{lowStockLimit})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-white/90 text-sm font-medium bg-white/10 px-3 py-1 rounded-lg">
                    Page Size
                    <select
                      className="ml-2 bg-transparent border-0 text-white focus:ring-0"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 25, 50, 100].map((n) => (
                        <option key={n} value={n} className="text-gray-900">{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          {/* Column Headers - Using Early Design */}
          <thead className="sticky top-[68px] z-20">
            <tr className="bg-gradient-to-r from-blue-50 via-white to-blue-50">
              <th className="
                px-6 py-4 text-left font-bold
                text-[#003366] uppercase tracking-wider
                cursor-pointer select-none
                hover:bg-blue-100/50
                border-b-2 border-blue-200
                transition-all duration-200
              ">
                <div className="flex items-center gap-2">
                  Code
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="
                px-6 py-4 text-left font-bold
                text-[#003366] uppercase tracking-wider
                cursor-pointer select-none
                hover:bg-blue-100/50
                border-b-2 border-blue-200
                transition-all duration-200
              ">
                <div className="flex items-center gap-2">
                  Product
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="
                px-6 py-4 text-left font-bold
                text-[#003366] uppercase tracking-wider
                cursor-pointer select-none
                hover:bg-blue-100/50
                border-b-2 border-blue-200
                transition-all duration-200
              ">
                <div className="flex items-center gap-2">
                  Price
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="
                px-6 py-4 text-left font-bold
                text-[#003366] uppercase tracking-wider
                cursor-pointer select-none
                hover:bg-blue-100/50
                border-b-2 border-blue-200
                transition-all duration-200
              ">
                <div className="flex items-center gap-2">
                  Qty
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="
                px-6 py-4 text-left font-bold
                text-[#003366] uppercase tracking-wider
                cursor-pointer select-none
                hover:bg-blue-100/50
                border-b-2 border-blue-200
                transition-all duration-200
              ">
                <div className="flex items-center gap-2">
                  Brand
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="
                px-6 py-4 text-left font-bold
                text-[#003366] uppercase tracking-wider
                cursor-pointer select-none
                hover:bg-blue-100/50
                border-b-2 border-blue-200
                transition-all duration-200
              ">
                <div className="flex items-center gap-2">
                  Value
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </th>
              <th className="
                px-6 py-4 text-left font-bold
                text-[#003366] uppercase tracking-wider
                cursor-pointer select-none
                hover:bg-blue-100/50
                border-b-2 border-blue-200
                transition-all duration-200
              ">
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="h-4 w-4 text-gray-400" />
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A6ED1] border-t-transparent"></div>
                    <p className="text-gray-600">Loading stock data...</p>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <p className="text-gray-700 font-medium">
                      {showLowStock 
                        ? `No low stock items found (limit: ≤${lowStockLimit})` 
                        : "No items found"}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row) => {
                const latestPrice = getLatestSellingPrice(row.grn_items);
                const priceTrend = getPriceTrend(row.grn_items, latestPrice);
                const { status, color, badgeColor } = getStockStatus(row.total_qty, lowStockLimit);
                const isSelected = selectedProduct && selectedProduct.product_code === row.product_code;
                
                return (
                  <tr
                    key={row.product_code}
                    onClick={() => setSelectedProduct(row)}
                    className={`
                      group cursor-pointer transition-all duration-200
                      ${isSelected ? 'bg-[#FFD700]' : 'bg-white'}
                      hover:bg-[#003366] hover:text-white
                      border-b border-gray-100 last:border-b-0
                    `}
                  >
                    {/* Code Column */}
                    <td className={`
                      px-6 py-4 font-mono font-semibold 
                      ${isSelected ? 'text-gray-900' : 'text-[#0A294F]'}
                      group-hover:text-white
                    `}>
                      <div className="flex items-center gap-2">
                        {row.product_code}
                        {row.total_qty <= 5 && (
                          <span className={`
                            h-2 w-2 rounded-full
                            ${isSelected ? 'bg-red-700' : 'bg-red-500'}
                            animate-pulse
                          `}></span>
                        )}
                      </div>
                    </td>

                    {/* Product Name Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`
                          font-medium truncate max-w-xs
                          ${isSelected ? 'text-gray-900' : 'text-[#1A365D]'}
                          group-hover:text-white
                        `}>
                          {row.product_name}
                        </span>
                        {row.category && (
                          <span className={`
                            text-xs mt-1
                            ${isSelected ? 'text-gray-700' : 'text-gray-500'}
                            group-hover:text-gray-300
                          `}>
                            {row.category}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price Column - Latest Selling Price */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`
                            font-bold text-lg
                            ${isSelected ? 'text-gray-900' : 'text-green-700'}
                            group-hover:text-white
                          `}>
                            LKR {latestPrice.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                          
                          {/* Price trend indicator */}
                          {priceTrend && (
                            <div className={`
                              flex items-center gap-1 px-2 py-1 rounded
                              text-xs font-medium
                              ${priceTrend.isIncrease ? 'bg-green-100 text-green-800' : 
                                priceTrend.isDecrease ? 'bg-red-100 text-red-800' : 
                                'bg-gray-100 text-gray-800'}
                              ${isSelected ? 'bg-opacity-80' : ''}
                              group-hover:bg-white/30 group-hover:text-white
                            `}>
                              {priceTrend.isIncrease ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : priceTrend.isDecrease ? (
                                <TrendingUp className="h-3 w-3 rotate-180" />
                              ) : null}
                              {priceTrend.isIncrease ? '+' : ''}
                              {priceTrend.difference.toFixed(2)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`
                            text-xs flex items-center gap-1
                            ${isSelected ? 'text-gray-700' : 'text-gray-500'}
                            group-hover:text-gray-300
                          `}>
                            <Clock className="h-3 w-3" />
                            Latest Price
                          </span>
                          
                          {row.grn_items && row.grn_items.length > 0 && (
                            <span className={`
                              text-[10px] px-2 py-0.5 rounded
                              ${isSelected ? 'bg-purple-200 text-purple-900' : 'bg-purple-50 text-purple-700'}
                              group-hover:bg-white/20 group-hover:text-white
                            `}>
                              {row.grn_items.length} GRN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quantity Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`
                          font-bold text-lg
                          ${isSelected ? 'text-gray-900' : 'text-[#0A294F]'}
                          group-hover:text-white
                        `}>
                          {row.total_qty.toLocaleString()}
                        </span>
                        
                        {/* Stock indicators */}
                        {row.total_qty <= (lowStockLimit || 10) && (
                          <div className="flex gap-1 mt-1">
                            {row.total_qty <= 5 ? (
                              <span className={`
                                text-xs px-2 py-0.5 rounded-full flex items-center gap-1
                                ${isSelected ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}
                                group-hover:bg-red-600
                              `}>
                                <span className={`
                                  inline-block h-1.5 w-1.5 rounded-full
                                  ${isSelected ? 'bg-white' : 'bg-white'}
                                `}></span>
                                Critical
                              </span>
                            ) : (
                              <span className={`
                                text-xs px-2 py-0.5 rounded-full flex items-center gap-1
                                ${isSelected ? 'bg-orange-200 text-orange-900' : 'bg-orange-100 text-orange-800'}
                                group-hover:bg-orange-200 group-hover:text-orange-900
                              `}>
                                <span className={`
                                  inline-block h-1.5 w-1.5 rounded-full
                                  ${isSelected ? 'bg-orange-700' : 'bg-orange-600'}
                                `}></span>
                                Low Stock
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Brand Column */}
                    <td className="px-6 py-4">
                      <div className={`
                        px-4 py-2 rounded-lg font-semibold text-sm
                        ${isSelected 
                          ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200' 
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200'
                        }
                        group-hover:bg-gradient-to-r group-hover:from-white/20 group-hover:to-white/10 
                        group-hover:text-white group-hover:border-white/30
                      `}>
                        {row.brand || 'Unbranded'}
                      </div>
                    </td>

                    {/* Total Value Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`
                          font-bold text-lg
                          ${isSelected ? 'text-gray-900' : 'text-purple-700'}
                          group-hover:text-white
                        `}>
                          LKR {row.total_value.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                        <span className={`
                          text-xs mt-1
                          ${isSelected ? 'text-gray-700' : 'text-gray-500'}
                          group-hover:text-gray-300
                        `}>
                          Stock Value
                        </span>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline" 
                        className={`
                          text-xs font-bold px-3 py-1.5
                          ${badgeColor}
                          ${isSelected ? 'border-opacity-80' : ''}
                          group-hover:bg-white/30 group-hover:text-white group-hover:border-white/50
                        `}
                      >
                        {status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer with summary */}
          {paged.length > 0 && !loading && (
            <tfoot className="
              bg-gradient-to-r from-gray-50 to-gray-100
              border-t border-gray-200 sticky bottom-0 z-10
            ">
              <tr>
                <td colSpan="7" className="px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-800">
                        {paged.length}
                      </span> of <span className="font-medium text-gray-800">
                        {total}
                      </span> items shown • 
                      <span className="font-medium text-gray-800 ml-2">
                        Department: {getDepartmentName(departmentFilter)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-800 font-semibold">
                          Total Value: LKR {paged.reduce((sum, row) => sum + row.total_value, 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Legend for color codes */}
      {paged.length > 0 && !loading && (
        <div className="
          mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 
          rounded-lg border border-gray-200
          flex flex-wrap items-center gap-4 
          text-sm text-gray-700
        ">
          <div className="font-medium text-gray-900">Color Legend:</div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#FFD700] border border-amber-300"></div>
            <span>Selected Row (Yellow)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#003366]"></div>
            <span>Hover State (Dark Blue High Contrast)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-100 border border-green-300"></div>
            <span>Normal Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-orange-100 border border-orange-300"></div>
            <span>Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-100 border border-red-300"></div>
            <span>Critical Stock (≤5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-blue-100 border border-blue-300"></div>
            <span>Column Headers</span>
          </div>
        </div>
      )}
    </div>
  );
};
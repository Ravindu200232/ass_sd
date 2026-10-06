// StockTable.jsx - Fixed header with blue text
import React from "react";
import { ArrowUpDown, AlertCircle, Loader2, TrendingUp, Clock, ChevronUp, ChevronDown } from "lucide-react";

// Custom header component with BLUE TEXT
const StockTableHeader = ({ sortConfig, onSort }) => {
  const headers = [
    { key: "product_code", label: "Code" },
    { key: "product_name", label: "Product" },
    { key: "selling_price", label: "Price" },
    { key: "total_qty", label: "Qty" },
    { key: "brand_name", label: "Brand" }
  ];

  return (
    <tr className="bg-gradient-to-r from-blue-50 via-white to-blue-50">
      {headers.map((header) => (
        <th
          key={header.key}
          className={`
            px-6 py-4 text-left font-bold
            text-[#003366] uppercase tracking-wider
            cursor-pointer select-none
            hover:bg-blue-100/50
            border-b-2 border-blue-200
            transition-all duration-200
          `}
          onClick={() => onSort(header.key)}
        >
          <div className="flex items-center gap-2">
            <span className="text-[#003366] font-bold">
              {header.label}
            </span>
            <div className="flex flex-col">
              <ChevronUp 
                className={`h-3 w-3 ${
                  sortConfig.key === header.key && sortConfig.direction === 'asc' 
                    ? 'text-[#0A6ED1]' 
                    : 'text-gray-400'
                }`}
              />
              <ChevronDown 
                className={`h-3 w-3 -mt-1 ${
                  sortConfig.key === header.key && sortConfig.direction === 'desc' 
                    ? 'text-[#0A6ED1]' 
                    : 'text-gray-400'
                }`}
              />
            </div>
          </div>
        </th>
      ))}
    </tr>
  );
};

// Helper function to get latest selling price from batches
const getLatestSellingPrice = (row) => {
  if (!row.batches || row.batches.length === 0) {
    return row.selling_price || row.price || 0;
  }
  
  // Sort batches by date descending to get the latest
  const sortedBatches = [...row.batches].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  // Return selling_price from the latest batch, fallback to price
  const latestBatch = sortedBatches[0];
  return latestBatch?.selling_price || latestBatch?.price || row.selling_price || row.price || 0;
};

// Helper function to get price trend indicator
const getPriceTrend = (row, latestPrice) => {
  if (!row.batches || row.batches.length < 2) return null;
  
  const sortedBatches = [...row.batches].sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return dateB - dateA;
  });
  
  if (sortedBatches.length < 2) return null;
  
  const previousPrice = sortedBatches[1]?.selling_price || sortedBatches[1]?.price;
  const currentPrice = latestPrice;
  
  if (!previousPrice) return null;
  
  const difference = currentPrice - previousPrice;
  const percentage = (difference / previousPrice) * 100;
  
  return {
    difference,
    percentage,
    isIncrease: difference > 0,
    isDecrease: difference < 0
  };
};

// Custom body component
const StockTableBody = ({ data, loading, error, activeRow, onRowClick }) => {
  if (loading) {
    return (
      <tr>
        <td colSpan="5" className="px-6 py-24 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#0A6ED1]" />
            <p className="text-gray-600">Loading stock data...</p>
          </div>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan="5" className="px-6 py-24 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-red-600 font-medium">Error loading data</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </td>
      </tr>
    );
  }

  if (data.length === 0) {
    return (
      <tr>
        <td colSpan="5" className="px-6 py-24 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-gray-700 font-medium">No stock items found</p>
            <p className="text-gray-500 text-sm">
              Try adjusting your filters or search terms
            </p>
          </div>
        </td>
      </tr>
    );
  }

  return data.map((row) => {
    const latestSellingPrice = getLatestSellingPrice(row);
    const priceTrend = getPriceTrend(row, latestSellingPrice);
    const isActive = activeRow === row.product_code;
    
    return (
      <tr
        key={row.product_code}
        onClick={() => onRowClick(row.product_code, row)}
        className={`
          group cursor-pointer transition-all duration-200
          ${isActive ? 'bg-[#FFD700]' : 'bg-white'}
          hover:bg-[#003366] hover:text-white
          border-b border-gray-100 last:border-b-0
        `}
      >
        {/* Code Column */}
        <td className={`
          px-6 py-4 font-mono font-semibold 
          ${isActive ? 'text-gray-900' : 'text-[#0A294F]'}
          group-hover:text-white
        `}>
          <div className="flex items-center gap-2">
            {row.product_code}
            {row.is_new && (
              <span className="
                px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-50 
                text-green-800 text-[10px] font-bold rounded-full
                border border-green-200
                group-hover:bg-green-200 group-hover:text-green-900
              ">
                NEW
              </span>
            )}
          </div>
        </td>

        {/* Product Name Column */}
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className={`
              font-medium truncate max-w-xs
              ${isActive ? 'text-gray-900' : 'text-[#1A365D]'}
              group-hover:text-white
            `}>
              {row.product_name}
            </span>
            {row.category && (
              <span className={`
                text-xs mt-1
                ${isActive ? 'text-gray-700' : 'text-gray-500'}
                group-hover:text-gray-300
              `}>
                {row.category}
              </span>
            )}
          </div>
        </td>

        {/* Price Column - FIXED: Shows latest selling price */}
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`
                font-bold text-lg
                ${isActive ? 'text-gray-900' : 'text-green-700'}
                group-hover:text-white
              `}>
                LKR {latestSellingPrice.toLocaleString('en-US', {
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
                  ${isActive ? 'bg-opacity-80' : ''}
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
            
            {/* Price metadata */}
            <div className="flex items-center gap-3 mt-2">
              <span className={`
                text-xs flex items-center gap-1
                ${isActive ? 'text-gray-700' : 'text-gray-500'}
                group-hover:text-gray-300
              `}>
                <Clock className="h-3 w-3" />
                Latest Selling Price
              </span>
              
              {/* Show number of price entries if available */}
              {row.prices && row.prices.length > 0 && (
                <span className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-blue-50 text-blue-700'}
                  group-hover:bg-white/20 group-hover:text-white
                `}>
                  {row.prices.length} price points
                </span>
              )}
            </div>
            
            {/* Show if price is from latest GRN */}
            {row.batches && row.batches.length > 0 && (
              <div className="mt-1">
                <span className={`
                  text-[10px] px-2 py-0.5 rounded
                  ${isActive ? 'bg-purple-100 text-purple-800' : 'bg-purple-50 text-purple-700'}
                  group-hover:bg-white/20 group-hover:text-white
                `}>
                  From latest GRN
                </span>
              </div>
            )}
          </div>
        </td>

        {/* Quantity Column */}
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className={`
              font-bold text-lg
              ${isActive ? 'text-gray-900' : 'text-[#0A294F]'}
              group-hover:text-white
            `}>
              {row.total_qty.toLocaleString()}
            </span>
            
            {/* Stock status indicators */}
            <div className="flex flex-wrap gap-1 mt-2">
              {row.total_qty <= 0 ? (
                <span className="
                  text-xs px-2 py-0.5 bg-gray-500 text-white 
                  rounded-full flex items-center gap-1
                  group-hover:bg-gray-600
                ">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                  Out of Stock
                </span>
              ) : (
                <>
                  {/* Low stock warning */}
                  {row.total_qty <= (row.min_stock_level || 10) && (
                    <span className="
                      text-xs px-2 py-0.5 bg-red-100 text-red-800 
                      rounded-full flex items-center gap-1
                      group-hover:bg-red-200 group-hover:text-red-900
                    ">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-600"></span>
                      Low Stock
                    </span>
                  )}
                  
                  {/* Critical stock */}
                  {row.total_qty <= (row.min_stock_level || 10) * 0.5 && (
                    <span className="
                      text-xs px-2 py-0.5 bg-red-500 text-white 
                      rounded-full flex items-center gap-1
                      group-hover:bg-red-600
                    ">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-white"></span>
                      Critical
                    </span>
                  )}
                </>
              )}
              
              {/* High stock indicator */}
              {row.total_qty >= (row.max_stock_level || 1000) && (
                <span className="
                  text-xs px-2 py-0.5 bg-green-100 text-green-800 
                  rounded-full flex items-center gap-1
                  group-hover:bg-green-200 group-hover:text-green-900
                ">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-600"></span>
                  High Stock
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Brand Column */}
        <td className="px-6 py-4">
          <div className="flex flex-col gap-2">
            <div className={`
              px-4 py-2 rounded-lg font-semibold text-sm
              ${isActive 
                ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200' 
                : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border border-gray-200'
              }
              group-hover:bg-gradient-to-r group-hover:from-white/20 group-hover:to-white/10 
              group-hover:text-white group-hover:border-white/30
            `}>
              {row.brand_name || 'Unbranded'}
            </div>
            
            {/* Additional metadata */}
            <div className="flex gap-2">
              {/* Department badge */}
              {row.department_name && (
                <span className={`
                  text-xs px-2 py-1 rounded-full font-medium
                  ${isActive 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-50 text-blue-700'
                  }
                  group-hover:bg-white/30 group-hover:text-white
                `}>
                  {row.department_name.substring(0, 3).toUpperCase()}
                </span>
              )}
              
              {/* Supplier info if available */}
              {row.supplier_name && (
                <span className={`
                  text-xs px-2 py-1 rounded-full truncate max-w-[80px]
                  ${isActive 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-amber-50 text-amber-700'
                  }
                  group-hover:bg-white/30 group-hover:text-white
                `}
                title={`Supplier: ${row.supplier_name}`}
                >
                  {row.supplier_name.substring(0, 10)}...
                </span>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  });
};

// Main StockTable component
export const StockTable = ({
  data,
  loading,
  error,
  sortConfig,
  activeRow,
  onSort,
  onRowClick,
}) => {
  // Calculate totals for footer
  const calculateTotals = () => {
    const totals = {
      totalItems: data.length,
      totalQuantity: 0,
      totalValue: 0
    };
    
    data.forEach(row => {
      const latestPrice = getLatestSellingPrice(row);
      totals.totalQuantity += row.total_qty || 0;
      totals.totalValue += latestPrice * (row.total_qty || 0);
    });
    
    return totals;
  };

  const totals = data.length > 0 ? calculateTotals() : null;

  return (
    <div className="relative">
      {/* Table container with custom scrollbar */}
      <div className="
        overflow-x-auto rounded-xl border 
        border-[#003366]/20 shadow-lg
        bg-white
        scrollbar-thin scrollbar-thumb-[#003366]/30 scrollbar-track-gray-100
        hover:scrollbar-thumb-[#003366]/50
      ">
        <table className="min-w-full text-sm">
          {/* Main Title Header */}
          <thead className="sticky top-0 z-20">
            <tr className="
              bg-gradient-to-r from-[#003366] via-[#0A294F] to-[#003366]
              shadow-lg
            ">
              <th colSpan="5" className="px-6 py-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg font-bold">📊</span>
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg">
                        Live Stock Overview
                      </h2>
                      <p className="text-white/80 text-xs">
                        Latest selling prices from most recent GRN entries
                      </p>
                    </div>
                  </div>
                  <div className="text-white/90 text-sm font-medium bg-white/10 px-3 py-1 rounded-lg">
                    {data.length} items
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          {/* Column Headers with BLUE TEXT */}
          <thead className="sticky top-[68px] z-20">
            <StockTableHeader sortConfig={sortConfig} onSort={onSort} />
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-100">
            <StockTableBody
              data={data}
              loading={loading}
              error={error}
              activeRow={activeRow}
              onRowClick={onRowClick}
            />
          </tbody>

          {/* Footer with summary */}
          {totals && (
            <tfoot className="
              bg-gradient-to-r from-gray-50 to-gray-100
              border-t border-gray-200 sticky bottom-0 z-10
            ">
              <tr>
                <td colSpan="5" className="px-6 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm">
                      <span className="font-medium text-gray-800">
                        {totals.totalItems}
                      </span> items • 
                      <span className="font-medium text-gray-800 ml-2">
                        {totals.totalQuantity.toLocaleString()}
                      </span> total units
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-800 font-semibold">
                          Total Value: LKR {totals.totalValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-800 font-semibold">
                          Avg Price: LKR {(totals.totalValue / totals.totalQuantity || 0).toLocaleString('en-US', {
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
      {data.length > 0 && !loading && !error && (
        <div className="
          mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 
          rounded-lg border border-gray-200
          flex flex-wrap items-center gap-4 
          text-sm text-gray-700
        ">
          <div className="font-medium text-gray-900">Color Legend:</div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#FFD700] border border-amber-300"></div>
            <span>Selected Row</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#003366]"></div>
            <span>Hover State (High Contrast)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-100 border border-green-300"></div>
            <span>Latest Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-100 border border-red-300"></div>
            <span>Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-blue-100 border border-blue-300"></div>
            <span>Department</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-[#003366] border border-blue-800"></div>
            <span>Header Text</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Export helper functions for use in other components if needed
export { getLatestSellingPrice, getPriceTrend };
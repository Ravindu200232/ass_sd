import React, { useRef, useEffect } from 'react';
import { Search, X, History, Trash2 } from "lucide-react";

/* -----------------------------------------------------------
   PRODUCT SEARCH DRAWER - SAP FIORI COMPACT DESIGN
----------------------------------------------------------- */
export function ProductSearchDrawer({ 
  isOpen, 
  onClose, 
  searchTerm, 
  onSearchChange,
  debouncedTerm,
  filteredProducts,
  currentSearchIndex,
  onSelectProduct,
  searchInputRef,
  latestStockPrices = {}
}) {
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 120);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 transform transition-transform duration-300 translate-x-0 w-full md:w-3/5 lg:w-2/5 bg-white shadow-xl border-l-2 border-[#0A6ED1]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b-2 border-[#0A6ED1] bg-[#F5F9FC]">
          <div>
            <h3 className="text-base font-semibold text-[#32363A]">Search Products</h3>
            <p className="text-xs text-gray-600">
              Select a product for row {currentSearchIndex !== null ? currentSearchIndex + 1 : ''}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, description, code, brand, category, size..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-[#0A6ED1] focus:ring-2 focus:ring-[#0A6ED1]/20"
            />
          </div>
          <div className="mt-1.5 text-xs text-gray-500">
            {debouncedTerm ? `${filteredProducts.length} results found` : "Type to search products"}
          </div>
        </div>

        {/* Products List */}
        <div className="p-3 overflow-auto flex-1 bg-[#FAFBFC]">
          {!debouncedTerm ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              Start typing to search products
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              <div className="text-3xl mb-3">📦</div>
              No products found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id || product.product_code} 
                  product={product}
                  latestGRNData={latestStockPrices[product.product_code]}
                  onSelect={() => onSelectProduct(product)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-600">
              <div>💡 Latest GRN prices loaded automatically</div>
            </div>
            <button 
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, latestGRNData, onSelect }) {
  return (
    <div
      className="border border-gray-300 rounded-lg p-3 hover:shadow-md hover:border-[#0A6ED1] transition cursor-pointer bg-white"
      onClick={onSelect}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <div className="font-semibold text-sm text-[#32363A] leading-tight mb-1">
            {product.product_name}
          </div>
          
          {/* Product Code */}
          <div className="text-xs text-[#0A6ED1] font-medium mb-1">
            {product.product_code}
          </div>
          
          {/* Details */}
          <div className="text-xs text-gray-600 leading-relaxed">
            <span className="font-medium">Brand:</span> {product.brand_name || product.brand || 'N/A'}
            {product.category && <> • <span className="font-medium">Cat:</span> {product.category}</>}
            {product.size && <> • <span className="font-medium">Size:</span> {product.size}</>}
          </div>
          
          {/* GRN History Badge */}
          {latestGRNData && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
              <History className="h-3 w-3 text-blue-600" />
              <span className="text-blue-700 font-medium">{latestGRNData.grn_code}</span>
              <span className="text-blue-500">
                ({new Date(latestGRNData.grn_date).toLocaleDateString()})
              </span>
            </div>
          )}
        </div>

        {/* Prices */}
        <div className="flex-shrink-0 text-right">
          <div className={`text-xs font-medium mb-0.5 ${latestGRNData ? 'text-blue-600' : 'text-gray-700'}`}>
            Stock: {(latestGRNData?.stock_price || product.stock_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-xs font-medium mb-0.5 ${latestGRNData ? 'text-blue-600' : 'text-gray-700'}`}>
            Main: {(latestGRNData?.actual_cost || product.main_branch_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-gray-600">
            Sell: {(product.selling_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          
          <button 
            className="mt-2 px-3 py-1 bg-[#0A6ED1] text-white text-xs rounded hover:bg-[#0858A8] transition-colors flex items-center gap-1"
          >
            Select
            {latestGRNData && <History className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   GRN TABLE HEADER - COMPACT CLASSIC DESIGN
----------------------------------------------------------- */
export function GRNTableHeader() {
  return (
    <thead className="bg-[#F5F9FC] sticky top-0 z-10">
      <tr className="border-b-2 border-[#0A6ED1]">
        <th className="text-[#32363A] font-semibold text-left px-2 py-1.5 text-[11px] border-r border-[#E5E5E5]">
          #
        </th>
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
            <input
              type="text"
              value={item.product_name}
              onChange={(e) => onInlineSearchChange(index, e.target.value)}
              onBlur={() => setTimeout(() => hideInlineSuggestions(index), 200)}
              placeholder="Type product name..."
              className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1]"
            />
            
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
          className="w-full px-1 py-1 text-[11px] text-center border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] min-w-[50px]"
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
          className="w-full px-1 py-1 text-[11px] text-center border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] min-w-[50px]"
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
          className="w-full px-1 py-1 text-[11px] text-center border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] min-w-[50px]"
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
          className="w-full px-1 py-1 text-[11px] text-center border border-gray-300 rounded focus:outline-none focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] min-w-[50px]"
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
          min="1"
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
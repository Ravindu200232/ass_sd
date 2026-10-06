// src/pages/PriceManagement/ProductList.jsx

import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckSquare, Square, Edit2 } from "lucide-react";

export default function ProductList({
  products,
  departments,
  expandedProduct,
  onToggleExpand,
  onToggleSelect,
  onPriceChange,
  onDiscountChange,
  priceAdjustments,
  discountAdjustments,
}) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          departments={departments}
          isExpanded={expandedProduct === product.id}
          onToggleExpand={() => onToggleExpand(product.id)}
          onToggleSelect={() => onToggleSelect(product.id)}
          onPriceChange={(newPrice) => onPriceChange(product.id, newPrice)}
          onDiscountChange={(newDiscount) => onDiscountChange(product.id, newDiscount)}
          adjustedPrice={priceAdjustments[product.id]}
          adjustedDiscount={discountAdjustments[product.id]}
        />
      ))}
    </div>
  );
}

function ProductCard({ 
  product, 
  departments, 
  isExpanded, 
  onToggleExpand, 
  onToggleSelect,
  onPriceChange,
  onDiscountChange,
  adjustedPrice,
  adjustedDiscount,
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [tempPrice, setTempPrice] = useState(product.selling_price);
  const [tempDiscount, setTempDiscount] = useState(adjustedDiscount || product.total_discount);
  
  const department = departments.find(
    (d) => d.id === product.department_id
  );

  const handlePriceSave = () => {
    onPriceChange(tempPrice);
    setEditingPrice(false);
  };

  const handleDiscountSave = () => {
    onDiscountChange(tempDiscount);
    setEditingDiscount(false);
  };

  const handlePriceCancel = () => {
    setTempPrice(product.selling_price);
    setEditingPrice(false);
  };

  const handleDiscountCancel = () => {
    setTempDiscount(adjustedDiscount || product.total_discount);
    setEditingDiscount(false);
  };

  const hasAdjustment = adjustedPrice !== undefined || adjustedDiscount !== undefined;
  const showAdjustedPrice = adjustedPrice !== undefined;
  const currentPrice = showAdjustedPrice ? adjustedPrice : product.selling_price;

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${hasAdjustment ? 'border-yellow-400' : 'border-[#E1E6F0]'} overflow-hidden`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Selection checkbox and product info */}
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={onToggleSelect}
              className="mt-1"
            >
              {product.isSelected ? (
                <CheckSquare className="w-5 h-5 text-[#0A6ED1]" />
              ) : (
                <Square className="w-5 h-5 text-[#C0CADB]" />
              )}
            </button>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#0A294F]">
                {product.product_name}
                {hasAdjustment && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    Edited
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#5A6B7A]">
                <span>{product.product_code}</span>
                {product.brand_name && (
                  <>
                    <span className="text-[#C0CADB]">•</span>
                    <span>{product.brand_name}</span>
                  </>
                )}
                {product.size && (
                  <>
                    <span className="text-[#C0CADB]">•</span>
                    <span>{product.size}</span>
                  </>
                )}
                {product.category && (
                  <>
                    <span className="text-[#C0CADB]">•</span>
                    <span>{product.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            {/* Department info */}
            <div className="text-right">
              <p className="text-[11px] text-[#8A9AB5] uppercase tracking-wide">
                Department
              </p>
              <p className="text-sm font-semibold text-[#0A294F]">
                {department?.department_name || "N/A"}
              </p>
            </div>

            {/* Selling Price with edit */}
            <div className="text-right">
              <p className="text-[11px] text-[#8A9AB5] uppercase tracking-wide mb-1">
                Selling Price
              </p>
              
              {editingPrice ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    className="w-32 px-2 py-1 text-sm border rounded"
                    step="0.01"
                    min="0"
                    autoFocus
                  />
                  <button
                    onClick={handlePriceSave}
                    className="text-green-600 hover:text-green-800"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handlePriceCancel}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="group flex items-center justify-end gap-2">
                  <p className="text-lg font-bold text-[#0A294F]">
                    Rs.{currentPrice.toFixed(2)}
                    {showAdjustedPrice && (
                      <span className="block text-xs text-yellow-600 font-normal">
                        Was: Rs.{product.original_selling_price.toFixed(2)}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => setEditingPrice(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Profit Margin */}
            <div className="text-right">
              <p className="text-[11px] text-[#8A9AB5] uppercase tracking-wide mb-1">
                Profit Margin
              </p>
              <ProfitBadge value={product.profit_margin} />
            </div>

            {/* Expand button */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#E5F0FF] text-[#0A3C7D] text-xs font-medium rounded-full">
                {product.grn_count} GRN
                {product.grn_count !== 1 ? "s" : ""}
              </span>
              <button
                onClick={onToggleExpand}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#8A9AB5]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#8A9AB5]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Discount editing row */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Total Discount:</span>
              
              {editingDiscount ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempDiscount}
                    onChange={(e) => setTempDiscount(e.target.value)}
                    className="w-24 px-2 py-1 text-sm border rounded"
                    step="0.01"
                    min="0"
                    max="100"
                    autoFocus
                  />
                  <span className="text-sm">%</span>
                  <button
                    onClick={handleDiscountSave}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleDiscountCancel}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span className="text-lg font-bold text-gray-800">
                    {(adjustedDiscount !== undefined ? adjustedDiscount : product.total_discount).toFixed(2)}%
                  </span>
                  <button
                    onClick={() => setEditingDiscount(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {hasAdjustment && (
              <button
                onClick={() => {
                  onPriceChange(product.original_selling_price);
                  onDiscountChange(product.total_discount);
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Reset to Original
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded GRN table */}
      {isExpanded && (
        <div className="border-t border-[#E1E6F0] bg-[#FBFCFF]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F3F6FC]">
                <tr>
                  <HeaderCell>GRN Code</HeaderCell>
                  <HeaderCell>Date</HeaderCell>
                  <HeaderCell>Department</HeaderCell>
                  <HeaderCell align="right">Stock Price</HeaderCell>
                  <HeaderCell align="center">Discounts</HeaderCell>
                  <HeaderCell align="right">Actual Cost</HeaderCell>
                  <HeaderCell align="right">Selling Price</HeaderCell>
                  <HeaderCell align="right">Quantity</HeaderCell>
                  <HeaderCell align="center">Profit %</HeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E6F0]">
                {product.all_grns.map((grn, idx) => {
                  const dept = departments.find(
                    (d) => d.id === grn.department_id
                  );
                  if (!grn.item) return null;

                  const rawProfit =
                    grn.item.selling_price > 0
                      ? ((grn.item.selling_price - grn.item.actual_cost) /
                          grn.item.selling_price) *
                        100
                      : 0;
                  const profitLabel = rawProfit.toFixed(2);

                  return (
                    <tr
                      key={idx}
                      className={
                        idx === 0
                          ? "bg-[#E8F1FF]"
                          : "bg-white hover:bg-[#F7FAFF]"
                      }
                    >
                      <BodyCell>
                        <span className="font-semibold text-[#0A294F]">
                          {grn.grn_code}
                        </span>
                        {idx === 0 && (
                          <span className="ml-2 text-[10px] bg-[#0A6ED1] text-white px-2 py-0.5 rounded-full">
                            Latest
                          </span>
                        )}
                      </BodyCell>
                      <BodyCell>
                        {new Date(grn.grn_date).toLocaleDateString()}
                      </BodyCell>
                      <BodyCell>{dept?.department_name || "N/A"}</BodyCell>
                      <BodyCell align="right">
                        Rs.{grn.item.stock_price.toFixed(2)}
                      </BodyCell>
                      <BodyCell align="center">
                        <div className="flex justify-center gap-1 flex-wrap">
                          {grn.item.discount1 > 0 && (
                            <DiscountChip value={grn.item.discount1} />
                          )}
                          {grn.item.discount2 > 0 && (
                            <DiscountChip value={grn.item.discount2} />
                          )}
                          {grn.item.discount3 > 0 && (
                            <DiscountChip value={grn.item.discount3} />
                          )}
                          {grn.item.discount4 > 0 && (
                            <DiscountChip value={grn.item.discount4} />
                          )}
                        </div>
                      </BodyCell>
                      <BodyCell align="right" className="font-medium">
                        Rs.{grn.item.actual_cost.toFixed(2)}
                      </BodyCell>
                      <BodyCell align="right" className="font-bold">
                        Rs.{grn.item.selling_price.toFixed(2)}
                      </BodyCell>
                      <BodyCell align="right">
                        {grn.item.qty}
                      </BodyCell>
                      <BodyCell align="center">
                        <ProfitBadge value={rawProfit} label={profitLabel} />
                      </BodyCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

function HeaderCell({ children, align = "left" }) {
  return (
    <th
      className={`
        px-4 py-2 text-[11px] font-semibold text-[#8A9AB5] uppercase 
        ${align === "right" ? "text-right" : ""}
        ${align === "center" ? "text-center" : ""}
      `}
    >
      {children}
    </th>
  );
}

function BodyCell({ children, align = "left", className = "" }) {
  return (
    <td
      className={`
        px-4 py-3 text-sm text-[#1F2933]
        ${align === "right" ? "text-right" : ""}
        ${align === "center" ? "text-center" : ""}
        ${className}
      `}
    >
      {children}
    </td>
  );
}

function DiscountChip({ value }) {
  return (
    <span className="px-2 py-0.5 bg-[#E5F0FF] text-[#0A3C7D] text-[11px] rounded-full">
      {value}%
    </span>
  );
}

function ProfitBadge({ value, label }) {
  const numeric = typeof value === "number" ? value : parseFloat(value || 0);
  const badgeLabel =
    label !== undefined ? label : numeric.toFixed(2);

  let classes =
    "bg-red-100 text-red-800 border border-red-200";

  if (numeric >= 30) {
    classes = "bg-green-100 text-green-800 border border-green-200";
  } else if (numeric >= 15) {
    classes = "bg-yellow-100 text-yellow-800 border border-yellow-200";
  } else if (numeric >= 0) {
    classes = "bg-orange-100 text-orange-800 border border-orange-200";
  }

  return (
    <span
      className={`
        inline-block px-3 py-1 text-xs font-semibold 
        rounded-full ${classes}
      `}
    >
      {badgeLabel}%
    </span>
  );
}
// StockTableHeader.jsx - Updated to include department column
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const StockTableHeader = ({ sortConfig, onSort }) => {
  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3" /> 
      : <ArrowDown className="h-3 w-3" />;
  };

  return (
    <tr>
      <th 
        className="px-3 py-2 cursor-pointer hover:bg-gray-200"
        onClick={() => onSort('product_code')}
      >
        <div className="flex items-center justify-between">
          Code
          <SortIcon column="product_code" />
        </div>
      </th>
      <th 
        className="px-3 py-2 cursor-pointer hover:bg-gray-200"
        onClick={() => onSort('product_name')}
      >
        <div className="flex items-center justify-between">
          Product
          <SortIcon column="product_name" />
        </div>
      </th>
      <th 
        className="px-3 py-2 cursor-pointer hover:bg-gray-200"
        onClick={() => onSort('brand_name')}
      >
        <div className="flex items-center justify-between">
          Brand
          <SortIcon column="brand_name" />
        </div>
      </th>
      <th 
        className="px-3 py-2 cursor-pointer hover:bg-gray-200"
        onClick={() => onSort('department_name')}
      >
        <div className="flex items-center justify-between">
          Department
          <SortIcon column="department_name" />
        </div>
      </th>
      <th 
        className="px-3 py-2 cursor-pointer hover:bg-gray-200"
        onClick={() => onSort('min_price')}
      >
        <div className="flex items-center justify-between">
          Min Selling
          <SortIcon column="min_price" />
        </div>
      </th>
      <th 
        className="px-3 py-2 cursor-pointer hover:bg-gray-200"
        onClick={() => onSort('avg_price')}
      >
        <div className="flex items-center justify-between">
          Avg Selling
          <SortIcon column="avg_price" />
        </div>
      </th>
      <th 
        className="px-3 py-2 cursor-pointer hover:bg-gray-200 text-right"
        onClick={() => onSort('total_qty')}
      >
        <div className="flex items-center justify-end gap-1">
          Qty
          <SortIcon column="total_qty" />
        </div>
      </th>
    </tr>
  );
};
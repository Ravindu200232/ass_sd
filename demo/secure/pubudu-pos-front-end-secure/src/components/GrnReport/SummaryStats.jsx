import React from 'react';

export function SummaryStats({ items }) {
  const totalQuantity = items.reduce((sum, item) => sum + (item.qty || 0), 0);
  const avgStockPrice = items.length > 0 
    ? (items.reduce((sum, item) => sum + (item.stock_price || 0), 0) / items.length).toFixed(2)
    : '0.00';
  const avgSellingPrice = items.length > 0
    ? (items.reduce((sum, item) => sum + (item.selling_price || 0), 0) / items.length).toFixed(2)
    : '0.00';

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold uppercase mb-3 border-b border-gray-400 pb-1">
        SUMMARY STATISTICS
      </h3>
      <table className="w-full border-collapse border border-gray-400">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold">Total Quantity Received</td>
            <td className="border border-gray-400 p-3 text-right">
              {totalQuantity} units
            </td>
            <td className="border border-gray-400 p-3 font-semibold">Average Stock Price</td>
            <td className="border border-gray-400 p-3 text-right">
              LKR {avgStockPrice}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold">Average Selling Price</td>
            <td className="border border-gray-400 p-3 text-right">
              LKR {avgSellingPrice}
            </td>
            <td className="border border-gray-400 p-3 font-semibold">Items Count</td>
            <td className="border border-gray-400 p-3 text-right">{items.length} items</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
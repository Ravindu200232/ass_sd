import React from "react";

export const GRNItemsTable = ({ items }) => {
  // Calculate individual item discount totals
  const calculateItemDiscount = (item) => {
    const stockPrice = item.stock_price || 0;
    const d1Amount = (stockPrice * (item.discount1 || 0)) / 100;
    const d2Amount = (stockPrice * (item.discount2 || 0)) / 100;
    const d3Amount = (stockPrice * (item.discount3 || 0)) / 100;
    const d4Amount = (stockPrice * (item.discount4 || 0)) / 100;
    
    const totalDiscountAmount = d1Amount + d2Amount + d3Amount + d4Amount;
    const totalDiscountPercentage = (item.discount1 || 0) + (item.discount2 || 0) + 
                                    (item.discount3 || 0) + (item.discount4 || 0);
    
    return {
      d1: { percent: item.discount1 || 0, amount: d1Amount },
      d2: { percent: item.discount2 || 0, amount: d2Amount },
      d3: { percent: item.discount3 || 0, amount: d3Amount },
      d4: { percent: item.discount4 || 0, amount: d4Amount },
      totalAmount: totalDiscountAmount,
      totalPercent: totalDiscountPercentage
    };
  };

  // Calculate totals for footer
  const totals = {
    stock: items.reduce((sum, item) => sum + (item.stock_price || 0), 0),
    mainBranch: items.reduce((sum, item) => sum + (item.main_branch_price || 0), 0),
    actual: items.reduce((sum, item) => sum + (item.actual_cost || 0), 0),
    selling: items.reduce((sum, item) => sum + (item.selling_price || 0), 0),
    quantity: items.reduce((sum, item) => sum + (item.qty || 0), 0),
    subtotal: items.reduce((sum, item) => sum + (item.subtotal || 0), 0),
    discount: {
      d1Percent: items.reduce((sum, item) => sum + (item.discount1 || 0), 0),
      d2Percent: items.reduce((sum, item) => sum + (item.discount2 || 0), 0),
      d3Percent: items.reduce((sum, item) => sum + (item.discount3 || 0), 0),
      d4Percent: items.reduce((sum, item) => sum + (item.discount4 || 0), 0),
      totalAmount: items.reduce((sum, item) => {
        const stockPrice = item.stock_price || 0;
        return sum + (
          (stockPrice * (item.discount1 || 0) / 100) +
          (stockPrice * (item.discount2 || 0) / 100) +
          (stockPrice * (item.discount3 || 0) / 100) +
          (stockPrice * (item.discount4 || 0) / 100)
        );
      }, 0)
    }
  };

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">Item Details</h3>
        <p className="text-sm text-gray-600">Complete pricing breakdown for all items</p>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          {/* HEADER */}
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                Product Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                Product Name
              </th>
              
              {/* STOCK PRICE */}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-gray-50">
                Stock Price
              </th>
              
              {/* DISCOUNTS - SEPARATE COLUMNS */}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-red-50">
                D1%
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-red-100">
                D2%
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-red-150">
                D3%
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-red-200">
                D4%
              </th>
              
              {/* TOTAL DISCOUNT */}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-red-300">
                Total Discount
              </th>
              
              {/* MAIN BRANCH PRICE */}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-blue-50">
                Main Branch
              </th>
              
              {/* ACTUAL COST */}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-green-50">
                Actual Cost
              </th>
              
              {/* SELLING PRICE */}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 bg-purple-50">
                Selling Price
              </th>
              
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                Qty
              </th>
              
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider bg-indigo-50">
                Subtotal
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="bg-white divide-y divide-gray-100">
            {items?.map((item, index) => {
              const discount = calculateItemDiscount(item);
              
              return (
                <tr 
                  key={item.id} 
                  className="hover:bg-blue-50/50 transition-colors duration-150"
                >
                  {/* INDEX */}
                  <td className="px-4 py-3 text-sm text-center text-gray-500 border-r border-gray-100">
                    {index + 1}
                  </td>

                  {/* CODE */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-100">
                    <div className="font-mono">{item.product_code}</div>
                  </td>

                  {/* NAME */}
                  <td className="px-4 py-3 text-sm text-gray-800 border-r border-gray-100">
                    {item.product_name}
                  </td>

                  {/* STOCK PRICE */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">
                        LKR {Number(item.stock_price || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">Original</span>
                    </div>
                  </td>

                  {/* D1 DISCOUNT */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-red-50/50">
                    {discount.d1.percent > 0 ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-red-700">
                          {discount.d1.percent}%
                        </span>
                        <span className="text-xs text-red-600">
                          -LKR {discount.d1.amount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* D2 DISCOUNT */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-red-100/50">
                    {discount.d2.percent > 0 ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-red-700">
                          {discount.d2.percent}%
                        </span>
                        <span className="text-xs text-red-600">
                          -LKR {discount.d2.amount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* D3 DISCOUNT */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-red-150/50">
                    {discount.d3.percent > 0 ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-red-700">
                          {discount.d3.percent}%
                        </span>
                        <span className="text-xs text-red-600">
                          -LKR {discount.d3.amount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* D4 DISCOUNT */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-red-200/50">
                    {discount.d4.percent > 0 ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-red-700">
                          {discount.d4.percent}%
                        </span>
                        <span className="text-xs text-red-600">
                          -LKR {discount.d4.amount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>

                  {/* TOTAL DISCOUNT */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-red-300/50">
                    {discount.totalPercent > 0 ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-red-800">
                          {discount.totalPercent.toFixed(1)}%
                        </span>
                        <span className="text-xs font-semibold text-red-700">
                          -LKR {discount.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No Discount</span>
                    )}
                  </td>

                  {/* MAIN BRANCH PRICE */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-blue-50/50">
                    <div className="flex flex-col">
                      <span className="font-semibold text-blue-700">
                        LKR {Number(item.main_branch_price || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-blue-600">
                        {item.stock_price > 0 ? 
                          `${((item.main_branch_price / item.stock_price * 100) - 100).toFixed(2)}%` : 
                          '—'}
                      </span>
                    </div>
                  </td>

                  {/* ACTUAL COST */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-green-50/50">
                    <div className="flex flex-col">
                      <span className="font-bold text-green-700">
                        LKR {Number(item.actual_cost || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-green-600">
                        {item.stock_price > 0 ? 
                          `${(((item.stock_price - item.actual_cost) / item.stock_price) * 100).toFixed(2)}% Save` : 
                          '—'}
                      </span>
                    </div>
                  </td>

                  {/* SELLING PRICE */}
                  <td className="px-4 py-3 text-right border-r border-gray-100 bg-purple-50/50">
                    <div className="flex flex-col">
                      <span className="font-bold text-purple-700">
                        LKR {Number(item.selling_price || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-purple-600">
                        {item.actual_cost > 0 ? 
                          `${(((item.selling_price - item.actual_cost) / item.actual_cost) * 100).toFixed(2)}% Markup` : 
                          '—'}
                      </span>
                    </div>
                  </td>

                  {/* QUANTITY */}
                  <td className="px-4 py-3 text-right border-r border-gray-100">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{item.qty}</span>
                      <span className="text-xs text-gray-500">Units</span>
                    </div>
                  </td>

                  {/* SUBTOTAL */}
                  <td className="px-4 py-3 text-right bg-indigo-50/50">
                    <div className="flex flex-col">
                      <span className="font-bold text-indigo-700">
                        LKR {Number(item.subtotal || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-indigo-600">
                        {item.qty} × LKR {Number(item.actual_cost || 0).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          
          {/* FOOTER - TOTALS */}
          {items && items.length > 0 && (
            <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
              <tr className="font-bold text-gray-800">
                <td colSpan={3} className="px-4 py-4 text-right border-r border-gray-300">
                  <span className="text-gray-700">Grand Totals:</span>
                </td>
                
                {/* STOCK PRICE TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-gray-100">
                  <div className="flex flex-col">
                    <span>LKR {totals.stock.toLocaleString()}</span>
                  </div>
                </td>
                
                {/* D1 TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-red-50">
                  <div className="flex flex-col">
                    <span className="text-red-700">
                      {totals.discount.d1Percent.toFixed(1)}%
                    </span>
                  </div>
                </td>
                
                {/* D2 TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-red-100">
                  <div className="flex flex-col">
                    <span className="text-red-700">
                      {totals.discount.d2Percent.toFixed(1)}%
                    </span>
                  </div>
                </td>
                
                {/* D3 TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-red-150">
                  <div className="flex flex-col">
                    <span className="text-red-700">
                      {totals.discount.d3Percent.toFixed(1)}%
                    </span>
                  </div>
                </td>
                
                {/* D4 TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-red-200">
                  <div className="flex flex-col">
                    <span className="text-red-700">
                      {totals.discount.d4Percent.toFixed(1)}%
                    </span>
                  </div>
                </td>
                
                {/* TOTAL DISCOUNT AMOUNT */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-red-300">
                  <div className="flex flex-col">
                    <span className="text-red-800">
                      -LKR {totals.discount.totalAmount.toLocaleString()}
                    </span>
                    <span className="text-xs text-red-700 font-normal">
                      Total Savings
                    </span>
                  </div>
                </td>
                
                {/* MAIN BRANCH TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-blue-100">
                  <div className="flex flex-col">
                    <span className="text-blue-700">
                      LKR {totals.mainBranch.toLocaleString()}
                    </span>
                  </div>
                </td>
                
                {/* ACTUAL COST TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-green-100">
                  <div className="flex flex-col">
                    <span className="text-green-700">
                      LKR {totals.actual.toLocaleString()}
                    </span>
                  </div>
                </td>
                
                {/* SELLING PRICE TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300 bg-purple-100">
                  <div className="flex flex-col">
                    <span className="text-purple-700">
                      LKR {totals.selling.toLocaleString()}
                    </span>
                  </div>
                </td>
                
                {/* QUANTITY TOTAL */}
                <td className="px-4 py-4 text-right border-r border-gray-300">
                  <div className="flex flex-col">
                    <span>{totals.quantity}</span>
                    <span className="text-xs text-gray-600 font-normal">Units</span>
                  </div>
                </td>
                
                {/* SUBTOTAL TOTAL */}
                <td className="px-4 py-4 text-right bg-indigo-100">
                  <div className="flex flex-col">
                    <span className="text-indigo-700">
                      LKR {totals.subtotal.toLocaleString()}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
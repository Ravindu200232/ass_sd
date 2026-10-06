import React from "react";

export const GRNDetailsHeader = ({ grn }) => {
  const items = grn.items || [];
  
  // Calculate detailed discount breakdown
  const discountBreakdown = items.reduce((acc, item) => {
    const stockPrice = item.stock_price || 0;
    
    return {
      d1Percent: acc.d1Percent + (item.discount1 || 0),
      d2Percent: acc.d2Percent + (item.discount2 || 0),
      d3Percent: acc.d3Percent + (item.discount3 || 0),
      d4Percent: acc.d4Percent + (item.discount4 || 0),
      d1Amount: acc.d1Amount + (stockPrice * (item.discount1 || 0) / 100),
      d2Amount: acc.d2Amount + (stockPrice * (item.discount2 || 0) / 100),
      d3Amount: acc.d3Amount + (stockPrice * (item.discount3 || 0) / 100),
      d4Amount: acc.d4Amount + (stockPrice * (item.discount4 || 0) / 100),
      totalPercent: acc.totalPercent + (
        (item.discount1 || 0) + 
        (item.discount2 || 0) + 
        (item.discount3 || 0) + 
        (item.discount4 || 0)
      ),
      totalAmount: acc.totalAmount + (
        (stockPrice * (item.discount1 || 0) / 100) +
        (stockPrice * (item.discount2 || 0) / 100) +
        (stockPrice * (item.discount3 || 0) / 100) +
        (stockPrice * (item.discount4 || 0) / 100)
      )
    };
  }, {
    d1Percent: 0, d2Percent: 0, d3Percent: 0, d4Percent: 0,
    d1Amount: 0, d2Amount: 0, d3Amount: 0, d4Amount: 0,
    totalPercent: 0, totalAmount: 0
  });

  const totalStockValue = items.reduce((sum, item) => sum + (item.stock_price || 0), 0);
  const totalMainBranchValue = items.reduce((sum, item) => sum + (item.main_branch_price || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* BASIC INFO CARD */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-100 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-blue-100">GRN Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">GRN Code</p>
              <p className="font-bold text-gray-900 text-lg">{grn.grn_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Date</p>
              <p className="font-medium text-gray-800">
                {new Date(grn.grn_date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Department</p>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="font-semibold text-blue-800">{grn.department?.department_name}</p>
              <p className="text-sm text-blue-600 mt-1">Code: {grn.department?.department_code}</p>
              {grn.department?.department_address && (
                <p className="text-xs text-blue-500 mt-1">{grn.department.department_address}</p>
              )}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Prepared By</p>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-gray-800">{grn.created_by?.full_name}</p>
              <p className="text-sm text-gray-600 mt-1">User Code: {grn.created_by?.user_code}</p>
              {grn.created_by?.nic_no && (
                <p className="text-xs text-gray-500 mt-1">NIC: {grn.created_by.nic_no}</p>
              )}
            </div>
          </div>
          
          <div className="pt-2 border-t border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Items</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full">
                {grn.total_item}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DISCOUNT BREAKDOWN CARD */}
      <div className="bg-gradient-to-br from-white to-red-50 rounded-xl border border-red-100 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-red-100">Discount Breakdown</h3>
        <div className="space-y-4">
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-600 mb-1">Stock Value</p>
            <p className="text-xl font-bold text-gray-900">
              LKR {totalStockValue.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-3">
            {/* D1 DISCOUNT */}
            {discountBreakdown.d1Amount > 0 && (
              <div className="flex justify-between items-center bg-red-50/70 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Discount 1</p>
                    <p className="text-xs text-gray-500">Primary discount</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-700">{discountBreakdown.d1Percent.toFixed(1)}%</p>
                  <p className="text-sm text-red-600">-LKR {discountBreakdown.d1Amount.toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {/* D2 DISCOUNT */}
            {discountBreakdown.d2Amount > 0 && (
              <div className="flex justify-between items-center bg-red-50/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Discount 2</p>
                    <p className="text-xs text-gray-500">Secondary discount</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-700">{discountBreakdown.d2Percent.toFixed(1)}%</p>
                  <p className="text-sm text-red-600">-LKR {discountBreakdown.d2Amount.toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {/* D3 DISCOUNT */}
            {discountBreakdown.d3Amount > 0 && (
              <div className="flex justify-between items-center bg-red-50/30 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Discount 3</p>
                    <p className="text-xs text-gray-500">Additional discount</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-700">{discountBreakdown.d3Percent.toFixed(1)}%</p>
                  <p className="text-sm text-red-600">-LKR {discountBreakdown.d3Amount.toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {/* D4 DISCOUNT */}
            {discountBreakdown.d4Amount > 0 && (
              <div className="flex justify-between items-center bg-red-50/10 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-700"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Discount 4</p>
                    <p className="text-xs text-gray-500">Special discount</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-700">{discountBreakdown.d4Percent.toFixed(1)}%</p>
                  <p className="text-sm text-red-600">-LKR {discountBreakdown.d4Amount.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
          
          {discountBreakdown.totalAmount > 0 && (
            <div className="pt-4 mt-4 border-t border-red-100">
              <div className="flex justify-between items-center bg-red-100 rounded-lg p-4">
                <div>
                  <p className="font-bold text-gray-800">Total Discount</p>
                  <p className="text-sm text-gray-600">
                    {totalStockValue > 0 ? 
                      `${((discountBreakdown.totalAmount / totalStockValue) * 100).toFixed(2)}% off total` : 
                      ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-800">
                    -LKR {discountBreakdown.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRICING SUMMARY CARD */}
      <div className="bg-gradient-to-br from-white to-green-50 rounded-xl border border-green-100 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-green-100">Pricing Summary</h3>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-green-50/70 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Actual Cost</p>
                <p className="text-xs text-gray-500">After all discounts</p>
              </div>
              <p className="text-xl font-bold text-green-700">
                LKR {grn.total_cost?.toLocaleString()}
              </p>
            </div>
            
            <div className="flex justify-between items-center bg-blue-50/70 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Selling Value</p>
                <p className="text-xs text-gray-500">Customer price</p>
              </div>
              <p className="text-xl font-bold text-blue-700">
                LKR {grn.total_selling_amount?.toLocaleString()}
              </p>
            </div>
            
            <div className="flex justify-between items-center bg-yellow-50/70 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Main Branch Value</p>
                <p className="text-xs text-gray-500">Internal transfer</p>
              </div>
              <p className="text-xl font-bold text-yellow-700">
                LKR {totalMainBranchValue.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-green-100 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-800">Total Profit</span>
                <span className="text-2xl font-bold text-green-700">
                  LKR {grn.total_profit?.toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">Profit Margin</p>
                  <p className="font-bold text-green-600">
                    {grn.total_cost > 0 ? 
                      ((grn.total_profit / grn.total_cost) * 100).toFixed(2) : 0}%
                  </p>
                </div>
                
                <div className="bg-white rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">Branch Margin</p>
                  <p className="font-bold text-yellow-600">
                    {grn.total_cost > 0 ? 
                      ((totalMainBranchValue - grn.total_cost) / grn.total_cost * 100).toFixed(2) : 0}%
                  </p>
                </div>
                
                <div className="bg-white rounded p-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Customer Margin</p>
                  <p className="font-bold text-blue-600">
                    {grn.total_cost > 0 ? 
                      ((grn.total_selling_amount - grn.total_cost) / grn.total_cost * 100).toFixed(2) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
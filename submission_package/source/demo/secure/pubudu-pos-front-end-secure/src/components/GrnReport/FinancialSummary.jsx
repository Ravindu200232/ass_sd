import React from 'react';

export function FinancialSummary({ data }) {
  const profitMargin = data.total_cost > 0 
    ? ((data.total_profit / data.total_cost) * 100).toFixed(2) 
    : '0.00';

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold uppercase mb-3 border-b border-gray-400 pb-1">
        FINANCIAL SUMMARY
      </h3>
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 p-3 text-left font-semibold">Description</th>
            <th className="border border-gray-400 p-3 text-right font-semibold">Amount (LKR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 font-medium">Total Cost Value</td>
            <td className="border border-gray-400 p-3 text-right">{data.total_cost?.toLocaleString()}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-medium">Total Selling Value</td>
            <td className="border border-gray-400 p-3 text-right">{data.total_selling_amount?.toLocaleString()}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="border border-gray-400 p-3 font-bold">Gross Profit</td>
            <td className="border border-gray-400 p-3 text-right font-bold">{data.total_profit?.toLocaleString()}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-medium">Profit Margin</td>
            <td className="border border-gray-400 p-3 text-right">
              {profitMargin}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
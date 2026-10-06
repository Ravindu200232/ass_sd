import React from 'react';

export function ItemsTable({ items }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold uppercase mb-3 border-b border-gray-400 pb-1">
        ITEM DETAILS
      </h3>
      <table className="w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 p-2 text-center font-semibold">#</th>
            <th className="border border-gray-400 p-2 text-left font-semibold">Product Code</th>
            <th className="border border-gray-400 p-2 text-left font-semibold">Product Name</th>
            <th className="border border-gray-400 p-2 text-right font-semibold">Stock Price</th>
            <th className="border border-gray-400 p-2 text-right font-semibold">Selling Price</th>
            <th className="border border-gray-400 p-2 text-right font-semibold">Discount</th>
            <th className="border border-gray-400 p-2 text-right font-semibold">Quantity</th>
            <th className="border border-gray-400 p-2 text-right font-semibold">Subtotal</th>
            <th className="border border-gray-400 p-2 text-center font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <TableRow key={item.id} item={item} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ item, index }) {
  return (
    <tr>
      <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
      <td className="border border-gray-400 p-2 font-medium">{item.product_code}</td>
      <td className="border border-gray-400 p-2">{item.product_name}</td>
      <td className="border border-gray-400 p-2 text-right">{item.stock_price?.toLocaleString()}</td>
      <td className="border border-gray-400 p-2 text-right">{item.selling_price?.toLocaleString()}</td>
      <td className="border border-gray-400 p-2 text-right font-black text-lg">{item.discount_price?.toLocaleString()}</td>
      <td className="border border-gray-400 p-2 text-right">{item.qty}</td>
      <td className="border border-gray-400 p-2 text-right font-medium">
        {item.subtotal?.toLocaleString()}
      </td>
      <td className="border border-gray-400 p-2 text-center">
        <span className={`px-2 py-1 text-xs ${
          item.status === 'on' ? 'bg-gray-200' : 'bg-gray-100'
        }`}>
          {item.status?.toUpperCase() || 'ON'}
        </span>
      </td>
    </tr>
  );
}
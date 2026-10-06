import React from 'react';

export const StockPagination = ({ pageSize, onPageSizeChange }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Rows per page</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="border rounded px-2 py-1 text-sm"
      >
        {[10, 20, 50, 100].map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
};
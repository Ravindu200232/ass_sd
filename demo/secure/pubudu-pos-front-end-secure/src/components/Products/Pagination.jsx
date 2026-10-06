import React from 'react';
import { Button } from '@/components/ui/button';

export function PaginationControls({
  pageIndex,
  pageSize,
  totalItems,
  onPageSizeChange,
  onFirstPage,
  onPrevPage,
  onNextPage,
  onLastPage,
  pageCount
}) {
  const startIndex = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  const endIndex = Math.min(totalItems, (pageIndex + 1) * pageSize);

  return (
    <div
      className="
        flex flex-col sm:flex-row
        items-center justify-between
        gap-3 sm:gap-0
        px-4 py-3 border-t
        bg-white/80 backdrop-blur-sm
        shadow-inner rounded-b-lg
      "
    >
      {/* LEFT — Showing X to Y of Z */}
      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of{" "}
        <strong>{totalItems}</strong> products
      </div>

      {/* RIGHT — Controls */}
      <div
        className="
          flex flex-col sm:flex-row
          items-center sm:items-center
          gap-3
        "
      >
        {/* Rows Per Page */}
        <div className="flex items-center gap-2">
          <div className="text-xs sm:text-sm text-muted-foreground">Rows</div>

          <select
            className="
              border rounded-md px-2 py-1
              text-xs sm:text-sm
              bg-white
            "
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Pagination Buttons */}
        <div
          className="
            flex items-center gap-2
            sm:ml-4
          "
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onFirstPage}
            disabled={pageIndex === 0}
            className="
              rounded-md border-indigo-300 text-indigo-700
              hover:bg-indigo-100
              text-xs sm:text-sm
            "
          >
            First
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={pageIndex === 0}
            className="
              rounded-md border-indigo-300 text-indigo-700
              hover:bg-indigo-100
              text-xs sm:text-sm
            "
          >
            Prev
          </Button>

          <div className="px-2 sm:px-3 text-xs sm:text-sm font-medium">
            {pageIndex + 1} / {pageCount}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={pageIndex >= pageCount - 1}
            className="
              rounded-md border-indigo-300 text-indigo-700
              hover:bg-indigo-100
              text-xs sm:text-sm
            "
          >
            Next
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onLastPage}
            disabled={pageIndex >= pageCount - 1}
            className="
              rounded-md border-indigo-300 text-indigo-700
              hover:bg-indigo-100
              text-xs sm:text-sm
            "
          >
            Last
          </Button>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Edit, Trash2 } from "lucide-react";

/* -----------------------------------------------------------
   SAP FIORI QUARTZ THEMED PRODUCTS TABLE - AUTO SCALE
----------------------------------------------------------- */
export function ProductsTable({ products, sortBy, onSort, onEdit, onDelete }) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-sm overflow-hidden w-full h-full max-w-full max-h-full">
      <div className="overflow-auto h-full w-full">
        <table className="w-full text-xs md:text-sm border-collapse min-w-[600px]">
          <thead className="bg-blue-50 sticky top-0 z-10">
            <tr className="border-b-2 border-blue-600">
              <SortableHeader column="product_code" label="Code" sortBy={sortBy} onSort={onSort} />
              <SortableHeader column="product_name" label="Product" sortBy={sortBy} onSort={onSort} />
              <SortableHeader column="brand_name" label="Brand" sortBy={sortBy} onSort={onSort} />
              <SortableHeader column="category" label="Category" sortBy={sortBy} onSort={onSort} />
              <th className="text-gray-800 font-semibold text-center px-1 md:px-2 py-1.5 md:py-2">Groups</th>
              <SortableHeader column="size" label="Size" sortBy={sortBy} onSort={onSort} />
              <SortableHeader column="type" label="Type" sortBy={sortBy} onSort={onSort} />
              <th className="text-gray-800 font-semibold text-center w-[70px] md:w-[90px] px-1 md:px-2 py-1.5 md:py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <ProductRow key={product.id} product={product} onEdit={onEdit} onDelete={onDelete} />
              ))
            ) : (
              <EmptyTableRow />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   SORTABLE HEADER (SAP BLUE STYLE) - RESPONSIVE
----------------------------------------------------------- */
function SortableHeader({ column, label, sortBy, onSort }) {
  const SortIcon = () => {
    if (sortBy.column !== column) return <span className="text-gray-500 ml-0.5 md:ml-1 text-[10px] md:text-xs">↕</span>;
    return sortBy.direction === "asc" ? (
      <span className="text-blue-600 ml-0.5 md:ml-1 text-[10px] md:text-xs">▲</span>
    ) : (
      <span className="text-blue-600 ml-0.5 md:ml-1 text-[10px] md:text-xs">▼</span>
    );
  };

  return (
    <th
      onClick={() => onSort(column)}
      className="cursor-pointer select-none transition-all hover:text-blue-600 font-semibold px-1 md:px-2 py-1.5 md:py-2 text-left"
    >
      <div className="flex items-center whitespace-nowrap text-[10px] md:text-xs">
        {label}
        <SortIcon />
      </div>
    </th>
  );
}

/* -----------------------------------------------------------
   SAP FIORI PRODUCT ROW - RESPONSIVE
----------------------------------------------------------- */
function ProductRow({ product, onEdit, onDelete }) {
  return (
    <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
      <td className="font-medium text-blue-600 px-1 md:px-2 py-1.5 md:py-2 text-[10px] md:text-xs">
        {product.product_code}
      </td>
      
      <td className="px-1 md:px-2 py-1.5 md:py-2">
        <div className="font-medium text-gray-800 text-[10px] md:text-xs leading-tight max-w-[100px] md:max-w-[140px]" title={product.product_name}>
          {product.product_name}
        </div>
      </td>

      {/* BRAND */}
      <td className="px-1 md:px-2 py-1.5 md:py-2">
        {product.brand_name ? (
          <span className="inline-block bg-blue-100 text-blue-700 border border-blue-300 text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded whitespace-nowrap">
            {product.brand_name}
          </span>
        ) : (
          <span className="text-gray-500 text-[10px] md:text-xs">—</span>
        )}
      </td>

      {/* CATEGORY */}
      <td className="px-1 md:px-2 py-1.5 md:py-2 truncate max-w-[60px] md:max-w-[100px] text-[10px] md:text-xs" title={product.category}>
        {product.category || "—"}
      </td>

      {/* GROUPS */}
      <td className="px-1 md:px-2 py-1.5 md:py-2">
        <div className="flex flex-wrap gap-0.5 md:gap-1 max-w-[80px] md:max-w-[120px]">
          {product.group &&
            product.group.split(",").map((group, idx) => (
              <span
                key={idx}
                className="inline-block bg-gray-200 text-gray-800 text-[7px] md:text-[9px] px-0.5 md:px-1 py-0.5 rounded whitespace-nowrap"
              >
                {group.trim()}
              </span>
            ))}
        </div>
      </td>

      <td className="px-1 md:px-2 py-1.5 md:py-2 text-[10px] md:text-xs">{product.size || "—"}</td>

      {/* TYPE */}
      <td className="px-1 md:px-2 py-1.5 md:py-2">
        {product.type ? (
          <span className="inline-block bg-amber-100 text-amber-700 border border-amber-300 text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded whitespace-nowrap">
            {product.type}
          </span>
        ) : (
          <span className="text-gray-500 text-[10px] md:text-xs">—</span>
        )}
      </td>

      {/* ACTIONS */}
      <td className="px-1 md:px-2 py-1.5 md:py-2">
        <div className="flex items-center justify-center gap-0.5 md:gap-1">
          <button
            onClick={() => onEdit(product)}
            className="border border-blue-300 text-blue-600 hover:bg-blue-100 hover:border-blue-600 rounded h-6 w-6 md:h-7 md:w-7 flex items-center justify-center transition-colors"
            aria-label="Edit"
          >
            <Edit className="h-2.5 w-2.5 md:h-3 md:w-3" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-600 rounded h-6 w-6 md:h-7 md:w-7 flex items-center justify-center transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="h-2.5 w-2.5 md:h-3 md:w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* -----------------------------------------------------------
   EMPTY TABLE STATE (SAP STYLE)
----------------------------------------------------------- */
export function EmptyTableRow() {
  return (
    <tr>
      <td colSpan={8} className="h-[200px] md:h-[400px] text-center">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <div className="text-2xl md:text-4xl mb-2 md:mb-4">📦</div>
          <p className="text-xs md:text-sm font-medium">No products match your filters.</p>
        </div>
      </td>
    </tr>
  );
}
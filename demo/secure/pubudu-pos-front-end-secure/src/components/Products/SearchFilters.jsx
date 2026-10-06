/* =========================================================
   components/Products/SearchFilters.jsx
========================================================= */
import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function SearchFilters({
  searchTerm,
  onSearchChange,
  filterBrand,
  onBrandChange,
  filterCategory,
  onCategoryChange,
  filterSize,
  onSizeChange,
  filterType,
  onTypeChange,
  onClearFilters,
  brands,
  categories,
  uniqueSizes,
  typeOptions,
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* SEARCH BAR */}
      <div className="flex w-full items-center gap-2 bg-white/70 rounded-lg px-3 py-2 shadow-sm border border-gray-200">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Search product code, name, description..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full border-0 bg-transparent focus-visible:ring-0 text-sm"
        />
      </div>

      {/* FILTERS ROW */}
      <div className="flex flex-row flex-wrap md:flex-nowrap items-center gap-2 overflow-x-auto scrollbar-none">
        <SelectFilter
          value={filterBrand}
          onValueChange={onBrandChange}
          placeholder="Brand"
          options={(brands || []).map((b) => ({
            value: String(b.brand_name ?? ""),
            label: String(b.brand_name ?? ""),
          }))}
          label="All Brands"
        />

        <SelectFilter
          value={filterCategory}
          onValueChange={onCategoryChange}
          placeholder="Category"
          options={(categories || []).map((c) => ({
            // ✅ IMPORTANT: value must match what you store in product.category
            // If product.category is category_name, keep category_name.
            // If product.category is category_code, change to category_code.
            value: String(c.category_name ?? ""),
            label: String(c.category_name ?? ""),
          }))}
          label="All Categories"
        />

        <SelectFilter
          value={filterSize}
          onValueChange={onSizeChange}
          placeholder="Size"
          options={(uniqueSizes || []).map((s) => ({
            value: String(s),
            label: String(s),
          }))}
          label="All Sizes"
        />

        <SelectFilter
          value={filterType}
          onValueChange={onTypeChange}
          placeholder="Type"
          options={(typeOptions || []).map((t) => ({
            value: String(t),
            label: String(t),
          }))}
          label="All Types"
        />

        <Button
          variant="ghost"
          onClick={onClearFilters}
          className="text-xs text-red-600 hover:text-red-800 whitespace-nowrap"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

function SelectFilter({ value, onValueChange, placeholder, options, label }) {
  return (
    <div className="min-w-[130px]">
      <Select value={String(value)} onValueChange={onValueChange}>
        <SelectTrigger className="rounded-lg h-9 text-sm border-gray-200">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{label}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

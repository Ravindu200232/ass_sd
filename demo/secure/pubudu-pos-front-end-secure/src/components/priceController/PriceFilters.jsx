// src/pages/PriceManagement/PriceFilters.jsx

import React from "react";
import { Search } from "lucide-react";

export default function PriceFilters({
  searchTerm,
  setSearchTerm,
  departments,
  brands,
  categories,
  groups,
  selectedDepartment,
  setSelectedDepartment,
  selectedBrand,
  setSelectedBrand,
  selectedCategory,
  setSelectedCategory,
  selectedGroup,
  setSelectedGroup,
}) {
  return (
    <div
      className="
        bg-white 
        border border-[#D5E3F4] 
        rounded-xl 
        shadow-sm 
        p-4 
        grid grid-cols-1 md:grid-cols-5 gap-3
      "
    >
      {/* Search */}
      <div className="relative col-span-1 md:col-span-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AB5] w-4 h-4" />
        <input
          type="text"
          placeholder="Search products (code, name)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            w-full pl-9 pr-3 py-2 
            rounded-lg border border-[#C9D9EE]
            text-sm
            focus:ring-2 focus:ring-[#0A6ED1]/40 
            focus:border-[#0A6ED1]
            outline-none
          "
        />
      </div>

      {/* Department */}
      <SelectField
        value={selectedDepartment}
        onChange={setSelectedDepartment}
        options={[
          { value: "all", label: "All Departments" },
          ...departments.map((d) => ({
            value: d.id.toString(),
            label: d.department_name,
          })),
        ]}
      />

      {/* Brand */}
      <SelectField
        value={selectedBrand}
        onChange={setSelectedBrand}
        options={brands.map((b) => ({
          value: b,
          label: b === "all" ? "All Brands" : b,
        }))}
      />

      {/* Category */}
      <SelectField
        value={selectedCategory}
        onChange={setSelectedCategory}
        options={categories.map((c) => ({
          value: c,
          label: c === "all" ? "All Categories" : c,
        }))}
      />

      {/* Group */}
      <SelectField
        value={selectedGroup}
        onChange={setSelectedGroup}
        options={groups.map((g) => ({
          value: g,
          label: g === "all" ? "All Groups" : g,
        }))}
      />
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-full px-3 py-2 
        rounded-lg border border-[#C9D9EE] bg-white
        text-sm
        focus:ring-2 focus:ring-[#0A6ED1]/40 
        focus:border-[#0A6ED1]
        outline-none
      "
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

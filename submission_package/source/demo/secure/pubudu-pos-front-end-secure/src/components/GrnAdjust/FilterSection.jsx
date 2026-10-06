import React from "react";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Building2 } from "lucide-react";

export const FilterSection = ({
  search,
  setSearch,
  dateFilter,
  setDateFilter,
  departmentFilter,
  setDepartmentFilter,
}) => {
  return (
    <div
      className="
        grid grid-cols-1 md:grid-cols-3 gap-4
        bg-white/70 backdrop-blur-sm
        border border-[#D5E3F4] rounded-xl
        p-4 shadow-sm
      "
    >
      {/* SEARCH FIELD */}
      <div>
        <label className="text-sm font-semibold text-[#0A294F] flex items-center gap-2 mb-1">
          <Search size={16} className="text-[#0A6ED1]" /> Search
        </label>

        <Input
          placeholder="Search GRN, department, user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            border-[#C8D4E9]
            focus-visible:ring-[#0A6ED1]/50
            focus:border-[#0A6ED1]
            bg-white
          "
        />
      </div>

      {/* DATE FILTER */}
      <div>
        <label className="text-sm font-semibold text-[#0A294F] flex items-center gap-2 mb-1">
          <Calendar size={16} className="text-[#0A6ED1]" /> Date
        </label>

        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="
            border-[#C8D4E9]
            focus-visible:ring-[#0A6ED1]/50
            focus:border-[#0A6ED1]
            bg-white
          "
        />
      </div>

      {/* DEPARTMENT FILTER */}
      <div>
        <label className="text-sm font-semibold text-[#0A294F] flex items-center gap-2 mb-1">
          <Building2 size={16} className="text-[#0A6ED1]" /> Department
        </label>

        <Input
          placeholder="Department name..."
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="
            border-[#C8D4E9]
            focus-visible:ring-[#0A6ED1]/50
            focus:border-[#0A6ED1]
            bg-white
          "
        />
      </div>
    </div>
  );
};

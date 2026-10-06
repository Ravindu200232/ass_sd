import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download } from "lucide-react";

export const StockHeader = ({
  globalSearch,
  onGlobalSearchChange,
  onExport,
  onAddGRN,
}) => {
  return (
    <div
      className="
        flex flex-col lg:flex-row 
        items-start lg:items-center 
        justify-between gap-4
        px-6 py-5 mb-4
        bg-gradient-to-r from-white via-[#F7FAFF] to-[#E7F2FF]
        border border-[#D9E6F7]
        shadow-sm rounded-xl backdrop-blur-md
      "
    >
      {/* LEFT COLUMN */}
      <div>
        <h2 className="text-2xl font-bold text-[#0A294F] tracking-tight">
          LIVE STOCK
        </h2>

        <p className="text-sm text-[#0A294F]/70">
          All GRN items combined into current stock
        </p>

        <div className="h-1 w-14 bg-[#0A6ED1] rounded-full mt-2"></div>
      </div>

      {/* RIGHT COLUMN */}
      <div
        className="
          w-full lg:w-auto 
          flex flex-col sm:flex-row 
          items-stretch sm:items-center 
          gap-3
        "
      >
        {/* SEARCH BAR - INCREASED SIZE */}
        <div
          className="
            flex items-center gap-3 
            bg-white border border-[#C8D4E9] shadow-sm
            rounded-lg px-4 py-3 w-full sm:w-auto
            focus-within:ring-2 focus-within:ring-[#0A6ED1]/40
            focus-within:border-[#0A6ED1]
            transition-all duration-200
            hover:border-[#0A6ED1]/60
          "
        >
          <Search className="text-[#6B7A99] h-6 w-6" />
          <Input
            placeholder="Search inventory by code, name, brand, or department..."
            value={globalSearch}
            onChange={(e) => onGlobalSearchChange(e.target.value)}
            className="
              border-0 focus-visible:ring-0 
              h-10 text-[#0A294F] text-base
              placeholder:text-gray-400
              w-full sm:w-72 md:w-96 lg:w-[500px]
            "
          />
          {globalSearch && (
            <div className="
              text-xs text-gray-500 bg-gray-100 
              px-2 py-1 rounded-md hidden md:block
            ">
              Press Enter to search
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-2">
          {/* EXPORT BUTTON */}
          <Button
            variant="outline"
            onClick={onExport}
            className="
              border-[#A3D9A5] text-[#1E7A2E]
              hover:bg-[#EAF7EA] hover:border-[#1E7A2E]
              shadow-sm rounded-lg transition-all
              h-11 px-4
              font-medium
            "
          >
            <Download className="h-5 w-5 mr-2" /> 
            <span className="hidden sm:inline">Export</span>
          </Button>

          {/* ADD GRN BUTTON */}
          <Button
            onClick={onAddGRN}
            className="
              bg-gradient-to-r from-[#0A6ED1] to-[#0854A1]
              text-white rounded-lg shadow-md 
              hover:opacity-95 hover:shadow-lg 
              transition-all flex items-center gap-2
              h-11 px-5
              font-semibold
            "
          >
            <Plus className="h-5 w-5" /> 
            <span className="hidden sm:inline">Add GRN</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
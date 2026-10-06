import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download } from "lucide-react";

/* -----------------------------------------------------------
   SAP FIORI QUARTZ PAGE HEADER — FULLY MOBILE RESPONSIVE
----------------------------------------------------------- */

export function PageHeader({ onAddClick, onExportClick, onImportClick }) {
  return (
    <div
      className="
        w-full rounded-xl
        px-4 py-4 sm:px-6 sm:py-5
        mb-4
        bg-gradient-to-r from-white via-[#F7FAFF] to-[#E7F2FF]
        border border-[#D9E6F7]
        shadow-sm backdrop-blur-md

        flex flex-col sm:flex-row
        sm:items-center sm:justify-between
        gap-4 sm:gap-0
      "
    >
      {/* LEFT — Title + Subtitle */}
      <div className="w-full sm:w-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-[#0A294F] flex items-center gap-2">
          Products — Inventory
        </h1>

        <p className="text-xs sm:text-sm text-[#0A294F]/70 mt-0.5">
          Enterprise product grid — search, filter, sort, export
        </p>

        {/* SAP Blue underline accent */}
        <div className="h-1 w-10 sm:w-12 bg-[#0A6ED1] rounded-full mt-2"></div>
      </div>

      {/* RIGHT — Action Buttons */}
      <div
        className="
          flex flex-wrap sm:flex-nowrap
          items-center justify-start sm:justify-end
          gap-2 sm:gap-3
          w-full sm:w-auto
        "
      >
        {/* Import Button - FIXED: Now properly triggers file input */}
        <Button
          variant="outline"
          onClick={onImportClick}
          className="
            flex items-center gap-2 
            rounded-lg shadow-sm
            border-[#BFD4F5] text-[#0A6ED1]
            hover:bg-[#E7F2FF] hover:border-[#0A6ED1]
            transition-all
            text-xs sm:text-sm
            px-3 py-2
          "
        >
          <Upload className="h-4 w-4" /> Import
        </Button>

        {/* Add Product — Primary Button */}
        <Button
          onClick={onAddClick}
          className="
            flex items-center gap-2 
            bg-gradient-to-r from-[#0A6ED1] to-[#0854A1]
            text-white rounded-lg shadow-md
            hover:shadow-lg hover:opacity-95 
            transition-all px-4 py-2
            text-xs sm:text-sm
          "
        >
          <Plus className="h-4 w-4" /> Add
        </Button>

        {/* Export Button */}
        <Button
          variant="outline"
          onClick={onExportClick}
          className="
            flex items-center gap-2 
            rounded-lg shadow-sm
            border-[#A3D9A5] text-[#1E7A2E]
            hover:bg-[#EAF7EA] hover:border-[#1E7A2E]
            transition-all
            text-xs sm:text-sm
            px-3 py-2
          "
        >
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>
    </div>
  );
}
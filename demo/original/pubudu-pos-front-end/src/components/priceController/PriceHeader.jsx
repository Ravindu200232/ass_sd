// src/pages/PriceManagement/PriceHeader.jsx

import React from "react";
import { Download, RefreshCcw } from "lucide-react";

export default function PriceHeader({ onRefresh, onExport }) {
  return (
    <div
      className="
        w-full 
        bg-gradient-to-r from-white via-[#F7FAFF] to-[#E5F0FF]
        border border-[#D5E3F4]
        rounded-xl 
        shadow-sm 
        p-5 
        flex flex-col md:flex-row 
        items-start md:items-center 
        justify-between 
        gap-4
      "
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0A294F]">
          Price Controller
        </h1>
        <p className="text-[#5A6B7A] text-sm">
          View complete GRN pricing & cost history for each product
        </p>
        <div className="h-1 w-16 bg-[#0A6ED1] rounded-full mt-2" />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          className="
            flex items-center gap-2 px-4 py-2.5 
            border border-[#0A6ED1]/40 
            text-[#0A6ED1] 
            bg-white 
            hover:bg-[#E5F1FF]
            rounded-lg shadow-sm hover:shadow-md
            transition-all text-sm font-medium
          "
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>

        <button
          onClick={onExport}
          className="
            flex items-center gap-2 px-4 py-2.5 
            bg-[#0A6ED1] hover:bg-[#085AA5] 
            text-white text-sm font-semibold
            rounded-lg shadow-sm hover:shadow-md
            transition-all
          "
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
}

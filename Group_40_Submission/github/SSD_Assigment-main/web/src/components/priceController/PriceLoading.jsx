// src/pages/PriceManagement/PriceLoading.jsx

import React from "react";

export default function PriceLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F4F6FB]">
      <div className="text-center select-none">
        <div
          className="
            animate-spin
            h-10 w-10
            rounded-full
            border-[3px]
            border-[#D5E3F4]
            border-t-[#0A6ED1]
            shadow-sm shadow-blue-200/40
            mx-auto
          "
        />
        <p className="mt-3 text-sm font-medium text-[#0A294F]/70">
          Loading price data...
        </p>
      </div>
    </div>
  );
}

import React from "react";

export default function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center select-none">

        {/* SAP Blue Spinner */}
        <div
          className="
            animate-spin 
            h-9 w-9 
            rounded-full 
            border-[3px]
            border-[#D5E3F4] 
            border-t-[#0A6ED1]
            shadow-sm shadow-blue-200/40
            mx-auto
          "
        ></div>

        {/* SAP Text */}
        <p className="mt-3 text-sm font-medium text-[#0A294F]/80">
          Loading Brand...
        </p>
      </div>
    </div>
  );
}

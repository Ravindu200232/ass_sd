import React from "react";

export const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-64">
      <div className="text-center">

        {/* SAP Blue Spinner */}
        <div
          className="
            animate-spin 
            h-10 w-10 
            rounded-full 
            border-[3px] 
            border-[#D7E3F4] 
            border-t-[#0A6ED1]
            shadow-sm shadow-blue-200/50
            mx-auto
          "
        />

        {/* Quartz-style loading text */}
        <p className="mt-3 text-sm font-medium text-[#0A294F] dark:text-slate-300">
          Loading Dashboard...
        </p>
      </div>
    </div>
  );
};

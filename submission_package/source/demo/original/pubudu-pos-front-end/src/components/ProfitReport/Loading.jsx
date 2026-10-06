import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center select-none">
        
        {/* SAP Fiori Quartz Blue Spinner */}
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

        {/* SAP muted label */}
        <p className="mt-3 text-sm font-medium text-[#0A294F]/70">
          Loading profit report data...
        </p>
      </div>
    </div>
  );
}

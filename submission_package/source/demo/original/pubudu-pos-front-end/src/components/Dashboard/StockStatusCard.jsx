import React from "react";

export const StockStatusCard = ({ stockStatus }) => {
  return (
    <div
      className="
        grid 
        grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-4 
        gap-4
      "
    >

      {/* HEALTHY – SAP BLUE */}
      <div
        className="
          text-center p-4 rounded-xl border 
          bg-[#E8F3FF] border-[#A7D0FF]
          dark:bg-blue-900/20 dark:border-blue-800
          shadow-sm hover:shadow-md transition-all duration-300
        "
      >
        <div className="text-2xl font-extrabold text-[#0A6ED1]">
          {stockStatus.healthy}
        </div>
        <div className="text-xs font-semibold text-[#0854A1]">Healthy Stock</div>
        <div className="text-xs text-[#0854A1]/70 mt-1">≥ 10 units</div>
      </div>

      {/* LOW – SAP WARNING ORANGE */}
      <div
        className="
          text-center p-4 rounded-xl border 
          bg-[#FFF4D6] border-[#F0C573]
          dark:bg-yellow-900/20 dark:border-yellow-800
          shadow-sm hover:shadow-md transition-all duration-300
        "
      >
        <div className="text-2xl font-extrabold text-[#F0AB00]">
          {stockStatus.low}
        </div>
        <div className="text-xs font-semibold text-[#C98A00]">Low Stock</div>
        <div className="text-xs text-[#A87400]/70 mt-1">6 – 9 units</div>
      </div>

      {/* CRITICAL – SAP ERROR RED */}
      <div
        className="
          text-center p-4 rounded-xl border 
          bg-[#FDE2E1] border-[#F5A3A1]
          dark:bg-red-900/20 dark:border-red-800
          shadow-sm hover:shadow-md transition-all duration-300
        "
      >
        <div className="text-2xl font-extrabold text-[#D9534F]">
          {stockStatus.critical}
        </div>
        <div className="text-xs font-semibold text-[#B13C39]">Critical</div>
        <div className="text-xs text-[#A12826]/70 mt-1">≤ 5 units</div>
      </div>

      {/* TOTAL ITEMS */}
      <div
        className="
          text-center p-4 rounded-xl border 
          bg-[#E7F2FF] border-[#A7D0FF]
          dark:bg-blue-900/20 dark:border-blue-800
          shadow-sm hover:shadow-md transition-all duration-300
        "
      >
        <div className="text-2xl font-extrabold text-[#084C92]">
          {stockStatus.total}
        </div>
        <div className="text-xs font-semibold text-[#0A6ED1]">Total Items</div>
        <div className="text-xs text-[#0A6ED1]/70 mt-1">All categories</div>
      </div>

    </div>
  );
};

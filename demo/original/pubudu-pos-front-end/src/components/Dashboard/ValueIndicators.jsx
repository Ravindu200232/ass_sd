import React from "react";
import { Layers, TrendingUp } from "lucide-react";

export const ValueIndicators = ({ stockData }) => {
  return (
    <div className="grid grid-cols-2 gap-4">

      {/* STOCK VALUE CARD */}
      <div
        className="
          p-4 rounded-xl border shadow-sm 
          bg-gradient-to-br from-white via-[#F7FAFF] to-[#E2EEFF]
          dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
          hover:shadow-lg hover:-translate-y-1 transition-all duration-300
        "
      >
        <div className="flex items-center justify-between">

          <div>
            <div className="text-xs font-semibold text-[#556B89] dark:text-slate-400">
              Stock Value
            </div>

            <div className="text-2xl font-extrabold text-[#0A6ED1] dark:text-blue-300">
              LKR {stockData.total_value?.toLocaleString() || "0"}
            </div>
          </div>

          <div className="relative">
            {/* Icon Glow */}
            <div className="absolute inset-0 bg-[#0A6ED1]/20 blur-lg rounded-full opacity-40" />
            <Layers className="h-8 w-8 text-[#0A6ED1]/70 dark:text-blue-400/60 relative" />
          </div>
        </div>
      </div>

      {/* AVERAGE ITEM VALUE CARD */}
      <div
        className="
          p-4 rounded-xl border shadow-sm 
          bg-gradient-to-br from-white via-[#F2F7FF] to-[#DDEBFF]
          dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
          hover:shadow-lg hover:-translate-y-1 transition-all duration-300
        "
      >
        <div className="flex items-center justify-between">

          <div>
            <div className="text-xs font-semibold text-[#556B89] dark:text-slate-400">
              Avg Item Value
            </div>

            <div className="text-2xl font-extrabold text-[#084C92] dark:text-blue-300">
              LKR {stockData.avg_value?.toLocaleString() || "0"}
            </div>
          </div>

          <div className="relative">
            {/* Icon Glow */}
            <div className="absolute inset-0 bg-[#0A6ED1]/20 blur-lg rounded-full opacity-40" />
            <TrendingUp className="h-8 w-8 text-[#0A6ED1]/70 dark:text-blue-400/60 relative" />
          </div>
        </div>
      </div>

    </div>
  );
};

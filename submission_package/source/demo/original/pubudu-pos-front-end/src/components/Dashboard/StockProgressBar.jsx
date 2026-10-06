import React from "react";

export const StockProgressBar = ({ stockStatus }) => {
  const total = stockStatus.total || 1;

  const healthyPct = (stockStatus.healthy / total) * 100;
  const lowPct = (stockStatus.low / total) * 100;
  const criticalPct = (stockStatus.critical / total) * 100;

  return (
    <div className="space-y-4">
      <div>
        {/* Header */}
        <div className="flex justify-between text-sm mb-1">
          <span className="font-semibold text-foreground tracking-tight">
            Stock Health Distribution
          </span>
          <span className="text-muted-foreground">
            {total > 0
              ? Math.round(
                  ((stockStatus.healthy +
                    stockStatus.low +
                    stockStatus.critical) /
                    total) *
                    100
                )
              : 0}
            % coverage
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="
          h-4 rounded-full overflow-hidden 
          bg-gradient-to-r from-gray-200/60 to-gray-300/40 
          dark:from-slate-800 dark:to-slate-700
          shadow-inner
        ">
          <div className="flex h-full w-full">

            {total > 0 ? (
              <>
                {/* HEALTHY – SAP Blue */}
                <div
                  className="
                    bg-[#0A6ED1] 
                    shadow-sm shadow-blue-300 
                    dark:shadow-blue-900
                    transition-all duration-500
                  "
                  style={{ width: `${healthyPct}%` }}
                />

                {/* LOW – SAP Orange */}
                <div
                  className="
                    bg-[#F0AB00] 
                    shadow-sm shadow-yellow-300 
                    dark:shadow-yellow-900
                    transition-all duration-500
                  "
                  style={{ width: `${lowPct}%` }}
                />

                {/* CRITICAL – SAP Red */}
                <div
                  className="
                    bg-[#D9534F] 
                    shadow-sm shadow-red-300 
                    dark:shadow-red-900
                    transition-all duration-500
                  "
                  style={{ width: `${criticalPct}%` }}
                />
              </>
            ) : (
              <div className="w-full bg-muted-foreground/20" />
            )}

          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs pt-2 text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#0A6ED1] rounded-sm" />
            Healthy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#F0AB00] rounded-sm" />
            Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#D9534F] rounded-sm" />
            Critical
          </span>
        </div>
      </div>
    </div>
  );
};

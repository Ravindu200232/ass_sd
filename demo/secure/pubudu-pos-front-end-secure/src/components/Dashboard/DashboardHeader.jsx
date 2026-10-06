import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const DashboardHeader = ({ user, departmentInfo, refreshAllData, refreshing }) => {
  return (
    <div
      className="
        relative overflow-hidden rounded-2xl border shadow-sm
        bg-gradient-to-br from-white via-[#F7FAFF] to-[#E3F0FF]
        dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
      "
    >
      {/* SAP Quartz grid pattern */}
      <div className="absolute inset-0 bg-grid-slate-200/40 dark:bg-grid-slate-700/30 
        [mask-image:radial-gradient(ellipse_at_top_right,white,transparent_70%)]" />

      {/* SAP Blue glow accent */}
      <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-[#0A6ED1]/15 rounded-full blur-3xl" />

      <div className="relative px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-start sm:justify-between gap-5 sm:gap-8">

          {/* LEFT CONTENT */}
          <div className="flex-1 space-y-3">

            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="
                h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-[#0A6ED1] 
                flex items-center justify-center 
                text-white font-bold text-base sm:text-lg 
                shadow-lg shadow-blue-300/40
              ">
                PA
              </div>

              <div>
                <h1 className="text-[10px] sm:text-xs font-semibold text-[#5A6D85] dark:text-slate-400 tracking-widest uppercase">
                  Pubudu Auto Machineries
                </h1>
                <div className="h-0.5 w-10 sm:w-12 bg-[#0A6ED1] mt-1 rounded-full" />
              </div>
            </div>

            {/* Welcome */}
            <div className="space-y-1">
              <h2 className="
                text-2xl sm:text-4xl font-extrabold tracking-tight 
                text-[#0A294F] dark:text-white
              ">
                Welcome back, {user?.full_name} 👋
              </h2>

              <div className="flex items-center gap-3 flex-wrap">

                <p className="
                  text-[#667F9A] dark:text-slate-400 
                  text-xs sm:text-sm font-medium
                ">
                  Real-time ERP performance analytics and department management
                </p>

                {/* Refresh Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshAllData}
                  disabled={refreshing}
                  className="
                    h-7 w-7 p-0 rounded-lg 
                    hover:bg-[#0A6ED1]/10 
                    text-[#0A6ED1] dark:text-blue-400
                  "
                  title="Refresh data"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE BADGES */}
          <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">

            {/* ROLE BADGE */}
            <div className="group relative self-start sm:self-end">
              <div className="absolute inset-0 bg-[#0A6ED1] rounded-xl blur opacity-25 group-hover:opacity-40 transition-opacity" />
              <div
                className="
                  relative px-4 py-2.5 sm:px-5 rounded-xl 
                  bg-[#0A6ED1] text-white 
                  text-xs sm:text-sm font-bold tracking-wide 
                  shadow-lg flex items-center gap-2
                "
              >
                <div className="h-2 w-2 rounded-full bg-white/80 animate-pulse" />
                {user?.role?.toUpperCase()} ACCESS
              </div>
            </div>

            {/* DEPARTMENT BADGE */}
            {user?.role === "employee" && departmentInfo && (
              <div className="group relative self-start sm:self-end">
                <div className="absolute inset-0 bg-[#0854A1] rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity" />

                <div
                  className="
                    relative px-3 py-2 sm:px-4 sm:py-2 rounded-lg 
                    bg-[#0854A1] text-white 
                    text-[10px] sm:text-xs font-semibold shadow-md flex items-center gap-2
                  "
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                      clipRule="evenodd"
                    />
                  </svg>

                  {departmentInfo.department_name} ({departmentInfo.department_code})
                </div>
              </div>
            )}

            {/* SYSTEM STATUS */}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[#667F9A] dark:text-slate-400 font-medium self-start sm:self-end">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              System Online
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

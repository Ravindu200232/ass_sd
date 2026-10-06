import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export const KPICard = ({ stat }) => {
  const Icon = stat.icon;
  const isPositive = stat.percentage > 0;

  return (
    <Card
      className="
        group relative overflow-hidden rounded-xl border-0 
        shadow-sm hover:shadow-xl hover:-translate-y-1 
        transition-all duration-300
        bg-gradient-to-br from-white via-[#F7FAFF] to-[#E3F0FF]
        dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
      "
    >
      {/* SAP Quartz hover overlay */}
      <div
        className="
          absolute inset-0 bg-gradient-to-br 
          from-[#0A6ED1]/10 via-transparent to-transparent 
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-300
        "
      />

      {/* SAP Corner Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#0A6ED1]/15 rounded-bl-full opacity-40 pointer-events-none" />

      <CardHeader className="relative pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold tracking-tight text-[#0A294F] dark:text-white flex items-center gap-3">

          {/* Icon glow container */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#0A6ED1]/30 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
            <div
              className="
                relative p-2.5 rounded-xl bg-[#0A6ED1] text-white 
                shadow-lg group-hover:scale-110 
                transition-transform duration-300
              "
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>

          {stat.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        <div
          className="
            text-3xl font-extrabold tracking-tight 
            text-[#0A294F] dark:text-white 
            group-hover:text-[#0A6ED1] transition-colors
          "
        >
          {stat.value}
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#6B7C93] dark:text-slate-400">
            {stat.description}
          </p>

          {stat.percentage !== undefined && (
            <div
              className={`
                flex items-center text-xs font-semibold px-2 py-1 rounded-md
                transition-all duration-300 group-hover:scale-105
                ${
                  isPositive
                    ? "text-[#0A6ED1] bg-[#D8E7FF] dark:bg-blue-900/30"
                    : "text-[#D9534F] bg-[#FDE2E1] dark:bg-red-900/30"
                }
              `}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(stat.percentage)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

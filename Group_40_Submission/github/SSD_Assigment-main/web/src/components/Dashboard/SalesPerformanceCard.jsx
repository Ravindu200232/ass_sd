import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ShoppingCart } from "lucide-react";

export const SalesPerformanceCard = ({ dashboardData }) => {
  return (
    <Card className="
      group relative rounded-xl border shadow-sm
      bg-gradient-to-br from-white via-[#F6FAFF] to-[#E3F0FF]
      dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
      hover:shadow-xl hover:-translate-y-1 transition-all duration-300
    ">
      
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A6ED1]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="
            p-2 rounded-lg bg-[#0A6ED1] text-white 
            shadow-md group-hover:scale-110 transition-transform
          ">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="tracking-tight text-foreground">Sales Performance</div>
            <CardDescription className="text-sm">Today & monthly analytics</CardDescription>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        
        {/* TODAY */}
        <div className="
          p-4 rounded-lg border 
          bg-[#E7F2FF] border-[#BFDFFF]
          dark:bg-blue-900/20 dark:border-blue-800
        ">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium text-[#0854A1]">Today's Performance</div>

            <div className={`
              text-xs font-semibold 
              ${dashboardData?.today?.sales_growth > 0 ? "text-emerald-600" : "text-red-600"}
            `}>
              {dashboardData?.today?.sales_growth > 0 ? "↑" : "↓"}{" "}
              {Math.abs(dashboardData?.today?.sales_growth || 0)}%
            </div>
          </div>

          <div className="text-3xl font-extrabold text-[#0A6ED1]">
            LKR {dashboardData?.today?.sales?.toLocaleString() || "0"}
          </div>

          <div className="text-sm text-[#0854A1]/80 mt-1">
            {dashboardData?.today?.invoices_count || 0} invoices
          </div>
        </div>

        {/* MONTH */}
        <div className="
          p-4 rounded-lg border 
          bg-[#DBEAFE] border-[#A7D0FF]
          dark:bg-blue-900/20 dark:border-blue-800
        ">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium text-[#0A6ED1]">Monthly Performance</div>

            <div className={`
              text-xs font-semibold 
              ${dashboardData?.this_month?.sales_growth > 0 ? "text-blue-600" : "text-red-600"}
            `}>
              {dashboardData?.this_month?.sales_growth > 0 ? "↑" : "↓"}{" "}
              {Math.abs(dashboardData?.this_month?.sales_growth || 0)}%
            </div>
          </div>

          <div className="text-3xl font-extrabold text-[#084C92]">
            LKR {dashboardData?.this_month?.sales?.toLocaleString() || "0"}
          </div>

          <div className="text-sm text-[#084C92]/80 mt-1">
            {dashboardData?.this_month?.invoices_count || 0} invoices
          </div>
        </div>

        {/* BUTTON */}
        <Button
          asChild
          className="
            w-full py-5 font-semibold 
            bg-[#0A6ED1] hover:bg-[#0854A1] text-white 
            shadow-md hover:shadow-xl 
            transition-all duration-300
          "
        >
          <a href="/sales">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create New Sale
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

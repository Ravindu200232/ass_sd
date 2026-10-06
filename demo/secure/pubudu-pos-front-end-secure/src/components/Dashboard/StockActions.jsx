import React from "react";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle } from "lucide-react";

export const StockActions = ({ user }) => {
  return (
    <div className="flex gap-3 pt-2">

      {/* View Stock Button – SAP Primary Blue */}
      <Button
        asChild
        className="
          flex-1 font-semibold py-5 
          bg-[#0A6ED1] hover:bg-[#0854A1] 
          text-white shadow-md hover:shadow-lg 
          rounded-lg transition-all duration-300
          group relative overflow-hidden
        "
      >
        <a href={user?.role === 'employee' ? '/stockemp' : '/stock'}>
          
          {/* SAP Hover Sweep Effect */}
          <span
            className="
              absolute inset-0 bg-gradient-to-r 
              from-transparent via-white/20 to-transparent 
              translate-x-[-200%] group-hover:translate-x-[200%] 
              transition-transform duration-700
            "
          />
          
          <span className="relative flex items-center justify-center gap-2">
            <Package className="h-4 w-4" />
            View Full Stock
          </span>
        </a>
      </Button>

      {/* Low Stock Alerts – SAP Fiori Warning Variant */}
      <Button
        asChild
        variant="outline"
        className="
          flex-1 py-5 font-semibold 
          border-[#D9534F] text-[#D9534F] 
          hover:bg-[#D9534F]/10 hover:text-[#C9302C]
          rounded-lg transition-all duration-300
        "
      >
        <a href="/reports?tab=lowstock" className="flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Low Stock Alerts
        </a>
      </Button>

    </div>
  );
};

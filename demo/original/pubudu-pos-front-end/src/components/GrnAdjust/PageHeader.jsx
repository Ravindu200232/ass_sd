import React from "react";
import { Button } from "@/components/ui/button";

export const PageHeader = ({ navigate }) => {
  return (
    <div
      className="
        max-w-7xl mx-auto mb-8 
        flex justify-between items-center 
        px-4 py-4 
        bg-gradient-to-r from-white via-[#F7FAFF] to-[#E7F1FF]
        border border-[#D5E3F4] rounded-xl shadow-sm
      "
    >
      {/* LEFT SECTION */}
      <div>
        <h1 className="text-3xl font-bold text-[#0A294F]">
          Stock GRN Records
        </h1>
        <p className="text-sm text-[#6B7A99]">
          View all Goods Received Notes
        </p>

        {/* SAP Blue Underline */}
        <div className="h-1 w-20 bg-[#0A6ED1] rounded-full mt-2"></div>
      </div>

      {/* CREATE BUTTON (SAP PRIMARY BLUE) */}
      <Button
        onClick={() => navigate("/grn/create")}
        className="
          bg-gradient-to-r from-[#0A6ED1] to-[#0854A1]
          text-white font-semibold shadow-md
          hover:shadow-lg hover:opacity-95
          transition-all rounded-lg px-5 py-2
        "
      >
        + Create GRN
      </Button>
    </div>
  );
};

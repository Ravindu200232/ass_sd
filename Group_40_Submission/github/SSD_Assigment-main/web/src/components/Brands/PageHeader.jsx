import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PageHeader({ onAddClick }) {
  return (
    <div
      className="
        w-full 
        bg-white 
        border border-[#D8E1EB] 
        rounded-xl 
        shadow-sm 
        px-6 py-5 
        flex items-center justify-between
      "
    >
      {/* LEFT — SAP HEADER SECTION */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A294F]">
          Brands
        </h1>

        <p className="text-sm text-[#5A6B7A]">
          Manage product brand records
        </p>

        {/* OPTIONAL SAP UNDERLINE ACCENT  */}
        <div className="h-1 w-14 bg-[#0A6ED1] rounded-full"></div>
      </div>

      {/* RIGHT — SAP PRIMARY ACTION BUTTON */}
      <Button
        onClick={onAddClick}
        className="
          flex items-center gap-2
          bg-[#0A6ED1] hover:bg-[#085AA5]
          text-white font-semibold
          px-5 py-2.5 rounded-lg
          shadow-sm hover:shadow-md
          transition-all
        "
      >
        <Plus className="h-4 w-4" />
        Add Brand
      </Button>
    </div>
  );
}

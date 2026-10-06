import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export function PageHeader({ onAddClick }) {
  return (
    <div
      className="
        w-full 
        bg-gradient-to-r from-white via-[#F7FAFF] to-[#E7F1FF]
        border border-[#D5E3F4]
        rounded-xl 
        shadow-sm 
        px-6 py-5 

        /* Mobile-friendly layout */
        flex flex-col md:flex-row
        items-start md:items-center 
        justify-between
        gap-4
      "
    >
      {/* LEFT — Title Section */}
      <div className="w-full md:w-auto">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A294F]">
          Employee Management
        </h1>

        <p className="text-[#5A6B7A] text-sm">
          Manage employee accounts and permissions
        </p>

        <div className="h-1 w-16 bg-[#0A6ED1] rounded-full mt-2"></div>
      </div>

      {/* RIGHT — Action Button */}
      <div className="w-full md:w-auto flex justify-start md:justify-end">
        <Button
          onClick={onAddClick}
          className="
            flex items-center gap-2
            bg-[#0A6ED1] hover:bg-[#085AA5]
            text-white font-semibold
            px-5 py-2.5 rounded-lg
            shadow-sm hover:shadow-md
            transition-all
            w-full md:w-auto
          "
        >
          <UserPlus className="h-4 w-4" />
          Add New Employee
        </Button>
      </div>
    </div>
  );
}

import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User2, FileText } from "lucide-react";

export const GRNTableRow = ({ grn, onView }) => {
  return (
    <TableRow
      className="
        cursor-pointer 
        hover:bg-[#EAF2FB] 
        transition-colors 
        text-[#0A294F]
      "
    >
      {/* GRN CODE */}
      <TableCell className="font-mono font-semibold text-xs">
        {grn.grn_code}
      </TableCell>

      {/* DATE */}
      <TableCell className="text-sm">
        {grn.grn_date?.substring(0, 10) || "—"}
      </TableCell>

      {/* DEPARTMENT */}
      <TableCell>
        <Badge
          variant="outline"
          className="
            text-xs px-2 py-0.5
            bg-[#F5F8FC]
            border-[#C8D4E9]
            text-[#0A294F]
            shadow-sm
          "
        >
          {grn.department?.department_name || "N/A"}
        </Badge>
      </TableCell>

      {/* CREATED BY */}
      <TableCell>
        <div className="flex items-center gap-2 text-[#0A294F]/80">
          <User2 size={16} className="text-[#6B7A99]" />
          {grn.created_by?.full_name || "Unknown"}
        </div>
      </TableCell>

      {/* ITEM COUNT */}
      <TableCell>
        <Badge
          variant="secondary"
          className="
            text-xs bg-[#E8F1FF] 
            text-[#0A6ED1] 
            border border-[#A7C7EB]
            px-2 py-0.5
          "
        >
          {grn.total_item || 0} items
        </Badge>
      </TableCell>

      {/* TOTAL COST */}
      <TableCell className="text-right font-semibold text-[#0A6ED1] font-mono">
        LKR {Number(grn.total_cost || 0).toLocaleString()}
      </TableCell>

      {/* TOTAL SELLING */}
      <TableCell className="text-right font-semibold text-[#7B3AED] font-mono">
        LKR {Number(grn.total_selling_amount || 0).toLocaleString()}
      </TableCell>

      {/* PROFIT */}
      <TableCell className="text-right">
        <span className="font-semibold text-[#1E7A2E] font-mono">
          LKR {Number(grn.total_profit || 0).toLocaleString()}
        </span>
      </TableCell>

      {/* VIEW BUTTON */}
      <TableCell className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(grn)}
          className="
            border-[#0A6ED1]/40 
            text-[#0A6ED1] 
            hover:bg-[#EAF2FB] 
            rounded-md
            transition-all
          "
        >
          <FileText size={16} className="mr-1" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

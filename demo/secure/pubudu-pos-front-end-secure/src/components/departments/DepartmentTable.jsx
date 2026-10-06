import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DepartmentTableRow } from "./DepartmentTableRow";

export function DepartmentTable({ departments, onEdit, onDelete, searchTerm }) {
  return (
    <>
      <div className="text-sm text-[#5A6B7A] mb-3 pl-1">
        Showing{" "}
        <span className="font-semibold text-[#0A294F]">
          {departments.length}
        </span>{" "}
        department{departments.length !== 1 ? "s" : ""}
      </div>

      <Table className="border border-[#D5E3F4] rounded-xl overflow-hidden shadow-sm">
        <TableHeader className="sticky top-0 bg-[#F7FAFF]/90 backdrop-blur-md border-b border-[#D5E3F4] z-20">
          <TableRow className="bg-gradient-to-r from-[#E7F1FF] to-[#F4F8FF] text-[#0A294F] font-semibold">
            <TableHead className="py-3">Code</TableHead>
            <TableHead className="py-3">Department Name</TableHead>
            <TableHead className="py-3">Address</TableHead>
            <TableHead className="py-3">Contact</TableHead>
            <TableHead className="py-3">Status</TableHead>
            <TableHead className="py-3">Created Date</TableHead>
            <TableHead className="text-right py-3">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="bg-white">
          {departments.map((department) => (
            <DepartmentTableRow
              key={department.id}
              department={department}
              onEdit={onEdit}
              onDelete={onDelete} // expects full department object
            />
          ))}

          {departments.length === 0 && searchTerm && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-10 text-[#5A6B7A] bg-white"
              >
                No departments found matching{" "}
                <span className="font-semibold text-[#0A294F]">
                  "{searchTerm}"
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}

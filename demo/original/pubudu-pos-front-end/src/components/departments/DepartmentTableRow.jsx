import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export function DepartmentTableRow({ department, onEdit, onDelete }) {
  return (
    <TableRow className="hover:bg-indigo-50 transition cursor-pointer">
      <TableCell className="font-mono text-sm bg-indigo-50/50 rounded-lg">
        {department.department_code || "N/A"}
      </TableCell>

      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span>{department.department_name}</span>
        </div>
      </TableCell>

      <TableCell>
        <div className="max-w-xs truncate" title={department.department_address}>
          {department.department_address || "N/A"}
        </div>
      </TableCell>

      <TableCell>
        <div className="max-w-xs truncate" title={department.department_contact}>
          {department.department_contact || "N/A"}
        </div>
      </TableCell>

      <TableCell>
        <Badge className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded-lg shadow-sm">
          Active
        </Badge>
      </TableCell>

      <TableCell>
        {department.created_at
          ? new Date(department.created_at).toLocaleDateString()
          : "—"}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(department);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(department); // ✅ pass full object (matches confirmDelete)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export default function CategoriesTable({
  filteredCategories,
  searchTerm,
  onEdit,
  onDelete
}) {
  return (
    <Table
      className="
        rounded-xl overflow-hidden
        border border-[#D5E3F4]
        shadow-sm bg-white/80 backdrop-blur-sm
      "
    >
      {/* SAP HEADER */}
      <TableHeader
        className="
          sticky top-0 z-10 
          bg-gradient-to-r from-white via-[#F4F9FF] to-[#E7F1FF]
          border-b border-[#D3DFEE]
          backdrop-blur-md
        "
      >
        <TableRow>
          <TableHead className="font-semibold text-[#0A294F] text-xs tracking-wide">
            Code
          </TableHead>
          <TableHead className="font-semibold text-[#0A294F] text-xs tracking-wide">
            Category Name
          </TableHead>
          <TableHead className="font-semibold text-[#0A294F] text-xs tracking-wide">
            Status
          </TableHead>
          <TableHead className="font-semibold text-[#0A294F] text-xs tracking-wide">
            Created Date
          </TableHead>
          <TableHead className="text-right font-semibold text-[#0A294F] text-xs tracking-wide">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>

      {/* BODY */}
      <TableBody className="divide-y divide-[#E5ECF5]">
        {filteredCategories.map((category) => (
          <CategoryTableRow
            key={category.id}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* EMPTY SEARCH RESULT */}
        {filteredCategories.length === 0 && searchTerm && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="py-8 text-center text-[#6B7A99]"
            >
              No categories found matching "{searchTerm}"
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

/* -------------------------- ROW -------------------------- */

function CategoryTableRow({ category, onEdit, onDelete }) {
  return (
    <TableRow
      className="
        hover:bg-[#EAF2FB] 
        transition-colors cursor-pointer
        text-[#0A294F]
      "
    >
      <TableCell>
        <Badge
          className="
            bg-[#E8F1FF] text-[#0A6ED1]
            border border-[#A7C7EB]
            shadow-sm px-2 py-1 rounded-md font-mono text-xs
          "
        >
          {category.category_code}
        </Badge>
      </TableCell>

      <TableCell className="font-medium text-[#0A294F]">
        {category.category_name}
      </TableCell>

      <TableCell>
        <StatusBadge status={category.status} />
      </TableCell>

      <TableCell className="text-[#6B7A99]">
        {new Date(category.created_at).toLocaleDateString()}
      </TableCell>

      <TableCell className="text-right">
        <ActionButtons
          categoryId={category.id}
          onEdit={() => onEdit(category)}
          onDelete={() => onDelete(category)}
        />
      </TableCell>
    </TableRow>
  );
}

/* ----------------------- STATUS BADGE ----------------------- */

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <Badge
      className={`
        px-2 py-1 rounded-md shadow-sm text-xs
        ${active
          ? "bg-[#E6F7EC] text-[#1E7A2E] border border-[#A7D8B4]"
          : "bg-[#F0F2F5] text-[#6B7A99] border border-[#CCD3DD]"
        }
      `}
    >
      {status}
    </Badge>
  );
}

/* ----------------------- ACTION BUTTONS ----------------------- */

function ActionButtons({ categoryId, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-2">

      {/* EDIT */}
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className="
          border-[#0A6ED1]/40 text-[#0A6ED1]
          hover:bg-[#EAF2FB]
          rounded-md transition-all
        "
      >
        <Edit className="h-4 w-4" />
      </Button>

      {/* DELETE */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(categoryId)}
        className="
          border-red-300 text-red-700
          hover:bg-red-50 rounded-md
        "
      >
        <Trash2 className="h-4 w-4" />
      </Button>

    </div>
  );
}

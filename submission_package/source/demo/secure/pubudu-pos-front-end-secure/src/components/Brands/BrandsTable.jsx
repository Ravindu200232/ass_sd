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
import SearchBar from "./SearchBar";

export default function BrandsTable({
  brands,
  filteredBrands,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete,
}) {
  return (
    <Table className="rounded-xl overflow-hidden border border-[#D5E3F4]">
      {/* TABLE HEADER */}
      <TableHeader className="sticky top-0 z-20">
        <TableRow
          className="
            bg-gradient-to-r 
            from-[#EAF2FB] 
            via-[#E3EEFF] 
            to-[#D9E8FF] 
            text-[#0A294F] 
            border-b border-[#C3D4E6]
          "
        >
          <TableHead className="font-semibold">Code</TableHead>
          <TableHead className="font-semibold">Brand Name</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Created Date</TableHead>
          <TableHead className="text-right font-semibold">Actions</TableHead>
        </TableRow>
      </TableHeader>

      {/* TABLE BODY */}
      <TableBody>
        {filteredBrands.map((brand) => (
          <BrandTableRow
            key={brand.id}
            brand={brand}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* EMPTY STATE */}
        {filteredBrands.length === 0 && searchTerm && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center py-8 text-[#6B7A99]"
            >
              No brands found matching "<strong>{searchTerm}</strong>"
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

/* --------------------------------------------------------------------- */
/* ROW COMPONENT */
/* --------------------------------------------------------------------- */

function BrandTableRow({ brand, onEdit, onDelete }) {
  return (
    <TableRow
      className="
        hover:bg-[#EFF6FF] 
        transition-all cursor-pointer
        border-b border-[#E5EDF7]
      "
    >
      {/* CODE */}
      <TableCell>
        <Badge
          className="
            bg-[#D9E8FF] 
            text-[#0A294F] 
            border border-[#B6CBE5] 
            px-2 py-1 
            rounded-lg 
            font-mono 
            shadow-sm
          "
        >
          {brand.brand_code}
        </Badge>
      </TableCell>

      {/* NAME */}
      <TableCell className="font-medium text-[#0A294F]">
        {brand.brand_name}
      </TableCell>

      {/* STATUS */}
      <TableCell>
        <StatusBadge status={brand.status} />
      </TableCell>

      {/* DATE */}
      <TableCell className="text-[#3C4A5F]">
        {new Date(brand.created_at).toLocaleDateString()}
      </TableCell>

      {/* ACTION BUTTONS */}
      <TableCell className="text-right">
        <ActionButtons brand={brand} brandId={brand.id} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  );
}

/* --------------------------------------------------------------------- */
/* STATUS BADGE */
/* --------------------------------------------------------------------- */

function StatusBadge({ status }) {
  const active = status === "active";

  return (
    <Badge
      className={
        active
          ? "bg-[#D9FBE5] text-[#107E3E] border border-[#A6E4C0] rounded-lg shadow-sm"
          : "bg-[#ECEFF3] text-[#5A6B7A] border border-[#D3DAE3] rounded-lg shadow-sm"
      }
    >
      {status}
    </Badge>
  );
}

/* --------------------------------------------------------------------- */
/* ACTION BUTTONS */
/* --------------------------------------------------------------------- */

function ActionButtons({ brand,brandId, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-2">
      {/* EDIT */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(brandId)}
        className="
          border-[#8FB5E3] 
          text-[#0A6ED1] 
          hover:bg-[#E7F1FF] 
          rounded-md
        "
      >
        <Edit className="h-4 w-4" />
      </Button>

      {/* DELETE */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(brand)}
        className="
          border-[#F2B8B5] 
          text-[#C62828] 
          hover:bg-[#FCEAEA] 
          rounded-md
        "
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

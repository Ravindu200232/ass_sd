import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function BrandDialog({
  isOpen,
  onOpenChange,
  editingBrand,
  formData,
  onFormChange,
  onSubmit,
  onClearForm,
}) {
  const handleOpenChange = (open) => {
    onOpenChange(open);
    if (!open) onClearForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* SAP Primary Action Button */}
      <DialogTrigger asChild>
        <Button
          onClick={onClearForm}
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
      </DialogTrigger>

      {/* DIALOG FRAME */}
      <DialogContent
        className="
          max-w-md rounded-xl 
          border border-[#D5E3F4]
          bg-white/80 backdrop-blur-xl 
          shadow-xl
          p-6
        "
      >
        <DialogHeader>
          <DialogTitle className="text-[#0A294F] font-bold tracking-tight">
            {editingBrand ? "Edit Brand" : "Add New Brand"}
          </DialogTitle>

          <DialogDescription className="text-[#5A6B7A]">
            {editingBrand
              ? "Update brand information"
              : "Add a new product brand"}
          </DialogDescription>

          {/* SAP Accent Line */}
          <div className="h-1 w-16 bg-[#0A6ED1] rounded-full mt-2"></div>
        </DialogHeader>

        {/* FORM */}
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <FormField
            label="Brand Name *"
            placeholder="Enter brand name"
            value={formData.brand_name}
            onChange={(value) => onFormChange("brand_name", value)}
            required
          />

          <StatusSelect
            value={formData.status}
            onChange={(value) => onFormChange("status", value)}
          />

          <SubmitButton text={editingBrand ? "Update Brand" : "Create Brand"} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------- */
/* FORM FIELD COMPONENT */
/* -------------------------------------------------------- */

function FormField({ label, value, onChange, ...props }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[#0A294F] font-medium">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          rounded-lg 
          border-[#C6D4E1] 
          focus:ring-2 focus:ring-[#0A6ED1]/40 
        "
        {...props}
      />
    </div>
  );
}

/* -------------------------------------------------------- */
/* STATUS SELECT */
/* -------------------------------------------------------- */

function StatusSelect({ value, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[#0A294F] font-medium">Status</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="
            rounded-lg border-[#C6D4E1] 
            focus:ring-2 focus:ring-[#0A6ED1]/40
          "
        >
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* -------------------------------------------------------- */
/* SUBMIT BUTTON */
/* -------------------------------------------------------- */

function SubmitButton({ text }) {
  return (
    <Button
      type="submit"
      className="
        w-full
        bg-[#0A6ED1] hover:bg-[#085AA5]
        text-white font-semibold
        py-2.5 rounded-lg
        shadow-sm hover:shadow-md
        transition-all
      "
    >
      {text}
    </Button>
  );
}

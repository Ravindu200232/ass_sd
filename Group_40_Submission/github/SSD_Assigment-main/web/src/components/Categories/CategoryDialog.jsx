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

export default function CategoryDialog({
  isDialogOpen,
  setIsDialogOpen,
  editingCategory,
  formData,
  setFormData,
  handleSubmit,
  clearForm
}) {
  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) clearForm();
      }}
    >
      {/* SAP Add Button */}
      <DialogTrigger asChild>
        <Button
          onClick={clearForm}
          className="
            flex items-center gap-2
            bg-[#0A6ED1] hover:bg-[#085AA5]
            text-white font-semibold 
            px-5 py-2 rounded-lg
            shadow-sm hover:shadow-md
            transition-all
          "
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>

      {/* SAP Dialog */}
      <DialogContent
        className="
          max-w-md rounded-xl shadow-xl
          border border-[#D5E3F4]
          bg-white/90 backdrop-blur-xl
          p-6
        "
      >
        <DialogHeader>
          <DialogTitle className="text-[#0A294F] font-bold tracking-wide">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </DialogTitle>
          <DialogDescription className="text-[#4A6379]">
            {editingCategory
              ? "Update the category details below."
              : "Fill the form to create a new product category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">

          {/* CATEGORY NAME */}
          <CategoryFormField
            label="Category Name *"
            value={formData.category_name}
            onChange={(e) =>
              setFormData({ ...formData, category_name: e.target.value })
            }
            placeholder="Enter category name"
            required
          />

          {/* STATUS SELECT */}
          <StatusSelect
            value={formData.status}
            onChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          />

          {/* ACTION BUTTON */}
          <SubmitButton
            text={editingCategory ? "Update Category" : "Create Category"}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------
    SAP INPUT FIELD
---------------------------------------------------------- */
function CategoryFormField({ label, value, onChange, ...props }) {
  return (
    <div className="space-y-1">
      <Label className="text-[#0A294F] font-medium">{label}</Label>
      <Input
        value={value}
        onChange={onChange}
        className="
          rounded-lg border border-[#C9D7E8]
          focus:ring-2 focus:ring-[#0A6ED1]/40
          transition-all
        "
        {...props}
      />
    </div>
  );
}

/* ----------------------------------------------------------
    SAP STATUS SELECT
---------------------------------------------------------- */
function StatusSelect({ value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-[#0A294F] font-medium">Status</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="
            rounded-lg border border-[#C9D7E8]
            focus:ring-2 focus:ring-[#0A6ED1]/40
          "
        >
          <SelectValue placeholder="Select status" />
        </SelectTrigger>

        <SelectContent className="rounded-lg shadow-lg border border-[#D5E3F4]">
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/* ----------------------------------------------------------
    SAP PRIMARY BUTTON
---------------------------------------------------------- */
function SubmitButton({ text }) {
  return (
    <Button
      type="submit"
      className="
        w-full py-3
        bg-[#0A6ED1] hover:bg-[#085AA5]
        text-white font-semibold
        rounded-lg shadow-md hover:shadow-lg
        transition-all
      "
    >
      {text}
    </Button>
  );
}

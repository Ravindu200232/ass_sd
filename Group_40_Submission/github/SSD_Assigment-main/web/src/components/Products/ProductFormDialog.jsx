import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

/* -----------------------------------------------------------
   SAP FIORI QUARTZ: PRODUCT FORM DIALOG
----------------------------------------------------------- */

export function ProductFormDialog({
  isOpen,
  onOpenChange,
  editingProduct,
  formData,
  onFormChange,
  onSelectChange,
  onSubmit,
  selectedGroups,
  onGroupSelect,
  onRemoveGroup,
  clearForm,
  brands,
  categories,
  typeOptions,
  vehicleGroups,
}) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) clearForm();
      }}
    >
      <DialogContent
        className="
          max-w-2xl w-full
          max-h-[85vh]
          rounded-2xl border border-[#C8DAF5] shadow-xl 
          bg-gradient-to-br from-[#FFFFFF] via-[#F7FAFF] to-[#E7F2FF]
          backdrop-blur-xl p-0 overflow-hidden
        "
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-2 border-b border-[#D8E6FC]">
          <DialogTitle className="text-xl font-semibold text-[#0A294F] flex items-center gap-2">
            {editingProduct ? "Edit Product" : "Add Product"}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[65vh]">
          <ProductForm
            formData={formData}
            editingProduct={editingProduct}
            onFormChange={onFormChange}
            onSelectChange={onSelectChange}
            onSubmit={onSubmit}
            selectedGroups={selectedGroups}
            onGroupSelect={onGroupSelect}
            onRemoveGroup={onRemoveGroup}
            brands={brands}
            categories={categories}
            typeOptions={typeOptions}
            vehicleGroups={vehicleGroups}
            clearForm={clearForm}
            onOpenChange={onOpenChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -----------------------------------------------------------
   SAP FORM CONTENT
----------------------------------------------------------- */

function ProductForm({
  formData,
  editingProduct,
  onFormChange,
  onSelectChange,
  onSubmit,
  selectedGroups,
  onGroupSelect,
  onRemoveGroup,
  brands,
  categories,
  typeOptions,
  vehicleGroups,
  clearForm,
  onOpenChange
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">

      {/* NAME + BRAND */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Product Name *">
          <Input
            required
            value={formData.product_name}
            onChange={(e) => onFormChange("product_name", e.target.value)}
            className="sap-input"
          />
        </FormField>

        <FormField label="Brand">
          <Select
            value={formData.brand_name}
            onValueChange={(v) => onSelectChange("brand_name", v)}
          >
            <SelectTrigger className="sap-select">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.brand_name}>
                  {b.brand_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {/* DESCRIPTION */}
      <FormField label="Description">
        <Textarea
          value={formData.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          rows={3}
          className="sap-input"
        />
      </FormField>

      {/* CATEGORY / TYPE / SIZE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Category">
          <Select
            value={formData.category}
            onValueChange={(v) => onSelectChange("category", v)}
          >
            <SelectTrigger className="sap-select">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.category_name}>
                  {c.category_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Type">
          <Select
            value={formData.type}
            onValueChange={(v) => onSelectChange("type", v)}
          >
            <SelectTrigger className="sap-select">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {typeOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Size">
          <Input
            value={formData.size}
            onChange={(e) => onFormChange("size", e.target.value)}
            className="sap-input"
          />
        </FormField>
      </div>

      {/* VEHICLE GROUPS */}
      <FormField label="Vehicle Groups (Multiple Select)">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedGroups.map((group) => (
            <Badge key={group} className="sap-badge flex items-center gap-1">
              {group}
              <button
                type="button"
                onClick={() => onRemoveGroup(group)}
                className="hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {vehicleGroups.map((group) => (
            <Button
              key={group}
              type="button"
              variant={selectedGroups.includes(group) ? "default" : "outline"}
              className={`sap-chip ${selectedGroups.includes(group) ? "sap-chip-active" : ""}`}
              onClick={() => onGroupSelect(group)}
            >
              {group}
            </Button>
          ))}
        </div>
      </FormField>

      {/* PATTERN / WEIGHT / GROUP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Pattern">
          <Input
            value={formData.pattern}
            onChange={(e) => onFormChange("pattern", e.target.value)}
            className="sap-input"
          />
        </FormField>

        <FormField label="Weight">
          <Input
            value={formData.weight}
            onChange={(e) => onFormChange("weight", e.target.value)}
            className="sap-input"
          />
        </FormField>

        
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            clearForm();
            onOpenChange(false);
          }}
          className="sap-cancel-btn"
        >
          Cancel
        </Button>

        <Button type="submit" className="sap-submit-btn">
          {editingProduct ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

/* -----------------------------------------------------------
   REUSABLE FIELD WRAPPER
----------------------------------------------------------- */

function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[#0A294F] font-medium">{label}</Label>
      {children}
    </div>
  );
}

/* -----------------------------------------------------------
   SAP FIORI UTILITY CLASSES
----------------------------------------------------------- */

const sapStyles = `
.sap-input {
  @apply rounded-lg border border-[#C8D4E9] bg-white focus:ring-2 focus:ring-[#0A6ED1]/40 focus:border-[#0A6ED1] transition-all;
}

.sap-select {
  @apply rounded-lg border border-[#C8D4E9] bg-white focus:ring-2 focus:ring-[#0A6ED1]/40 focus:border-[#0A6ED1];
}

.sap-chip {
  @apply rounded-lg border border-[#C8D4E9] bg-white text-[#0A294F] hover:bg-[#E7F2FF] transition-all;
}

.sap-chip-active {
  @apply bg-[#0A6ED1] text-white shadow-md border-[#0A6ED1];
}

.sap-badge {
  @apply bg-[#E6EDFF] text-[#0A6ED1] border border-[#B7C7F5];
}

.sap-cancel-btn {
  @apply border border-[#D0D7E5] text-[#0A294F] hover:bg-[#F0F4FA];
}

.sap-submit-btn {
  @apply bg-gradient-to-r from-[#0A6ED1] to-[#0854A1] text-white px-5 py-2 rounded-lg shadow-md hover:opacity-90 transition-all;
}
`;

if (typeof document !== "undefined" && !document.getElementById("sap-styles")) {
  const styleEl = document.createElement("style");
  styleEl.id = "sap-styles";
  // V-13: was styleEl.innerHTML = sapStyles. sapStyles is a static string
  // in this file so it was not exploitable, but an innerHTML assignment is
  // the pattern the lint gate now forbids, and textContent is both correct
  // and cheaper for a <style> element.
  styleEl.textContent = sapStyles;
  document.head.appendChild(styleEl);
}

import React from "react";
import CategoryDialog from "./CategoryDialog";

export default function PageHeader({
  isDialogOpen,
  setIsDialogOpen,
  editingCategory,
  formData,
  setFormData,
  handleSubmit,
  clearForm,
}) {
  return (
    <div
      className="
        flex items-center justify-between 
        px-4 py-3 mb-4
        bg-gradient-to-r from-white via-[#F7FAFF] to-[#E7F1FF]
        border border-[#D5E3F4]
        rounded-xl shadow-sm
      "
    >
      {/* LEFT SIDE — TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-[#0A294F] tracking-tight">
          Categories
        </h1>

        <p className="text-sm text-[#6B7A99]">
          Manage product categories
        </p>

        {/* SAP UNDERLINE ACCENT */}
        <div className="h-1 w-16 bg-[#0A6ED1] rounded-full mt-2"></div>
      </div>

      {/* RIGHT SIDE — ADD / EDIT DIALOG */}
      <CategoryDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        editingCategory={editingCategory}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        clearForm={clearForm}
      />
    </div>
  );
}

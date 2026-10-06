import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone } from "lucide-react";

export function DepartmentForm({
  formData,
  setFormData,
  editingDepartment,
  onSubmit,
  onCancel,
  isLoading = false
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">

      {/* NAME FIELD */}
      <div className="space-y-1.5">
        <Label htmlFor="department_name" className="text-[#0A294F] font-medium">
          Department Name *
        </Label>
        <Input
          id="department_name"
          value={formData.department_name}
          onChange={(e) =>
            setFormData({ ...formData, department_name: e.target.value })
          }
          placeholder="e.g., Human Resources, IT Department"
          required
          disabled={isLoading}
          className="
            rounded-lg 
            border-[#C8D7EA] 
            focus:ring-2 
            focus:ring-[#0A6ED1]/40 
            focus:border-[#0A6ED1]
          "
        />
      </div>

      {/* ADDRESS */}
      <div className="space-y-1.5">
        <Label htmlFor="department_address" className="text-[#0A294F] font-medium flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-[#0A6ED1]" />
          Address
        </Label>
        <Textarea
          id="department_address"
          value={formData.department_address}
          onChange={(e) =>
            setFormData({ ...formData, department_address: e.target.value })
          }
          placeholder="Enter department address"
          rows={3}
          disabled={isLoading}
          className="
            rounded-lg 
            border-[#C8D7EA] 
            focus:ring-2 focus:ring-[#0A6ED1]/40 
            focus:border-[#0A6ED1]
          "
        />
      </div>

      {/* CONTACT */}
      <div className="space-y-1.5">
        <Label htmlFor="department_contact" className="text-[#0A294F] font-medium flex items-center gap-1.5">
          <Phone className="h-4 w-4 text-[#0A6ED1]" />
          Contact Information
        </Label>
        <Input
          id="department_contact"
          value={formData.department_contact}
          onChange={(e) =>
            setFormData({ ...formData, department_contact: e.target.value })
          }
          placeholder="e.g., phone number, email"
          disabled={isLoading}
          className="
            rounded-lg 
            border-[#C8D7EA] 
            focus:ring-2 focus:ring-[#0A6ED1]/40 
            focus:border-[#0A6ED1]
          "
        />
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 pt-2">
        
        {/* CANCEL BUTTON - SAP OUTLINE */}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="
            flex-1 
            rounded-lg 
            border-[#C8D7EA]
            text-[#0A294F]
            hover:bg-[#E8F1FC]
            transition-all
          "
        >
          Cancel
        </Button>

        {/* PRIMARY BUTTON - SAP BLUE */}
        <Button
          type="submit"
          disabled={isLoading}
          className="
            flex-1
            rounded-lg
            bg-[#0A6ED1] 
            hover:bg-[#085AA5]
            text-white font-semibold 
            shadow-sm hover:shadow-md
            transition-all
          "
        >
          {editingDepartment ? "Update Department" : "Create Department"}
        </Button>
      </div>
    </form>
  );
}

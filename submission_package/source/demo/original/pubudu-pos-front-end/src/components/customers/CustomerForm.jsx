import React, { useEffect } from "react";
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
import { Lock } from "lucide-react";

export function CustomerForm({
  formData,
  setFormData,
  editingCustomer,
  isEmployee,
  employeeDepartmentId,
  departments,
  onSubmit,
  onReset,
  isLoading = false,
}) {
  useEffect(() => {
    if (isEmployee && employeeDepartmentId && departments.length > 0) {
      setFormData((prev) => ({
        ...prev,
        department_id: String(employeeDepartmentId),
      }));
    }
  }, [isEmployee, employeeDepartmentId, departments, setFormData]);

  const calculateAvailableCredit = () =>
    Math.max(0, formData.credit_limit - formData.credit_balance);

  return (
    <>
      {/* ─────────────────────────────────────────────
         MOBILE-FRIENDLY SCROLL CONTAINER
      ───────────────────────────────────────────── */}
      <div className="max-h-[75vh] overflow-y-auto pr-1">

        <form onSubmit={onSubmit} className="space-y-5 mt-2">

          {/* NAME */}
          <div className="space-y-2">
            <Label>Customer Name *</Label>
            <Input
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
              className="border-blue-500/40 focus-visible:ring-blue-600"
              disabled={isLoading}
            />
          </div>

          {/* NIC */}
          <div className="space-y-2">
            <Label>NIC Number</Label>
            <Input
              value={formData.nic_no}
              onChange={(e) =>
                setFormData({ ...formData, nic_no: e.target.value })
              }
              className="border-blue-500/40 focus-visible:ring-blue-600"
              disabled={isLoading}
            />
          </div>

          {/* DEPARTMENT */}
          <div className="space-y-2">
            <Label>Department</Label>

            <Select
              value={formData.department_id}
              onValueChange={(value) =>
                setFormData({ ...formData, department_id: value })
              }
              disabled={isEmployee || isLoading}
            >
              <SelectTrigger className="border-blue-500/40 focus-visible:ring-blue-600">
                <SelectValue
                  placeholder={
                    isEmployee
                      ? departments.find(
                          (d) => d.id === employeeDepartmentId
                        )?.department_name || "Loading..."
                      : "Select Department"
                  }
                />
              </SelectTrigger>

              {!isEmployee && (
                <SelectContent className="max-h-60">
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.department_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500 text-sm">
                      No departments found
                    </div>
                  )}
                </SelectContent>
              )}
            </Select>

            {isEmployee && (
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                <Lock className="h-3 w-3" />
                Department is locked to your assigned department
              </p>
            )}
          </div>

          {/* PHONE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Phone *</Label>
              <Input
                value={formData.phone_no_01}
                onChange={(e) =>
                  setFormData({ ...formData, phone_no_01: e.target.value })
                }
                disabled={isLoading}
                className="border-blue-500/40 focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Secondary Phone</Label>
              <Input
                value={formData.phone_no_02}
                onChange={(e) =>
                  setFormData({ ...formData, phone_no_02: e.target.value })
                }
                disabled={isLoading}
                className="border-blue-500/40 focus-visible:ring-blue-600"
              />
            </div>
          </div>

          {/* ADDRESS */}
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              rows={3}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              disabled={isLoading}
              className="border-blue-500/40 focus-visible:ring-blue-600"
            />
          </div>

          {/* CREDIT SETTINGS */}
          <div className="border-t pt-4 space-y-4">
            <Label className="text-lg font-semibold text-blue-700">
              Credit Settings
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.credit_enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credit_enabled: e.target.checked,
                    })
                  }
                  disabled={isLoading}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                Enable Credit
              </label>

              <div className="space-y-2">
                <Label>Credit Limit (LKR)</Label>
                <Input
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credit_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={!formData.credit_enabled || isLoading}
                  className="border-blue-500/40 focus-visible:ring-blue-600"
                />
              </div>
            </div>

            {/* Outstanding & Preview */}
            {formData.credit_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Outstanding Balance (LKR)</Label>
                  <Input
                    type="number"
                    value={formData.credit_balance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credit_balance: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    disabled={isLoading}
                    className="border-blue-500/40 focus-visible:ring-blue-600"
                  />

                  <p className="text-xs text-gray-500">
                    Initial outstanding balance
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Available Credit Preview</Label>
                  <div className="p-3 bg-gray-50 rounded border text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Limit:</span>
                      <span>{formData.credit_limit?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding:</span>
                      <span>{formData.credit_balance?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                      <span>Available:</span>
                      <span
                        className={
                          calculateAvailableCredit() < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {calculateAvailableCredit().toLocaleString()}
                      </span>
                    </div>

                    {calculateAvailableCredit() < 0 && (
                      <p className="text-xs text-red-600">
                        ⚠️ Start balance exceeds credit limit
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
            >
              {editingCustomer ? "Update" : "Create"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Clear
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

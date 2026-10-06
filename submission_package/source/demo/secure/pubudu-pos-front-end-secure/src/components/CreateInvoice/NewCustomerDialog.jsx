import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User, CreditCard, Hash, Phone, MapPin, Building, Lock } from "lucide-react";

export default function NewCustomerDialog({
  isCustomerDialogOpen,
  setIsCustomerDialogOpen,
  newCustomer,
  setNewCustomer,
  createCustomer,
  currentUser = {
    id: 0,
    user_code: "CH01",
    full_name: "System User",
    username: "system",
    role: "guest",
    department_id: null,
  },
  departments = [],
  departmentId = "",
  isDepartmentLocked = false
}) {
  
  // Auto-set department based on current user
  useEffect(() => {
    if (isCustomerDialogOpen) {
      // If user is employee and department is locked, use their department
      if (currentUser.role === "employee" && currentUser.department_id) {
        setNewCustomer(prev => ({
          ...prev,
          department_id: String(currentUser.department_id)
        }));
      } 
      // If admin is logged in and has selected a department, use that
      else if (currentUser.role === "admin" && departmentId) {
        setNewCustomer(prev => ({
          ...prev,
          department_id: String(departmentId)
        }));
      }
      // Default to first department if none selected
      else if (departments.length > 0 && !newCustomer.department_id) {
        setNewCustomer(prev => ({
          ...prev,
          department_id: String(departments[0].id)
        }));
      }
    }
  }, [isCustomerDialogOpen, currentUser, departments, departmentId]);

  const getCurrentDepartmentName = () => {
    if (currentUser.role === "employee" && currentUser.department_id) {
      const dept = departments.find(d => d.id === currentUser.department_id);
      return dept ? dept.department_name : "Assigned Department";
    } else if (newCustomer.department_id) {
      const dept = departments.find(d => String(d.id) === newCustomer.department_id);
      return dept ? dept.department_name : "Selected Department";
    }
    return "No Department";
  };

  const getDepartmentAddress = () => {
    if (currentUser.role === "employee" && currentUser.department_id) {
      const dept = departments.find(d => d.id === currentUser.department_id);
      return dept ? dept.department_address : "";
    } else if (newCustomer.department_id) {
      const dept = departments.find(d => String(d.id) === newCustomer.department_id);
      return dept ? dept.department_address : "";
    }
    return "";
  };

  const handleCreate = async () => {
    // Ensure department_id is set before creating
    if (!newCustomer.department_id) {
      toast.error("Please select a department");
      return;
    }
    
    await createCustomer();
  };

  return (
    <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-blue-600" />
            Add New Customer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Department Information */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Department Assignment</span>
              </div>
              {isDepartmentLocked && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <Lock className="h-3 w-3" />
                  <span>Auto-assigned</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <div className="text-xs text-blue-700">Department</div>
                <div className="font-medium text-blue-900">
                  {getCurrentDepartmentName()}
                </div>
              </div>
              
              {getDepartmentAddress() && (
                <div>
                  <div className="text-xs text-blue-700">Address</div>
                  <div className="text-sm text-blue-900">
                    {getDepartmentAddress()}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-blue-600 mt-2">
                {currentUser.role === "employee" ? (
                  "Customer will be assigned to your department automatically"
                ) : (
                  "Customer will be assigned to the selected department"
                )}
              </div>
            </div>
          </div>

          {/* Customer Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4" />
              Personal Information
            </div>
            
            <div>
              <Label className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter customer full name"
                value={newCustomer.customer_name}
                onChange={(e) =>
                  setNewCustomer((p) => ({
                    ...p,
                    customer_name: e.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  NIC Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Enter NIC number"
                    value={newCustomer.nic_no}
                    onChange={(e) =>
                      setNewCustomer((p) => ({
                        ...p,
                        nic_no: e.target.value.toUpperCase(),
                      }))
                    }
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: 123456789V or 199012345678
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Primary Phone <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Enter phone number"
                    value={newCustomer.phone_no_01}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, phone_no_01: e.target.value }))
                    }
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Secondary Phone</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Optional secondary phone"
                  value={newCustomer.phone_no_02}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, phone_no_02: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Address</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                <Textarea
                  placeholder="Enter customer address"
                  rows={3}
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, address: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Credit Settings Section */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <CreditCard className="h-4 w-4 text-green-600" />
              Credit Settings
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="credit_enabled"
                  checked={newCustomer.credit_enabled}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      credit_enabled: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div>
                  <Label htmlFor="credit_enabled" className="text-sm font-medium">
                    Enable Credit Facility
                  </Label>
                  <p className="text-xs text-gray-500">
                    Allow customer to make purchases on credit
                  </p>
                </div>
              </div>

              {newCustomer.credit_enabled && (
                <div className="space-y-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-green-700">
                      Credit Limit (LKR) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newCustomer.credit_limit}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          credit_limit: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum credit amount allowed for this customer
                    </p>
                  </div>

                  <div className="bg-white p-2 rounded border">
                    <div className="text-xs text-gray-600">Credit Balance</div>
                    <div className="font-medium text-green-700">
                      LKR {newCustomer.credit_balance?.toLocaleString() || "0.00"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Initial balance will be set to zero
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation Summary */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-1">
              Required Information
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full ${newCustomer.customer_name?.trim() ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                Customer Full Name
              </li>
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full ${newCustomer.nic_no?.trim() ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                NIC Number
              </li>
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full ${newCustomer.phone_no_01?.trim() ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                Primary Phone Number
              </li>
              <li className="flex items-center">
                <span className={`w-2 h-2 rounded-full ${newCustomer.department_id ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                Department Assignment
              </li>
              {newCustomer.credit_enabled && (
                <li className="flex items-center">
                  <span className={`w-2 h-2 rounded-full ${newCustomer.credit_limit > 0 ? 'bg-green-500' : 'bg-red-500'} mr-2`}></span>
                  Credit Limit
                </li>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleCreate}
              disabled={
                !newCustomer.customer_name?.trim() ||
                !newCustomer.nic_no?.trim() ||
                !newCustomer.phone_no_01?.trim() ||
                !newCustomer.department_id ||
                (newCustomer.credit_enabled && newCustomer.credit_limit <= 0)
              }
            >
              Create Customer
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCustomerDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Fields marked with <span className="text-red-500">*</span> are required
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Lock, Unlock, User } from "lucide-react";

export default function CustomerDepartmentDialog({
  isOpen,
  onClose,
  departments,
  departmentId,
  setDepartmentId,
  customerType,
  setCustomerType,
  customers,
  selectedCustomer,
  customerSearchTerm,
  setCustomerSearchTerm,
  filteredCustomers,
  showCustomerSuggestions,
  setShowCustomerSuggestions,
  handleCustomerSelect,
  clearSelectedCustomer,
  selectedCustomerDetails,
  availableCredit,
  setIsCustomerDialogOpen,
  currentUser,
  isDepartmentLocked
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-blue-500" />
            Customer & Department
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Department Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Department</Label>
              {isDepartmentLocked && (
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            <Select
              value={departmentId}
              onValueChange={(v) => {
                if (!isDepartmentLocked) {
                  setDepartmentId(String(v));
                }
              }}
              disabled={isDepartmentLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.department_name}
                    {currentUser.department_id === d.id &&
                      " (Your Department)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isDepartmentLocked && (
              <div className="text-xs text-gray-500 mt-2">
                Your department is locked based on your employee role
              </div>
            )}
          </div>

          {/* Customer Type Section */}
          <div>
            <Label className="text-sm font-medium">Customer Type</Label>
            <Select value={customerType} onValueChange={setCustomerType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash Sale</SelectItem>
                <SelectItem value="save">Save Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Search Section */}
          {customerType === "save" && (
            <div className="space-y-4">
              <div className="relative">
                <Label className="text-sm font-medium">Search Customer</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, phone, or code..."
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setShowCustomerSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() =>
                      setShowCustomerSuggestions(customerSearchTerm.length > 0)
                    }
                    className="pl-10 pr-10"
                  />
                  {selectedCustomer && (
                    <button
                      onClick={clearSelectedCustomer}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {showCustomerSuggestions && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.customer_code}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {customer.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.phone_no_01} • {customer.customer_code}
                          </div>
                          {customer.credit_enabled && (
                            <div className="text-xs text-green-600 mt-1">
                              Credit: LKR{" "}
                              {customer.credit_limit?.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedCustomerDetails && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900">
                        {selectedCustomerDetails.customer_name}
                      </div>
                      <div className="text-sm text-blue-700">
                        {selectedCustomerDetails.phone_no_01}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {selectedCustomerDetails.customer_code}
                    </Badge>
                  </div>
                  
                  {selectedCustomerDetails.credit_enabled && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Credit Information
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span>Limit:</span>
                        <span className="text-right font-medium">
                          LKR {selectedCustomerDetails.credit_limit?.toLocaleString()}
                        </span>
                        <span>Current Balance:</span>
                        <span className="text-right">
                          LKR {selectedCustomerDetails.credit_balance?.toLocaleString()}
                        </span>
                        <span className="font-medium">Available Credit:</span>
                        <span className="text-right font-medium text-green-600">
                          LKR {availableCredit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setIsCustomerDialogOpen(true);
                  onClose();
                }}
                className="w-full"
              >
                + New Customer
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
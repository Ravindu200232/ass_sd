import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function CustomerDepartmentSection({
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
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-500" />
          Customer & Department
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Department</Label>
          <div className="relative">
            <Select
              value={departmentId}
              onValueChange={(v) => {
                if (!isDepartmentLocked) {
                  setDepartmentId(String(v));
                }
              }}
              disabled={isDepartmentLocked}
            >
              <SelectTrigger className="mt-1">
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
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          {isDepartmentLocked && (
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              Your department is locked based on your employee role
            </div>
          )}
          {!isDepartmentLocked && currentUser.role === "admin" && (
            <div className="text-xs text-blue-500 mt-1 flex items-center">
              <Unlock className="h-3 w-3 mr-1" />
              You can change departments as an admin
            </div>
          )}
        </div>

        <div>
          <Label className="text-sm font-medium">Customer Type</Label>
          <Select value={customerType} onValueChange={setCustomerType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash Sale</SelectItem>
              <SelectItem value="save">Save Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {customerType === "save" && (
          <>
            <div className="relative">
              <Label className="text-sm font-medium">Search Customer</Label>
              <div className="relative mt-1">
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
                      <div className="text-right">
                        <div className="text-xs text-gray-400">
                          {customer.address
                            ? customer.address.substring(0, 20) + "..."
                            : "No address"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showCustomerSuggestions &&
                customerSearchTerm &&
                filteredCustomers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No customers found matching "{customerSearchTerm}"
                  </div>
                )}
            </div>

            {selectedCustomerDetails && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-blue-900">
                    {selectedCustomerDetails.customer_name}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedCustomerDetails.customer_code}
                  </Badge>
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  {selectedCustomerDetails.phone_no_01}
                </div>
                {selectedCustomerDetails.address && (
                  <div className="text-xs text-blue-600 mt-1">
                    {selectedCustomerDetails.address}
                  </div>
                )}
                {selectedCustomerDetails.credit_enabled && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <div className="text-xs font-medium text-gray-700">
                      Credit Information
                    </div>
                    <div className="text-xs text-gray-600 grid grid-cols-2 gap-1">
                      <span>Limit:</span>
                      <span className="text-right">
                        LKR{" "}
                        {selectedCustomerDetails.credit_limit?.toLocaleString()}
                      </span>
                      <span>Current Balance:</span>
                      <span className="text-right">
                        LKR{" "}
                        {selectedCustomerDetails.credit_balance?.toLocaleString()}
                      </span>
                      <span className="font-medium">Available:</span>
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
              onClick={() => setIsCustomerDialogOpen(true)}
              className="w-full"
            >
              + New Customer
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
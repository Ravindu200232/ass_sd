import React from "react";
import { Label } from "@/components/ui/label";
import { Lock, Unlock } from "lucide-react";

export const DepartmentFilter = ({
  departmentFilter,
  setDepartmentFilter,
  setPage,
  departments,
  isDepartmentLocked,
  currentUser
}) => {
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Department</Label>
      <div className="relative">
        <select
          className="w-full border rounded px-3 py-2 text-sm"
          value={departmentFilter}
          onChange={(e) => {
            if (!isDepartmentLocked) {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }
          }}
          disabled={isDepartmentLocked}
        >
          {!isDepartmentLocked && <option value="all">All Departments</option>}
          {departments
            .filter((dept) => dept.id && dept.department_name)
            .map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
                {currentUser.department_id === dept.id && " (Your Department)"}
              </option>
            ))}
        </select>
        {isDepartmentLocked && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
      {isDepartmentLocked && (
        <div className="text-xs text-gray-500 mt-1 flex items-center">
          <Lock className="h-3 w-3 mr-1" />
          Department filter is locked based on your employee role
        </div>
      )}
      {!isDepartmentLocked && currentUser.role === "admin" && (
        <div className="text-xs text-blue-500 mt-1 flex items-center">
          <Unlock className="h-3 w-3 mr-1" />
          You can filter by any department as an admin
        </div>
      )}
    </div>
  );
};
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function DepartmentFilterCard({
  departments,
  selectedDepartment,
  onDepartmentChange,
  onClearFilters,
  hasActiveFilters,
}) {
  const handleValueChange = (value) => {
    onDepartmentChange(value);
  };

  const handleClearFilters = () => {
    onClearFilters();
  };

  return (
    <Card
      className="
        border border-[#D5E3F4] 
        rounded-xl 
        shadow-sm 
        bg-gradient-to-br from-white via-[#F7FAFF] to-[#E7F1FF]
      "
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-[#0A294F] font-bold">
            Department Filter
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        {/* SAP Accent Line */}
        <div className="h-1 w-14 bg-[#0A6ED1] rounded-full mt-1"></div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="font-medium text-[#0A294F] text-sm">
            Select Department
          </label>
          
          <Select
            value={selectedDepartment || "all"}
            onValueChange={handleValueChange}
          >
            <SelectTrigger 
              className="
                rounded-lg 
                border-[#C9D9EE]
                focus:ring-2 focus:ring-[#0A6ED1]/40
                focus:border-[#0A6ED1]
                transition-all
              "
            >
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => {
                // Generate a valid value for each department
                const deptValue = dept.department_id?.toString() || 
                                 dept.id?.toString() || 
                                 dept.department_name || 
                                 `dept-${Math.random().toString(36).substr(2, 9)}`;
                
                const deptName = dept.department_name || dept.name || "Unnamed Department";
                
                return (
                  <SelectItem 
                    key={deptValue}
                    value={deptValue}
                  >
                    {deptName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {selectedDepartment && selectedDepartment !== "all" && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center text-sm text-blue-800">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              <span className="font-medium">
                Filtering by:{" "}
                {(() => {
                  const dept = departments.find(d => {
                    const deptId = d.department_id?.toString();
                    const deptName = d.department_name || d.name;
                    return (
                      deptId === selectedDepartment || 
                      deptName === selectedDepartment ||
                      d.id?.toString() === selectedDepartment
                    );
                  });
                  return dept?.department_name || dept?.name || selectedDepartment;
                })()}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Filter ledger entries by specific department. Select "All Departments" to view all entries.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
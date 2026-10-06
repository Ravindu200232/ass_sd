import React from "react";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

export const UserInfoHeader = ({ currentUser, isDepartmentLocked, getDepartmentName }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800">LIVE STOCK</h2>
      <p className="text-sm text-slate-500">
        Consolidated item-wise inventory from GRNs
      </p>
      <div className="text-xs text-gray-500 mt-1">
        User: {currentUser.full_name} ({currentUser.user_code}) -{" "}
        <Badge 
          variant={currentUser.role === "admin" ? "default" : "secondary"} 
          className="text-xs"
        >
          {currentUser.role === "admin" ? "Administrator" : 
           currentUser.role === "employee" ? "Employee" : "Guest"}
        </Badge>
        {isDepartmentLocked && (
          <span className="ml-2 text-orange-600">
            <Lock className="inline h-3 w-3 mr-1" />
            Department: {getDepartmentName(currentUser.department_id)}
          </span>
        )}
      </div>
    </div>
  );
};
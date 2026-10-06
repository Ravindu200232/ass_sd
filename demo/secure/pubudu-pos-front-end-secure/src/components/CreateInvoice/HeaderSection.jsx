import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Lock, Unlock, Printer } from "lucide-react";

export default function HeaderSection({
  pollingActive,
  draftInvoiceNo,
  currentUser,
  isDepartmentLocked,
  invoiceNo,
  loadDrafts,
  setIsDraftsOpen,
  generateNewInvoiceNumber,
  handleManualPrint,
  handleCreateInvoice
}) {
  return (
    <div
      className="
        w-full 
        bg-white 
        border border-gray-200 
        rounded-xl 
        shadow-sm 
        p-6 
        mb-6
        backdrop-blur-sm 
      "
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* LEFT */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>

          <p className="text-sm text-gray-600 mt-1">
            Add products and services to create invoice
            {pollingActive && draftInvoiceNo && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Tracking: {draftInvoiceNo}
              </span>
            )}
          </p>

          {/* Created By */}
          <div className="text-xs text-gray-500 mt-1">
            Created by: {currentUser.full_name} ({currentUser.user_code}) -{" "}
            <Badge
              variant={currentUser.role === "admin" ? "default" : "secondary"}
              className="text-xs"
            >
              {currentUser.role === "admin"
                ? "Administrator"
                : currentUser.role === "employee"
                ? "Employee"
                : "Guest"}
            </Badge>

            {isDepartmentLocked && (
              <span className="ml-2 text-orange-600">
                <Lock className="inline h-3 w-3 mr-1" />
                Department Locked
              </span>
            )}

            {!isDepartmentLocked && currentUser.role === "admin" && (
              <span className="ml-2 text-blue-600">
                <Unlock className="inline h-3 w-3 mr-1" />
                Admin Access
              </span>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

          {/* Invoice Number Box */}
          <div className="p-2 bg-gray-50 border rounded-lg shadow-sm">
            <div className="text-xs text-gray-500">Receipt No.</div>
            <div className="font-mono font-bold text-gray-900">
              {invoiceNo}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadDrafts();
                setIsDraftsOpen(true);
              }}
            >
              Load Drafts
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={generateNewInvoiceNumber}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              New Invoice No
            </Button>

            <Button
              onClick={handleManualPrint}
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>

            <Button
              onClick={handleCreateInvoice}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

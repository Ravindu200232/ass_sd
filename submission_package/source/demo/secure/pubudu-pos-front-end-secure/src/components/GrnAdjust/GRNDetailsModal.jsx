import React from "react";
import { X, FileText } from "lucide-react";
import { GRNDetailsHeader } from "./GRNDetailsHeader";
import { GRNItemsTable } from "./GRNItemsTable";

export const GRNDetailsModal = ({ selectedGRN, onClose }) => {
  if (!selectedGRN) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-[95%] max-w-7xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                GRN Details – {selectedGRN.grn_code}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Department: {selectedGRN.department?.department_name || "N/A"} | 
                Date: {new Date(selectedGRN.grn_date).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6">
            <GRNDetailsHeader grn={selectedGRN} />
            <GRNItemsTable items={selectedGRN.items} />
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Items: {selectedGRN.total_item}</span>
            <span className="mx-3">•</span>
            <span>Generated: {new Date().toLocaleTimeString()}</span>
          </div>
          
          
        </div>
      </div>
    </div>
  );
};
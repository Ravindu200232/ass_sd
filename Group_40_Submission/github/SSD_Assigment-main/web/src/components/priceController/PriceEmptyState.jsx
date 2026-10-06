// src/pages/PriceManagement/PriceEmptyState.jsx

import React from "react";

export default function PriceEmptyState({ icon: Icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#D5E3F4] p-10 text-center">
      {Icon && (
        <Icon className="w-12 h-12 text-[#C0CADB] mx-auto mb-4" />
      )}
      <p className="text-lg font-semibold text-[#0A294F]">
        No products found
      </p>
      <p className="text-sm text-[#5A6B7A] mt-1">
        Try adjusting your search keywords or filter criteria.
      </p>
    </div>
  );
}

import React from "react";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-64 py-10">
      <div className="text-center">
        <div
          className="
            animate-spin
            h-10 w-10
            rounded-full
            border-4
            border-gray-300
            border-t-[#0A6ED1]        /* SAP Primary Blue */
            shadow-sm
            mx-auto
          "
        ></div>

        <p className="mt-3 text-sm font-medium text-gray-700 tracking-wide">
          Loading, please wait...
        </p>
      </div>
    </div>
  );
}

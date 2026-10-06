import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-64">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-neutral-300 border-t-neutral-900 mx-auto"></div>
        <p className="mt-3 text-neutral-900">Loading Discount Requests...</p>
      </div>
    </div>
  );
}
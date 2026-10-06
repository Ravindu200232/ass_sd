import React from 'react';

export function ReportFooter({ data }) {
  return (
    <div className="border-t border-gray-400 pt-4 mt-8">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="font-semibold mb-2">Prepared By:</p>
          <div className="border-b border-gray-400 pb-8 mb-2">
            <p>Signature: _________________________</p>
            <p>Name: {data.created_by?.full_name || `User ID: ${data.grn_by}`}</p>
            <p>Date: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2">Authorized By:</p>
          <div className="border-b border-gray-400 pb-8 mb-2">
            <p>Signature: _________________________</p>
            <p>Name: _________________________</p>
            <p>Date: _________________________</p>
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-600 mt-4">
        <p>This is an official document of COMPANY NAME LTD. Unauthorized reproduction or distribution is prohibited.</p>
        <p className="mt-1">Document Generated on: {new Date().toLocaleString('en-GB')}</p>
        <p className="mt-1">Page 1 of 1</p>
      </div>
    </div>
  );
}
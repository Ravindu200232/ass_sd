import React from 'react';

export function CompanyHeader() {
  return (
    <div className="text-center border-b border-gray-400 pb-4 mb-6">
      <h1 className="text-3xl font-bold uppercase tracking-wider">COMPANY NAME LTD</h1>
      <p className="text-lg mt-2">123 Business Street, City, Country</p>
      <p className="text-md">Tel: +94 11 123 4567 | Email: info@company.com</p>
    </div>
  );
}
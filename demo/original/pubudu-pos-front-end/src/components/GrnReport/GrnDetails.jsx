import React from 'react';

export function GrnDetails({ data }) {
  return (
    <div className="mb-8">
      <table className="w-full border-collapse border border-gray-400 mb-4">
        <tbody>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold w-1/4">GRN Number</td>
            <td className="border border-gray-400 p-3 w-1/4">{data.grn_code}</td>
            <td className="border border-gray-400 p-3 font-semibold w-1/4">GRN Date</td>
            <td className="border border-gray-400 p-3 w-1/4">
              {new Date(data.grn_date).toLocaleDateString('en-GB')}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold">Department</td>
            <td className="border border-gray-400 p-3">
              {data.department?.department_name || 'N/A'}
            </td>
            <td className="border border-gray-400 p-3 font-semibold">Department Code</td>
            <td className="border border-gray-400 p-3">
              {data.department?.department_code || 'N/A'}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold">Prepared By</td>
            <td className="border border-gray-400 p-3">
              {data.created_by?.full_name || `User ID: ${data.grn_by}`}
            </td>
            <td className="border border-gray-400 p-3 font-semibold">User Code</td>
            <td className="border border-gray-400 p-3">
              {data.created_by?.user_code || 'N/A'}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-400 p-3 font-semibold">NIC Number</td>
            <td className="border border-gray-400 p-3">
              {data.created_by?.nic_no || 'N/A'}
            </td>
            <td className="border border-gray-400 p-3 font-semibold">Total Items</td>
            <td className="border border-gray-400 p-3">{data.total_item}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
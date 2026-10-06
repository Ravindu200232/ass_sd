import React from "react";

export default function LedgerTable({ ledger }) {
  const totals = calculateTotals(ledger);
  const finalRow = ledger.length > 0 ? ledger[ledger.length - 1] : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border-collapse rounded-xl overflow-hidden shadow-sm bg-white border border-gray-200">
        <LedgerTableHeader />
        <LedgerTableBody ledger={ledger} />
        <tfoot>
          <tr className="bg-gray-50 font-bold text-sm text-gray-800 border-t-2 border-gray-300">
            <td className="p-3 text-right border" colSpan="4">
              TOTAL
            </td>
            <td className="p-3 text-green-700 border text-right">
              {totals.debitQty.toLocaleString()}
            </td>
            <td className="p-3 text-green-700 border text-right">
              Rs. {totals.debitAmount.toLocaleString()}
            </td>
            <td className="p-3 text-red-700 border text-right">
              {totals.creditQty.toLocaleString()}
            </td>
            <td className="p-3 text-red-700 border text-right">
              Rs. {totals.creditAmount.toLocaleString()}
            </td>
            <td className="p-3 text-gray-800 border text-right font-bold">
              {finalRow?.balance_qty?.toLocaleString() || "0"}
            </td>
            <td className="p-3 text-gray-800 border text-right font-bold">
              Rs. {finalRow?.balance_amount?.toLocaleString() || "0"}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function LedgerTableHeader() {
  const headers = [
    "Date",
    "Ref",
    "Type",
    "Department",
    "Debit Qty",
    "Debit Amount",
    "Credit Qty",
    "Credit Amount",
    "Balance Qty",
    "Balance Amount",
  ];

  return (
    <thead className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800 font-semibold text-sm">
      <tr>
        {headers.map((header, index) => (
          <th
            key={index}
            className={`p-3 border-b border-blue-200 text-left ${
              index === 4 || index === 5
                ? "text-green-700"
                : index === 6 || index === 7
                ? "text-red-700"
                : ""
            }`}
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function LedgerTableBody({ ledger }) {
  return (
    <tbody className="text-sm">
      {ledger.map((row, index) => (
        <LedgerTableRow key={index} row={row} />
      ))}
    </tbody>
  );
}

function LedgerTableRow({ row }) {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <tr className={`hover:bg-gray-50 ${row.isOpening ? "bg-yellow-50" : ""}`}>
      <td className="p-3 border-b border-gray-200">
        {row.isOpening ? (
          <span className="font-semibold text-orange-700">Opening Balance</span>
        ) : (
          formatDate(row.date)
        )}
      </td>
      <td className="p-3 border-b border-gray-200 font-mono text-xs">
        {row.reference}
      </td>
      <td className="p-3 border-b border-gray-200">
        <TypeBadge type={row.type} isOpening={row.isOpening} />
      </td>
      <td className="p-3 border-b border-gray-200">
        {row.department}
      </td>
      <td className="p-3 border-b border-gray-200 text-green-700 text-right font-medium">
        {row.debit_qty > 0 ? row.debit_qty.toLocaleString() : "-"}
      </td>
      <td className="p-3 border-b border-gray-200 text-green-700 text-right font-medium">
        {row.debit_amount > 0 ? `Rs. ${row.debit_amount.toLocaleString()}` : "-"}
      </td>
      <td className="p-3 border-b border-gray-200 text-red-700 text-right font-medium">
        {row.credit_qty > 0 ? row.credit_qty.toLocaleString() : "-"}
      </td>
      <td className="p-3 border-b border-gray-200 text-red-700 text-right font-medium">
        {row.credit_amount > 0 ? `Rs. ${row.credit_amount.toLocaleString()}` : "-"}
      </td>
      <td className="p-3 border-b border-gray-200 text-right font-bold">
        {row.balance_qty?.toLocaleString() || "0"}
      </td>
      <td className="p-3 border-b border-gray-200 text-right font-bold">
        Rs. {row.balance_amount?.toLocaleString() || "0"}
      </td>
    </tr>
  );
}

function TypeBadge({ type, isOpening }) {
  if (isOpening) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Opening
      </span>
    );
  }

  switch (type) {
    case "GRN":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          GRN
        </span>
      );
    case "Issue":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Issue
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {type}
        </span>
      );
  }
}

function calculateTotals(ledger) {
  // Skip opening balance row for totals
  const transactionRows = ledger.filter(row => !row.isOpening);
  
  return {
    debitQty: transactionRows.reduce((sum, row) => sum + (row.debit_qty || 0), 0),
    creditQty: transactionRows.reduce((sum, row) => sum + (row.credit_qty || 0), 0),
    debitAmount: transactionRows.reduce((sum, row) => sum + (row.debit_amount || 0), 0),
    creditAmount: transactionRows.reduce((sum, row) => sum + (row.credit_amount || 0), 0),
  };
}
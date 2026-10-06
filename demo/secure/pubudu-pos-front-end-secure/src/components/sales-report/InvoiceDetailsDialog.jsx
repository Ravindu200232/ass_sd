import React from "react";
import { Printer, XCircle } from "lucide-react";

export const InvoiceDetailsDialog = ({
  isOpen,
  onClose,
  selectedInvoice,
  getServiceDisplay,
  getProductDetails,
  getPaymentBreakdown,
  getStatusBadge,
  onPrintReceipt,
  onCancelInvoice,
  isAdmin,
}) => {
  if (!selectedInvoice || !isOpen) return null;

  const paymentBreakdown = getPaymentBreakdown(selectedInvoice);

  // Helper function for badge styling
  const getBadgeStyle = (status) => {
    const styles = {
      paid: "bg-green-100 text-green-800",
      partial: "bg-yellow-100 text-yellow-800",
      unpaid: "bg-red-100 text-red-800",
      credit: "bg-blue-100 text-blue-800",
      card: "bg-purple-100 text-purple-800",
      cash: "bg-green-100 text-green-800",
      bankslip: "bg-gray-100 text-gray-800",
      default: "bg-gray-100 text-gray-800",
    };
    return styles[status] || styles.default;
  };

  const getStatusText = (status) => {
    const statusMap = {
      paid: "Paid",
      partial: "Partial",
      unpaid: "Unpaid",
      credit: "Credit",
      card: "Card",
      cash: "Cash",
      bankslip: "Bank Slip",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Invoice Details</h2>
              <p className="text-blue-100 mt-1">
                {selectedInvoice.inv_no} • {selectedInvoice.inv_date}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-6">
            {/* Customer Info Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Customer Name</p>
                  <p className="text-gray-900 font-medium">
                    {selectedInvoice.customer?.customer_name || "Walk-in Customer"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Phone</p>
                  <p className="text-gray-900">
                    {selectedInvoice.customer?.phone_no_01 || "N/A"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 font-medium">Address</p>
                  <p className="text-gray-900">
                    {selectedInvoice.customer?.address || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Department</p>
                  <p className="text-gray-900">
                    {selectedInvoice.department?.department_name || "Unknown"}
                    {selectedInvoice.department?.department_address && (
                      <span className="text-sm text-gray-500 block">
                        {selectedInvoice.department.department_address}
                      </span>
                    )}
                    {selectedInvoice.department?.department_contact && (
                      <span className="text-sm text-gray-500 block">
                        Tel: {selectedInvoice.department.department_contact}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Invoice Type</p>
                  <p className="text-gray-900">
                    {selectedInvoice.type === "tire"
                      ? "Tire"
                      : selectedInvoice.type === "other"
                      ? "Service"
                      : selectedInvoice.type === "tire and other"
                      ? "Tire + Service"
                      : selectedInvoice.type || "Not Specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Service</p>
                  <p className="text-gray-900">{getServiceDisplay(selectedInvoice)}</p>
                </div>
                {selectedInvoice.customer?.credit_enabled && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Credit Limit</p>
                      <p className="text-gray-900 font-medium">
                        LKR {selectedInvoice.customer?.credit_limit?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Credit Balance</p>
                      <p className="text-gray-900 font-medium">
                        LKR {selectedInvoice.customer?.credit_balance?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-gray-600 font-medium">Created By</p>
                  <p className="text-gray-900">
                    {selectedInvoice.created_by?.full_name || selectedInvoice.inv_by || "System"}
                    {selectedInvoice.created_by?.user_code && (
                      <span className="text-sm text-gray-500 block">
                        ({selectedInvoice.created_by.user_code})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Items Section */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Invoice Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Product
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Category
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Brand
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Qty
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Unit Price
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Discount
                      </th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b border-gray-300">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, index) => {
                      const productDetails = getProductDetails(item);
                      const total = (item.selling_price - item.discount) * item.qty;
                      return (
                        <tr
                          key={index}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 transition-colors`}
                        >
                          <td className="p-3 border-b border-gray-200">
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.product_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.product_code}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 border-b border-gray-200 text-gray-700">
                            {productDetails.category}
                          </td>
                          <td className="p-3 border-b border-gray-200 text-gray-700">
                            {productDetails.brand}
                          </td>
                          <td className="p-3 border-b border-gray-200 text-gray-700">
                            {item.qty}
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            <span className="text-gray-900 font-medium">
                              LKR {item.selling_price?.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            {item.discount > 0 ? (
                              <span className="text-red-600 font-medium">
                                -LKR {item.discount?.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            <span className="text-gray-900 font-bold">
                              LKR {total?.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Summary Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                Invoice Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Amount:</span>
                  <span className="text-gray-900 font-medium">
                    LKR {selectedInvoice.total_amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Discount:</span>
                  <span className="text-red-600 font-medium">
                    -LKR {selectedInvoice.total_discount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                  <span className="text-lg font-bold text-gray-900">Net Total:</span>
                  <span className="text-xl font-bold text-blue-700">
                    LKR {selectedInvoice.net_total?.toLocaleString()}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Cash Paid:
                    </span>
                    <span className="text-gray-900 font-medium">
                      LKR {paymentBreakdown.cashPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      Credit Paid:
                    </span>
                    <span className="text-gray-900 font-medium">
                      LKR {paymentBreakdown.creditPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Total Paid:</span>
                    <span className="font-semibold text-green-700">
                      LKR {paymentBreakdown.totalPaid.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Balance:</span>
                    <span className={`font-semibold ${paymentBreakdown.balance > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                      {paymentBreakdown.balance > 0 ? 'Due: ' : ''}
                      LKR {Math.abs(paymentBreakdown.balance).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-300 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Payment Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeStyle(
                        selectedInvoice.payment_status
                      )}`}
                    >
                      {getStatusText(selectedInvoice.payment_status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Payment Method:</span>
                    <span className="text-gray-900 font-medium capitalize">
                      {selectedInvoice.payment_status}
                    </span>
                  </div>
                  <div className="md:col-span-2 flex justify-between items-center">
                    <span className="text-gray-700">Invoice Created:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(selectedInvoice.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          {/* Left — Cancel Invoice (admin only) */}
          <div>
            {isAdmin && selectedInvoice.type !== "cancel" && (
              <button
                onClick={() => onCancelInvoice(selectedInvoice)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <XCircle className="h-4 w-4" />
                Cancel Invoice
              </button>
            )}
            {selectedInvoice.type === "cancel" && (
              <span className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg font-bold text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                INVOICE CANCELLED
              </span>
            )}
          </div>

          {/* Right — Print + Close */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPrintReceipt(selectedInvoice)}
              className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
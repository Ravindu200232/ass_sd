import React from 'react';
import { toast } from 'sonner';

// Constants
const SHOP_NAME = "PUBUDU TYRE HOUSE";
const SHOP_ADDRESS = "No: 45, Kandy Road, Kurunegala";
const SHOP_PHONE = "071 123 4567";

export const PdfGenerator = {
  // Generate thermal receipt for individual invoice
  generateThermalReceipt: (invoice, departments, getServiceDisplay, getPaymentBreakdown) => {
    try {
      if (!invoice) {
        toast.error('No invoice data available');
        return;
      }

      const department = departments?.find(d => d.id === invoice.department_id);
      const departmentName = department ? department.department_name : "Main Branch";
      const departmentAddress = department?.department_address || "";
      const departmentContact = department?.department_contact || "";

      const customerName = invoice.customer?.customer_name || "Cash Sale";
      const customerPhone = invoice.customer?.phone_no_01 || "";

      const invoiceDate = invoice.inv_date || new Date().toISOString().split('T')[0];
      const formattedDate = new Date(invoiceDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const formattedTime = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const paymentBreakdown = getPaymentBreakdown(invoice);
      const serviceDisplay = getServiceDisplay(invoice);

      const totalAmount = invoice.total_amount || 0;
      const totalDiscount = invoice.total_discount || 0;
      const netTotal = invoice.net_total || 0;

      let cashPaid = paymentBreakdown.cashPaid || 0;
      let creditPaid = paymentBreakdown.creditPaid || 0;
      let balance = paymentBreakdown.balance || 0;
      let balanceLabel = balance > 0 ? "Due" : "Balance";

      const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${invoice.inv_no}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
    }

    body {
      width: 80mm;
      margin: 0;
      padding: 6mm;
      font-family: "Courier New", monospace;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.45;
      color: #000;
    }

    .center { text-align: center; }

    .header {
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .shop-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }

    .dept {
      font-size: 12px;
      font-weight: 600;
      margin-top: 3px;
    }

    .info {
      font-size: 13px;
      font-weight: 700;
      margin: 6px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    th {
      font-size: 13px;
      font-weight: 700;
      border-bottom: 1px dashed #000;
      padding-bottom: 4px;
      text-align: left;
    }

    td {
      font-size: 14px;
      font-weight: 700;
      padding: 3px 0;
      vertical-align: top;
    }

    .qty { 
      width: 12mm; 
      text-align: center; 
      padding-right: 2mm;
    }
    .desc { 
      width: 44mm; 
      padding-right: 2mm;
      word-wrap: break-word;
    }
    .amt { 
      width: 18mm; 
      text-align: right; 
    }

    .item-name {
      font-weight: 700;
      font-size: 14px;
    }
    
    .item-desc {
      font-size: 12px;
      font-weight: 600;
      color: #555;
      line-height: 1.3;
      margin-top: 1px;
      word-wrap: break-word;
    }

    .totals {
      margin-top: 10px;
      border-top: 1px dashed #000;
      padding-top: 8px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-weight: 700;
    }

    .grand {
      font-size: 16px;
      font-weight: 900;
      border-top: 2px solid #000;
      padding-top: 6px;
      margin-top: 6px;
    }

    .barcode {
      font-family: "Libre Barcode 39", monospace;
      font-size: 32px;
      text-align: center;
      margin: 14px 0;
      font-weight: 400;
    }

    .footer {
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 8px;
      line-height: 1.4;
    }

    .credit-section {
      background-color: #f0f0f0;
      padding: 4px;
      margin: 5px 0;
      border-radius: 2px;
      font-size: 12px;
    }
    
    .payment-method {
      font-size: 12px;
      font-weight: 700;
      text-align: center;
      margin: 4px 0;
      padding: 3px;
      background-color: #f5f5f5;
      border-radius: 2px;
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
</head>
<body>

  <div class="header center">
    <div class="shop-name">${SHOP_NAME}</div>
    <div class="dept">${departmentName}</div>
    ${departmentAddress ? `<div class="dept">${departmentAddress}</div>` : ""}
    ${departmentContact ? `<div class="dept">Tel: ${departmentContact}</div>` : ""}
  </div>

  <div class="info center">
    <div>Invoice No: ${invoice.inv_no}</div>
    <div>${formattedDate} ${formattedTime}</div>
  </div>

  <div class="info center">
    Cashier: ${invoice.inv_by || "System"}
  </div>

  ${customerName !== "Cash Sale" ? `
    <div class="info">
      CUSTOMER: ${customerName}<br/>
      ${customerPhone ? `Tel: ${customerPhone}` : ""}
    </div>
  ` : ""}

  ${serviceDisplay ? `
    <div class="info">
      Service: ${serviceDisplay}
    </div>
  ` : ""}

  <div class="payment-method">
    ${invoice.payment_status ? invoice.payment_status.toUpperCase() : 'PAID'}
  </div>

  ${creditPaid > 0 ? `
    <div class="credit-section">
      <div><strong>CREDIT PAYMENT</strong></div>
      <div>Credit Used: Rs.${creditPaid.toFixed(2)}</div>
    </div>
  ` : ""}

  <table>
    <thead>
      <tr>
        <th class="qty">QTY</th>
        <th class="desc">ITEM</th>
        <th class="amt">AMT</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items?.map(item => `
        <tr>
          <td class="qty">${item.qty || 1}</td>
          <td class="desc">
            <div class="item-desc">${item.product_name || item.description}</div>
            ${item.product_code ? `<div style="font-size: 11px;">Code: ${item.product_code}</div>` : ''}
          </td>
          <td class="amt">Rs.${((item.selling_price || 0) * (item.qty || 1)).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span>Sub Total</span>
      <span>Rs.${totalAmount.toFixed(2)}</span>
    </div>

    ${totalDiscount > 0 ? `
    <div class="row">
      <span>Discount</span>
      <span>-Rs.${totalDiscount.toFixed(2)}</span>
    </div>
    ` : ""}

    <div class="row grand">
      <span>TOTAL</span>
      <span>Rs.${netTotal.toFixed(2)}</span>
    </div>
  </div>

  <div class="info">
    ${creditPaid > 0 ? `
      <div class="row">
        <span>Credit Used</span>
        <span>Rs.${creditPaid.toFixed(2)}</span>
      </div>
    ` : ""}
    
    <div class="row">
      <span>Cash Paid</span>
      <span>Rs.${cashPaid.toFixed(2)}</span>
    </div>
    
    <div class="row">
      <span>${balanceLabel}</span>
      <span>${balanceLabel === "Due" ? "(Rs." : "Rs."}${Math.abs(balance).toFixed(2)}${balanceLabel === "Due" ? ")" : ""}</span>
    </div>
  </div>

  ${invoice.note ? `
  <div style="font-size: 11px; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #ccc;">
    <div><strong>Note:</strong></div>
    <div>${invoice.note}</div>
  </div>
  ` : ''}

  <div class="barcode">
    *${invoice.inv_no.replace(/-/g, "")}*
  </div>

  <div class="footer">
    THANK YOU FOR YOUR BUSINESS!<br/>
    Goods once sold cannot be returned<br/>
    ${SHOP_ADDRESS}<br/>
    Tel: ${SHOP_PHONE}
  </div>

</body>
</html>
`;

      const printWindow = window.open("", "_blank", "width=400,height=650");
      if (!printWindow) {
        toast.error("Popup blocked. Allow popups to print receipt.");
        return;
      }

      printWindow.document.write(receiptHTML);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 800);
      }, 400);

      toast.success(`Receipt for invoice ${invoice.inv_no} printed!`);
      
    } catch (error) {
      console.error('Error generating thermal receipt:', error);
      toast.error('Error generating receipt');
    }
  },

  // Generate sales report thermal receipt
  generateSalesReportReceipt: (salesData, filters, departments, currentUser, getServiceDisplay, getDepartmentName) => {
    try {
      if (!salesData) {
        toast.error('No data available for the selected filters');
        return;
      }

      const currentDepartment = departments?.find(d => 
        String(d.id) === (filters.departmentFilter || '')
      );

      const departmentName = currentDepartment?.department_name || "All Departments";
      const departmentAddress = currentDepartment?.department_address || "";
      const departmentContact = currentDepartment?.department_contact || "";

      const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Sales Report</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
    }

    body {
      width: 80mm;
      margin: 0;
      padding: 6mm;
      font-family: "Courier New", monospace;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.45;
      color: #000;
    }

    .center { text-align: center; }

    .header {
      border-bottom: 1px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .shop-name {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }

    .report-title {
      font-size: 16px;
      font-weight: 900;
      margin: 8px 0;
      text-align: center;
    }

    .section {
      margin: 10px 0;
      padding-top: 8px;
      border-top: 1px dashed #000;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      font-weight: 700;
    }

    .highlight {
      font-size: 15px;
      font-weight: 900;
      background-color: #f0f0f0;
      padding: 3px;
      margin: 5px 0;
    }

    .summary-box {
      border: 2px solid #000;
      padding: 8px;
      margin: 10px 0;
    }

    .footer {
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 8px;
      line-height: 1.4;
    }
  </style>
</head>
<body>

  <div class="header center">
    <div class="shop-name">${SHOP_NAME}</div>
    <div>Sales Report</div>
    <div>${departmentName}</div>
    ${departmentAddress ? `<div>${departmentAddress}</div>` : ""}
    ${departmentContact ? `<div>Tel: ${departmentContact}</div>` : ""}
  </div>

  <div class="center">
    <div>Generated: ${new Date().toLocaleDateString()}</div>
    <div>By: ${currentUser.full_name} (${currentUser.role})</div>
  </div>

  ${filters.fromDate && filters.toDate ? `
    <div class="center">
      <div>Period: ${new Date(filters.fromDate).toLocaleDateString()} to ${new Date(filters.toDate).toLocaleDateString()}</div>
    </div>
  ` : ''}

  <div class="summary-box">
    <div class="row highlight">
      <span>TOTAL REVENUE</span>
      <span>Rs.${(salesData.total_revenue || 0).toFixed(2)}</span>
    </div>
    <div class="row">
      <span>Total Invoices</span>
      <span>${salesData.total_invoices || 0}</span>
    </div>
    <div class="row">
      <span>Cash Collected</span>
      <span>Rs.${(salesData.cash_collected || 0).toFixed(2)}</span>
    </div>
    <div class="row">
      <span>Credit Given</span>
      <span>Rs.${(salesData.credit_given || 0).toFixed(2)}</span>
    </div>
  </div>

  ${salesData.type_breakdown?.length > 0 ? `
    <div class="section">
      <div class="report-title">BY INVOICE TYPE</div>
      ${salesData.type_breakdown.map(item => `
        <div class="row">
          <span>${item.type || 'Other'}</span>
          <span>Rs.${(item.revenue || 0).toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${salesData.service_breakdown?.length > 0 ? `
    <div class="section">
      <div class="report-title">BY SERVICE</div>
      ${salesData.service_breakdown.map(item => `
        <div class="row">
          <span>${item.service || 'Other'}</span>
          <span>Rs.${(item.revenue || 0).toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
  ` : ''}

  <div class="footer">
    End of Report<br/>
    ${SHOP_NAME}<br/>
    ${new Date().toLocaleString()}
  </div>

</body>
</html>
`;

      const printWindow = window.open("", "_blank", "width=400,height=650");
      if (!printWindow) {
        toast.error("Popup blocked. Allow popups to print report.");
        return;
      }

      printWindow.document.write(reportHTML);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 800);
      }, 400);

      toast.success('Sales report printed!');
      
    } catch (error) {
      console.error('Error generating sales report receipt:', error);
      toast.error('Error generating sales report');
    }
  },

  // Generate a test receipt (for debugging)
  generateTestReceipt: () => {
    try {
      const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Receipt</title>
  <style>
    @media print {
      @page { size: 80mm auto; margin: 0; }
    }
    body { 
      width: 80mm; 
      margin: 0; 
      padding: 6mm; 
      font-family: "Courier New", monospace; 
      font-size: 14px; 
      font-weight: 700; 
    }
    .center { text-align: center; }
  </style>
</head>
<body>
  <div class="center">
    <h3>${SHOP_NAME}</h3>
    <p>Test Receipt</p>
    <p>Date: ${new Date().toLocaleDateString()}</p>
    <p>Time: ${new Date().toLocaleTimeString()}</p>
    <hr>
    <p>If you see this, receipt printing is working!</p>
    <hr>
    <p>${SHOP_ADDRESS}</p>
    <p>Tel: ${SHOP_PHONE}</p>
  </div>
</body>
</html>
`;

      const printWindow = window.open("", "_blank", "width=400,height=400");
      if (!printWindow) {
        toast.error("Popup blocked. Allow popups to print test receipt.");
        return false;
      }

      printWindow.document.write(testHTML);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 800);
      }, 400);

      toast.success('Test receipt printed successfully!');
      return true;
      
    } catch (error) {
      console.error('Error generating test receipt:', error);
      toast.error('Error generating test receipt');
      return false;
    }
  }
};

export default PdfGenerator;
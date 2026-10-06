import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PDFGenerator = {
  SHOP_NAME: "PUBUDU TYRE HOUSE",
  SHOP_ADDRESS: "No: 45, Kandy Road, Kurunegala",
  SHOP_PHONE: "071 123 4567",

  generatePDF(profitData, fromDate, toDate, departmentFilter, departments, typeFilter, paymentStatusFilter, getDepartmentName) {
    if (!profitData) {
      throw new Error('No data available for the selected filters');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 30, "F");
    
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("PROFIT & LOSS REPORT", pageWidth / 2, 12, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(this.SHOP_NAME, pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(8);
    doc.text(`${this.SHOP_ADDRESS} | Tel: ${this.SHOP_PHONE}`, pageWidth / 2, 25, { align: "center" });

    // Period
    let y = 38;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Period: ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
    y += 8;

    // Filter information
    let filterInfo = [];
    if (departmentFilter !== 'all') {
      const dept = departments.find(d => String(d.id) === departmentFilter);
      if (dept) filterInfo.push(`Department: ${dept.department_name}`);
    }
    if (typeFilter !== 'all') {
      const typeText = typeFilter === 'tire' ? 'Tire ' : 
                      typeFilter === 'tire and other' ? 'Tire + Service' : 
                      'Other Service';
      filterInfo.push(`Type: ${typeText}`);
    }
    if (paymentStatusFilter !== 'all') filterInfo.push(`Payment: ${paymentStatusFilter}`);
    
    if (filterInfo.length > 0) {
      doc.setFontSize(7);
      doc.text(`Filters: ${filterInfo.join(', ')}`, pageWidth / 2, y, { align: "center" });
      y += 6;
    }

    y += 4;

    // Summary Section
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("PROFIT SUMMARY", margin, y);
    y += 8;

    // Summary Box
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 3, 3, 'F');
    
    const summaryY = y + 10;
    
    // Revenue
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("TOTAL REVENUE:", margin + 10, summaryY);
    doc.setFont(undefined, "bold");
    doc.text(`LKR ${profitData.summary.total_revenue.toLocaleString()}`, pageWidth - margin - 10, summaryY, { align: "right" });
    
    // Cost
    doc.setFont(undefined, "normal");
    doc.text("TOTAL COST:", margin + 10, summaryY + 8);
    doc.setFont(undefined, "bold");
    doc.text(`LKR ${profitData.summary.total_cost.toLocaleString()}`, pageWidth - margin - 10, summaryY + 8, { align: "right" });
    
    // Profit Line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin + 10, summaryY + 12, pageWidth - margin - 10, summaryY + 12);
    
    // Profit
    const profit = profitData.summary.total_profit;
    const profitColor = profit >= 0 ? [0, 128, 0] : [255, 0, 0];
    
    doc.setTextColor(...profitColor);
    doc.text(profit >= 0 ? "TOTAL PROFIT:" : "TOTAL LOSS:", margin + 10, summaryY + 20);
    doc.text(`LKR ${Math.abs(profit).toLocaleString()}`, pageWidth - margin - 10, summaryY + 20, { align: "right" });
    
    // Margin
    doc.setFontSize(9);
    doc.text(`Profit Margin: ${profitData.summary.profit_margin}%`, margin + 10, summaryY + 28);
    
    // Statistics
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text(`Invoices: ${profitData.summary.total_invoices}`, margin + 10, summaryY + 36);
    doc.text(`GRNs: ${profitData.summary.total_grns}`, pageWidth / 2, summaryY + 36);
    doc.text(`Cash Collected: LKR ${profitData.summary.cash_collected.toLocaleString()}`, pageWidth - margin - 10, summaryY + 36, { align: "right" });

    y += 70;

    // Profit by Type
    if (profitData.profit_by_type?.length > 0) {
      this.addProfitByTypeTable(doc, y, margin, pageWidth, profitData);
      y = doc.lastAutoTable.finalY + 10;
    }

    // Department Breakdown
    if (profitData.profit_by_department?.length > 0) {
      this.addDepartmentTable(doc, y, margin, pageWidth, profitData, getDepartmentName);
      y = doc.lastAutoTable.finalY + 10;
    }

    // Add new page for detailed data if needed
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    // Invoices Table
    if (profitData.invoices?.length > 0) {
      this.addInvoicesTable(doc, y, margin, pageWidth, profitData);
      y = doc.lastAutoTable.finalY + 10;
    }

    // GRNs Table
    if (profitData.grns?.length > 0) {
      if (y > 200) {
        doc.addPage();
        y = margin;
      }
      this.addGrnsTable(doc, y, margin, pageWidth, profitData, getDepartmentName);
    }

    return doc;
  },

  addProfitByTypeTable(doc, y, margin, pageWidth, profitData) {
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("PROFIT BY SERVICE TYPE", margin, y);
    y += 8;

    const typeHeaders = [['Service Type', 'Invoices', 'Revenue', 'Cost', 'Profit', 'Margin']];
    const typeRows = profitData.profit_by_type.map(type => [
      type.type,
      type.invoice_count.toString(),
      `LKR ${type.revenue.toLocaleString()}`,
      `LKR ${type.cost.toLocaleString()}`,
      `LKR ${type.profit.toLocaleString()}`,
      `${type.margin}%`
    ]);

    autoTable(doc, {
      startY: y,
      head: typeHeaders,
      body: typeRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
  },

  addDepartmentTable(doc, y, margin, pageWidth, profitData, getDepartmentName) {
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("PROFIT BY DEPARTMENT", margin, y);
    y += 8;

    const deptHeaders = [['Department', 'Invoices', 'GRNs', 'Revenue', 'Cost', 'Profit']];
    const deptRows = profitData.profit_by_department.map(dept => [
      dept.department_name,
      dept.invoice_count.toString(),
      dept.grn_count.toString(),
      `LKR ${dept.revenue.toLocaleString()}`,
      `LKR ${dept.cost.toLocaleString()}`,
      `LKR ${dept.profit.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: y,
      head: deptHeaders,
      body: deptRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    });
  },

  addInvoicesTable(doc, y, margin, pageWidth, profitData) {
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("INVOICE DETAILS", margin, y);
    y += 8;

    const invHeaders = [['Invoice No', 'Date', 'Type', 'Customer', 'Net Total', 'Status']];
    const invRows = profitData.invoices.map(inv => [
      inv.inv_no,
      new Date(inv.inv_date).toLocaleDateString(),
      inv.type === 'tire' ? 'Tire ' : 
      inv.type === 'tire and other' ? 'Tire + Service' : 
      'Other Service',
      inv.customer?.customer_name || inv.customer_code || 'Cash Sale',
      `LKR ${(inv.net_total || 0).toLocaleString()}`,
      inv.payment_status
    ]);

    autoTable(doc, {
      startY: y,
      head: invHeaders,
      body: invRows,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [245, 158, 11] }
    });
  },

  addGrnsTable(doc, y, margin, pageWidth, profitData, getDepartmentName) {
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("GRN DETAILS", margin, y);
    y += 8;

    const grnHeaders = [['GRN Code', 'Date', 'Department', 'Items', 'Total Cost']];
    const grnRows = profitData.grns.map(grn => [
      grn.grn_code,
      new Date(grn.grn_date).toLocaleDateString(),
      getDepartmentName(grn.department_id),
      grn.total_item?.toString() || '0',
      `LKR ${(grn.total_cost || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: y,
      head: grnHeaders,
      body: grnRows,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [139, 92, 246] }
    });
  },

  downloadPDF(profitData, fromDate, toDate, departmentFilter, departments, typeFilter, paymentStatusFilter, getDepartmentName) {
    try {
      const doc = this.generatePDF(profitData, fromDate, toDate, departmentFilter, departments, typeFilter, paymentStatusFilter, getDepartmentName);
      const fileName = `Profit_Report_${fromDate}_to_${toDate}.pdf`;
      doc.save(fileName);
      return true;
    } catch (error) {
      console.error("PDF generation error:", error);
      throw error;
    }
  }
};
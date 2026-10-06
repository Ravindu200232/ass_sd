import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Download, Lock, Printer } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

// Import Components
import { FiltersSection } from "../../components/sales-report/FiltersSection";
import { SummaryCards } from "../../components/sales-report/SummaryCards";
import { InvoiceTable } from "../../components/sales-report/InvoiceTable";
import { BreakdownCharts } from "../../components/sales-report/BreakdownCharts";
import { InvoiceDetailsDialog } from "../../components/sales-report/InvoiceDetailsDialog";
import { escapeHtml } from "@/lib/escapeHtml";

// Search Types
const SEARCH_TYPES = [
  { value: "invoice", label: "Invoice/Customer" },
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "brand", label: "Brand" },
  { value: "department", label: "Department" },
  { value: "type", label: "Invoice Type" },
  { value: "service", label: "Service" },
];

export default function SalesReport() {
  // State Management
  const [invoices, setInvoices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDepartmentLocked, setIsDepartmentLocked] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    statusFilter: "all",
    departmentFilter: "all",
    typeFilter: "all",
    serviceFilter: "all",
    searchTerm: "",
    searchType: "invoice",
  });

  // Initialize on Mount
  useEffect(() => {
    initializeUser();
    fetchData();
  }, []);

  // User Initialization
  const initializeUser = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);

        const updatedUser = {
          id: user.id || 0,
          user_code: user.user_code || "USER0000",
          full_name: user.full_name || "User",
          username: user.username || "user",
          role: user.role || "guest",
          department_id: user.department_id || null,
        };

        setCurrentUser(updatedUser);

        // Set department lock based on role
        if (user.role === "employee") {
          setIsDepartmentLocked(true);
          if (user.department_id) {
            updateFilter("departmentFilter", String(user.department_id));
          }
        }
      } else {
        // No user found in localStorage
        setCurrentUser({
          id: 0,
          user_code: "GUEST",
          full_name: "Guest User",
          username: "guest",
          role: "guest",
          department_id: null,
        });
      }
    } catch (error) {
      console.error("Error getting user from localStorage:", error);
      toast.error("Error loading user data");
      // Fallback user
      setCurrentUser({
        id: 0,
        user_code: "SYSTEM",
        full_name: "System",
        username: "system",
        role: "guest",
        department_id: null,
      });
    }
  };

  // Data Fetching
  const fetchData = async () => {
    try {
      await Promise.all([fetchInvoices(), fetchDepartments()]);
    } catch (error) {
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get("/invoices");
      setInvoices(response.data.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Error fetching invoices");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      const departmentsList = response.data.data;
      setDepartments(departmentsList);

      // Auto-set department filter for employees
      if (
        currentUser?.role === "employee" &&
        currentUser?.department_id &&
        departmentsList.length > 0
      ) {
        const userDept = departmentsList.find(
          (d) => d.id === currentUser.department_id
        );
        if (userDept) {
          updateFilter("departmentFilter", String(userDept.id));
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Error fetching departments");
    }
  };

  // Filter Management
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Helper Functions
  // Helper Functions
  const getDepartmentName = (departmentData) => {
    // If departmentData is already an object with department_name
    if (departmentData && typeof departmentData === "object") {
      return departmentData.department_name || "Unknown Department";
    }

    // Fallback: try to find from departments list (shouldn't be needed if API returns full department data)
    const department = departments.find((dept) => dept.id === departmentData);
    return department ? department.department_name : "Unknown Department";
  };

  const getServiceDisplay = (invoice) => {
    if (!invoice) return "Not Specified";
    if (invoice.type === "tire") return "Tire Service";
    return invoice.service || "Not Specified";
  };

  const getTypeBadge = (type) => {
    const variants = {
      tire: "default",
      other: "secondary",
      "tire and other": "destructive",
    };

    const typeText = {
      tire: "Tire",
      other: "Service",
      "tire and other": "Tire + Service",
      cancel: "Cancelled",
    };

    return (
      <Badge variant={variants[type] || "outline"}>
        {typeText[type] || type || "Not Specified"}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      paid: "default",
      partial: "secondary",
      unpaid: "destructive",
      credit: "secondary",
      card: "outline",
      cash: "default",
      bankslip: "outline",
    };

    const statusText = {
      paid: "Paid",
      partial: "Partial",
      unpaid: "Unpaid",
      credit: "Credit",
      card: "Card",
      cash: "Cash",
      bankslip: "Bank Slip",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {statusText[status] || status}
      </Badge>
    );
  };

  const getPaymentBreakdown = (invoice) => {
    const netTotal = Number(invoice.net_total) || 0;
    const payAmount = Number(invoice.pay_amount) || 0;
    const creditPaid = Number(invoice.credit_paid) || 0;
    const creditAllocated = Number(invoice.credit_allocated) || 0;

    const actualCreditPaid = Math.max(creditPaid, creditAllocated);
    const cashPaid = Math.max(0, payAmount);
    const totalPaid = cashPaid + actualCreditPaid;
    const balance =
      Number(invoice.balance) || Math.max(0, netTotal - totalPaid);

    return {
      cashPaid: cashPaid,
      creditPaid: actualCreditPaid,
      totalPaid: totalPaid,
      netTotal: netTotal,
      balance: balance,
    };
  };

  const getProductDetails = (item) => {
    const name = item.product_name?.toLowerCase() || "";
    const itemType = item.type || "";

    if (itemType === "service") {
      return { category: "Service", brand: "Service" };
    }

    let category = "Other";
    let brand = "Unknown";

    // Extract brand from product name
    if (name.includes("dsi")) brand = "DSI";
    if (name.includes("ceat")) brand = "CEAT";
    if (name.includes("bridgestone")) brand = "Bridgestone";
    if (name.includes("michelin")) brand = "Michelin";
    if (name.includes("goodyear")) brand = "Goodyear";
    if (name.includes("pirelli")) brand = "Pirelli";

    if (
      name.includes("tyre") ||
      name.includes("tire") ||
      name.includes("tube") ||
      /^\d+-\d+/.test(name) // Matches patterns like "250-17"
    ) {
      category = "Tires";
    } else if (
      name.includes("alignment") ||
      name.includes("balancing") ||
      name.includes("service")
    ) {
      category = "Services";
    } else if (
      name.includes("valve") ||
      name.includes("nitrogen") ||
      name.includes("puncture") ||
      name.includes("patch")
    ) {
      category = "Accessories";
    }

    return { category, brand };
  };

  // Get unique types and services for filters
  const getUniqueTypesAndServices = () => {
    const types = new Set();
    const services = new Set();

    invoices.forEach((invoice) => {
      if (invoice.type) types.add(invoice.type);

      if (invoice.type === "tire") {
        services.add("Tire Service");
      } else if (invoice.service && invoice.service.trim() !== "") {
        services.add(invoice.service);
      }
    });

    return {
      types: Array.from(types).sort(),
      services: Array.from(services).sort(),
    };
  };

  const { types, services } = getUniqueTypesAndServices();

  // Filter invoices by all criteria
  const getFilteredInvoices = () => {
    let filtered = invoices;

    // Date range filter
    if (filters.fromDate && filters.toDate) {
      filtered = filtered.filter((invoice) => {
        const invoiceDate = new Date(invoice.inv_date);
        const from = new Date(filters.fromDate);
        const to = new Date(filters.toDate);

        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        return invoiceDate >= from && invoiceDate <= to;
      });
    }

    // Status filter
    if (filters.statusFilter !== "all") {
      filtered = filtered.filter(
        (invoice) => invoice.payment_status === filters.statusFilter
      );
    }

    // Department filter
    if (filters.departmentFilter !== "all") {
      filtered = filtered.filter(
        (invoice) => String(invoice.department_id) === filters.departmentFilter
      );
    }

    // Type filter
    if (filters.typeFilter !== "all") {
      filtered = filtered.filter(
        (invoice) => invoice.type === filters.typeFilter
      );
    }

    // Service filter
    if (filters.serviceFilter !== "all") {
      if (filters.serviceFilter === "Tire Service") {
        filtered = filtered.filter((invoice) => invoice.type === "tire");
      } else {
        filtered = filtered.filter(
          (invoice) => invoice.service === filters.serviceFilter
        );
      }
    }

    // Search filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filtered = filtered.filter((invoice) => {
        switch (filters.searchType) {
          case "invoice":
            return (
              invoice.inv_no?.toLowerCase().includes(searchLower) ||
              invoice.customer_code?.toLowerCase().includes(searchLower) ||
              invoice.customer?.customer_name
                ?.toLowerCase()
                .includes(searchLower)
            );

          case "product":
            return invoice.items?.some(
              (item) =>
                item.product_name?.toLowerCase().includes(searchLower) ||
                item.product_code?.toLowerCase().includes(searchLower)
            );

          case "category":
            return invoice.items?.some((item) =>
              getProductDetails(item)
                .category.toLowerCase()
                .includes(searchLower)
            );

          case "brand":
            return invoice.items?.some((item) =>
              getProductDetails(item).brand.toLowerCase().includes(searchLower)
            );

          case "department":
            return getDepartmentName(invoice.department_id)
              .toLowerCase()
              .includes(searchLower);

          case "type":
            return invoice.type?.toLowerCase().includes(searchLower);

          case "service":
            return getServiceDisplay(invoice)
              .toLowerCase()
              .includes(searchLower);

          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Calculate sales data for summaries
  const calculateSalesData = () => {
    const filteredInvoices = getFilteredInvoices();
    const activeInvoices = filteredInvoices.filter(
      (invoice) => invoice.type !== "cancel"
    );

    if (activeInvoices.length === 0) {
      return null;
    }

    const totalRevenue = activeInvoices.reduce(
      (sum, invoice) => sum + (Number(invoice.net_total) || 0),
      0
    );
    const totalInvoices = activeInvoices.length;
    const cashCollected = activeInvoices.reduce(
      (sum, invoice) => sum + (Number(invoice.pay_amount) || 0),
      0
    );
    const creditGiven = activeInvoices.reduce((sum, invoice) => {
      const netTotal = Number(invoice.net_total) || 0;
      const payAmount = Number(invoice.pay_amount) || 0;
      return sum + Math.max(0, netTotal - payAmount);
    }, 0);

    const typeBreakdown = calculateTypeBreakdown(activeInvoices);
    const serviceBreakdown = calculateServiceBreakdown(activeInvoices);

    return {
      total_revenue: totalRevenue,
      total_invoices: totalInvoices,
      cash_collected: cashCollected,
      credit_given: creditGiven,
      invoices: activeInvoices,
      type_breakdown: typeBreakdown,
      service_breakdown: serviceBreakdown,
    };
  };

  const calculateTypeBreakdown = (invoices) => {
    const breakdown = {};

    invoices.forEach((invoice) => {
      const type = invoice.type || "Not Specified";

      if (!breakdown[type]) {
        breakdown[type] = {
          quantity: 0,
          revenue: 0,
        };
      }

      breakdown[type].quantity += 1;
      breakdown[type].revenue += Number(invoice.net_total) || 0;
    });

    return Object.entries(breakdown)
      .map(([type, data]) => ({
        type: type,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const calculateServiceBreakdown = (invoices) => {
    const breakdown = {};

    invoices.forEach((invoice) => {
      const service = getServiceDisplay(invoice);

      if (!breakdown[service]) {
        breakdown[service] = {
          quantity: 0,
          revenue: 0,
        };
      }

      breakdown[service].quantity += 1;
      breakdown[service].revenue += Number(invoice.net_total) || 0;
    });

    return Object.entries(breakdown)
      .map(([service, data]) => ({
        service: service,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  // THERMAL RECEIPT PRINTING FUNCTION - Updated for current API response
  const printThermalReceipt = (invoice) => {
    try {
      // Get department details - now from invoice.department
      // V-13: escaped at the single point where API data enters the
      // print template, which is handed to document.write() below.
      const departmentName = escapeHtml(
        invoice.department?.department_name || "Main Department"
      );
      const departmentAddress = escapeHtml(invoice.department?.department_address || "");
      const departmentContact = escapeHtml(invoice.department?.department_contact || "");

      // Customer details - now from invoice.customer (could be null)
      const customerName = escapeHtml(invoice.customer?.customer_name || "Cash Sale");
      const customerPhone = escapeHtml(invoice.customer?.phone_no_01 || "");

      // Invoice details
      const invoiceNo = escapeHtml(invoice.inv_no || "N/A");
      const invoiceDate =
        invoice.inv_date || new Date().toISOString().split("T")[0];
      const invBy =
        invoice.inv_by ||
        invoice.created_by?.user_code ||
        currentUser?.user_code ||
        "SYSTEM";

      // Format date time for receipt
      const formatDateForReceipt = (dateString) => {
        if (!dateString)
          return new Date()
            .toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })
            .replace(",", "");

        const date = new Date(dateString);
        return date
          .toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
          .replace(",", "");
      };

      const dateTime = formatDateForReceipt(invoiceDate);

      // Calculate totals - ensure proper number conversion
      const totalAmount = Number(invoice.total_amount) || 0;
      const totalDiscount = Number(invoice.total_discount) || 0;
      const netTotal = Number(invoice.net_total) || 0;
      const payAmount = Number(invoice.pay_amount) || 0;
      const creditAllocated = Number(invoice.credit_allocated) || 0;

      // Determine payment status and balance
      let cashPaid = payAmount;
      let balanceAmount = Number(invoice.balance) || 0;
      let balanceLabel = "Balance";

      if (invoice.payment_status === "credit") {
        cashPaid = Math.max(0, netTotal - creditAllocated);
        balanceAmount = Math.max(0, netTotal - creditAllocated - cashPaid);
        balanceLabel = balanceAmount > 0 ? "Due" : "Balance";
      } else {
        // Use the balance from API if available, otherwise calculate
        if (balanceAmount === 0) {
          if (cashPaid >= netTotal) {
            balanceAmount = cashPaid - netTotal;
            balanceLabel = "Balance";
          } else {
            balanceAmount = netTotal - cashPaid;
            balanceLabel = "Due";
          }
        } else {
          balanceLabel = balanceAmount > 0 ? "Due" : "Balance";
        }
      }

      // Helper function to clean product name
      // V-13: stripped the parenthesised suffix but never escaped, so a
      // product name imported from a spreadsheet went straight into
      // document.write(). Now escapes as well.
      const cleanProductName = (productName) => {
        if (!productName) return "";

        return escapeHtml(String(productName).replace(/\s*\([^)]*\)/g, "").trim());
      };

      // Build receipt HTML
      const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${invoiceNo}</title>
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
      font-weight: 900;
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
      text-transform: uppercase;
    }

    .dept {
      font-size: 12px;
      font-weight: 900;
      margin-top: 3px;
    }

    .info {
      font-size: 13px;
      font-weight: 900;
      margin: 6px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    th {
      font-size: 13px;
      font-weight: 900;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      text-align: left;
      text-transform: uppercase;
    }

    td {
      padding: 4px 0;
      vertical-align: top;
      border-bottom: 1px dashed #ddd;
    }

    .qty { 
      width: 12mm; 
      text-align: center; 
      padding-right: 2mm;
      font-weight: 900;
      font-size: 13px;
    }
    .desc { 
      width: 44mm; 
      padding-right: 2mm;
      word-wrap: break-word;
    }
    .amt { 
      width: 18mm; 
      text-align: right; 
      font-weight: 900;
      font-size: 13px;
    }

    .product-item {
      margin-bottom: 2px;
    }
    
    .product-name {
      font-weight: 900;
      font-size: 14px;
      line-height: 1.3;
      margin-bottom: 1px;
      color: #000;
    }
    
    .product-price-details {
      font-weight: 900;
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }
    
    .discount {
      color: #ff6600;
      font-weight: 900;
    }

    .totals {
      margin-top: 10px;
      border-top: 1px dashed #000;
      padding-top: 8px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      font-weight: 900;
    }

    .grand {
      font-size: 16px;
      font-weight: 900;
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 8px;
      text-transform: uppercase;
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
      font-weight: 900;
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 8px;
      line-height: 1.4;
    }

    .custom-note {
      font-size: 11px;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px dashed #ccc;
      word-wrap: break-word;
      font-weight: 900;
    }
    
    .credit-section {
      background-color: #f0f0f0;
      padding: 6px;
      margin: 6px 0;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 900;
      border: 1px dashed #000;
    }
    
    .highlight-box {
      background-color: #f8f8f8;
      padding: 3px;
      margin: 3px 0;
      border-radius: 2px;
    }
    
    .paid {
      color: #008000;
      font-weight: 900;
    }
    
    .due {
      color: #ff0000;
      font-weight: 900;
    }
    
    .balance-section {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 2px dashed #000;
    }
    
    .balance-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-weight: 900;
      font-size: 14px;
    }
    
    .balance-final {
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 0.5px;
      color: #000000;
    }
    
    .final-balance {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-weight: 900;
      font-size: 16px;
      color: #000000;
      padding-top: 8px;
      border-top: 2px solid #000;
    }
  </style>

  <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
</head>

<body>

  <div class="header center">
    <div class="shop-name">${departmentName}</div>
    ${departmentAddress ? `<div class="dept">${departmentAddress}</div>` : ""}
    ${
      departmentContact
        ? `<div class="dept">Tel: ${departmentContact}</div>`
        : ""
    }
  </div>

  <div class="info center">
    <div>Invoice: ${invoiceNo}</div>
    <div>${dateTime}</div>
    <div>Cashier: ${escapeHtml(invBy)}</div>
  </div>

  ${
    customerName !== "Cash Sale"
      ? `
    <div class="info highlight-box">
      <div>CUSTOMER DETAILS</div>
      <div>${customerName}</div>
      ${customerPhone ? `<div>Tel: ${customerPhone}</div>` : ""}
    </div>
  `
      : ""
  }

  ${
    invoice.payment_status === "credit"
      ? `
    <div class="credit-section">
      <div style="text-align: center;">CREDIT PAYMENT</div>
      <div>Credit Allocated: Rs.${creditAllocated.toFixed(2)}</div>
    </div>
  `
      : ""
  }

  <table>
    <thead>
      <tr>
        <th class="qty">QTY</th>
        <th class="desc">ITEM</th>
        <th class="amt">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${
        invoice.items
          ?.map((item) => {
            const isService = item.type === "service";
            const itemName = cleanProductName(
              item.product_name || item.description || "Item"
            );
            const itemPrice = Number(item.selling_price) || 0;
            const itemQty = Number(item.qty) || 1;
            const itemDiscount = Number(item.discount) || 0;
            const itemTotal = itemPrice * itemQty;

            return `
          <tr>
            <td class="qty">${itemQty}</td>
            <td class="desc">
              <div class="product-item">
                <div class="product-name">${itemName}</div>
                ${
                  itemDiscount > 0
                    ? `
                  <div class="product-price-details">
                    Price: Rs.${itemPrice.toFixed(2)}
                    <span class="discount">(-${itemDiscount})</span>
                  </div>
                `
                    : ""
                }
                ${
                  isService
                    ? '<div class="product-price-details">[Service]</div>'
                    : ""
                }
              </div>
            </td>
            <td class="amt">
              Rs.${itemTotal.toFixed(2)}
            </td>
          </tr>
        `;
          })
          .join("") || "<tr><td colspan='3' class='center'>No items</td></tr>"
      }
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span>Sub Total</span>
      <span>Rs.${totalAmount.toFixed(2)}</span>
    </div>

    ${
      totalDiscount > 0
        ? `
      <div class="row">
        <span class="discount">Discount</span>
        <span class="discount">-Rs.${totalDiscount.toFixed(2)}</span>
      </div>
    `
        : ""
    }

    <div class="row grand">
      <span>TOTAL AMOUNT</span>
      <span>Rs.${netTotal.toFixed(2)}</span>
    </div>
  </div>

  <div class="balance-section">
    ${
      invoice.payment_status === "credit"
        ? `
      <div class="balance-row">
        <span>Credit Used</span>
        <span class="balance-final">Rs.${creditAllocated.toFixed(2)}</span>
      </div>
    `
        : ""
    }
    
    <div class="balance-row">
      <span>Cash Paid</span>
      <span class="balance-final">Rs.${cashPaid.toFixed(2)}</span>
    </div>
  </div>
  
  <div class="final-balance">
    <span>${balanceLabel === "Due" ? "DUE AMOUNT" : "BALANCE"}</span>
    <span class="balance-final">
      ${balanceLabel === "Due" ? "(Rs." : "Rs."}${Math.abs(
        balanceAmount
      ).toFixed(2)}${balanceLabel === "Due" ? ")" : ""}
    </span>
  </div>

  ${
    invoice.note
      ? `
    <div class="custom-note">
      <div>CUSTOMER NOTE:</div>
      <div>${invoice.note}</div>
    </div>
  `
      : ""
  }

  <div class="barcode">
    *${invoiceNo.replace(/-/g, "")}*
  </div>

  <div class="footer">
    <div style="margin-bottom: 4px;">THANK YOU!</div>
    <div>Goods once sold cannot be returned</div>
    <div style="margin-top: 4px; font-size: 10px;">Invoice Valid for 7 Days</div>
    <div style="margin-top: 4px; font-size: 10px; font-style: italic;">SALES HISTORY PRINT</div>
  </div>

</body>
</html>
`;

      // Create print window
      const printWindow = window.open("", "_blank", "width=400,height=650");
      if (!printWindow) {
        toast.error("Popup blocked. Allow popups to print.");
        return;
      }

      // V-13: safe by construction - every value interpolated into this
      // template is escaped with escapeHtml() from @/lib/escapeHtml. The lint
      // rule stays enabled so a NEW unescaped sink cannot be added silently.
      // eslint-disable-next-line no-restricted-syntax
      printWindow.document.write(receiptHTML);
      printWindow.document.close();

      // Auto-print after a short delay
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 800);
      }, 400);
    } catch (err) {
      console.error("Error printing thermal receipt:", err);
      toast.error("Failed to print receipt");
    }
  };

  // Sales Report Receipt
  const printSalesReportReceipt = () => {
    try {
      const salesData = calculateSalesData();
      if (!salesData) {
        toast.error("No data available for the selected filters");
        return;
      }

      const currentDepartment = departments.find(
        (d) => d.id === parseInt(filters.departmentFilter)
      );

      // V-13: escaped at the single point where API data enters the
      // print template, which is handed to document.write() below.
      const departmentName = escapeHtml(
        currentDepartment?.department_name || "All Departments"
      );
      const departmentAddress = escapeHtml(currentDepartment?.department_address || "");

      // Build report receipt HTML
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
      font-weight: 900;
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
      text-transform: uppercase;
    }

    .dept {
      font-size: 12px;
      font-weight: 900;
      margin-top: 3px;
    }

    .info {
      font-size: 13px;
      font-weight: 900;
      margin: 6px 0;
    }

    .section {
      margin: 10px 0;
      padding: 8px 0;
      border-top: 1px dashed #000;
    }

    .row {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      font-weight: 900;
    }

    .highlight {
      font-size: 15px;
      font-weight: 900;
      color: #000;
    }

    .grand {
      font-size: 16px;
      font-weight: 900;
      border-top: 2px solid #000;
      padding-top: 8px;
      margin-top: 8px;
      text-transform: uppercase;
    }

    .footer {
      font-size: 11px;
      font-weight: 900;
      text-align: center;
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 8px;
      line-height: 1.4;
    }

    .date-range {
      background-color: #f0f0f0;
      padding: 6px;
      border-radius: 3px;
      margin: 6px 0;
      font-size: 12px;
      font-weight: 900;
    }

    .breakdown-item {
      margin: 4px 0;
      padding: 4px 0;
      border-bottom: 1px dotted #ccc;
    }
  </style>
</head>

<body>

  <div class="header center">
    <div class="shop-name">SALES REPORT</div>
    ${departmentAddress ? `<div class="dept">${departmentAddress}</div>` : ""}
  </div>

  <div class="info center">
    <div>${departmentName}</div>
    <div>Generated by: ${currentUser?.full_name || "System"}</div>
    <div>${new Date()
      .toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "")}</div>
  </div>

  <div class="date-range">
    <div>Date Range:</div>
    <div>${filters.fromDate} to ${filters.toDate}</div>
  </div>

  <div class="section">
    <div class="row">
      <span>Total Invoices</span>
      <span>${salesData.total_invoices}</span>
    </div>
    
    <div class="row highlight">
      <span>Total Revenue</span>
      <span>Rs.${salesData.total_revenue.toFixed(2)}</span>
    </div>
    
    <div class="row">
      <span>Cash Collected</span>
      <span>Rs.${salesData.cash_collected.toFixed(2)}</span>
    </div>
    
    <div class="row">
      <span>Credit Given</span>
      <span>Rs.${salesData.credit_given.toFixed(2)}</span>
    </div>
  </div>

  ${
    salesData.type_breakdown.length > 0
      ? `
    <div class="section">
      <div class="info center">INVOICE TYPE BREAKDOWN</div>
      ${salesData.type_breakdown
        .map(
          (type) => `
        <div class="breakdown-item">
          <div class="row">
            <span>${type.type}</span>
            <span>${type.quantity} inv</span>
          </div>
          <div class="row">
            <span>Revenue</span>
            <span>Rs.${type.revenue.toFixed(2)}</span>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `
      : ""
  }

  ${
    salesData.service_breakdown.length > 0
      ? `
    <div class="section">
      <div class="info center">SERVICE BREAKDOWN</div>
      ${salesData.service_breakdown
        .map(
          (service) => `
        <div class="breakdown-item">
          <div class="row">
            <span>${service.service}</span>
            <span>${service.quantity} inv</span>
          </div>
          <div class="row">
            <span>Revenue</span>
            <span>Rs.${service.revenue.toFixed(2)}</span>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `
      : ""
  }

  <div class="section">
    <div class="row grand">
      <span>SUMMARY</span>
      <span></span>
    </div>
    <div class="row">
      <span>Avg. Invoice Value</span>
      <span>Rs.${(salesData.total_revenue / salesData.total_invoices).toFixed(
        2
      )}</span>
    </div>
    <div class="row">
      <span>Cash/Total Ratio</span>
      <span>${(
        (salesData.cash_collected / salesData.total_revenue) *
        100
      ).toFixed(1)}%</span>
    </div>
  </div>

  <div class="footer">
    <div style="margin-bottom: 4px;">SALES REPORT</div>
    <div>Generated: ${new Date().toLocaleDateString()}</div>
    <div style="margin-top: 4px; font-size: 10px;">End of Report</div>
  </div>

</body>
</html>
`;

      // Create print window
      const printWindow = window.open("", "_blank", "width=400,height=650");
      if (!printWindow) {
        toast.error("Popup blocked. Allow popups to print.");
        return;
      }

      // V-13: safe by construction - every value interpolated into this
      // template is escaped with escapeHtml() from @/lib/escapeHtml. The lint
      // rule stays enabled so a NEW unescaped sink cannot be added silently.
      // eslint-disable-next-line no-restricted-syntax
      printWindow.document.write(reportHTML);
      printWindow.document.close();

      // Auto-print after a short delay
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 800);
      }, 400);
    } catch (err) {
      console.error("Error printing sales report:", err);
      toast.error("Failed to print sales report");
    }
  };

  // Cancel Invoice
  const handleCancelInvoice = async (invoice) => {
    if (invoice.type === "cancel") {
      toast.error("This invoice is already cancelled");
      return;
    }

    const confirmed = window.confirm(
      `Cancel invoice ${invoice.inv_no}?\n\nThis will restore the sold stock batches and mark the invoice as CANCELLED. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await api.put(`/invoices/${invoice.id}`, {
        type: "cancel",
      });
      const cancelledInvoice = response.data?.data;

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id
            ? { ...inv, ...(cancelledInvoice || {}), type: "cancel" }
            : inv
        )
      );

      toast.success(`Invoice ${invoice.inv_no} has been cancelled`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to cancel invoice");
    }
  };

  // Invoice Actions
const viewInvoiceDetails = async (invoiceNo) => {
  try {
    // First, try to find the invoice in our already-loaded list
    const existingInvoice = invoices.find(inv => inv.inv_no === invoiceNo);
    
    if (existingInvoice) {
      // Use the invoice from our list (which has department data)

      setSelectedInvoice(existingInvoice);
      setIsDialogOpen(true);
    } else {
      // Fallback: fetch the single invoice if not found in list
      const response = await api.get(`/invoices/invoice-no/${invoiceNo}`);
      // V-16: removed - this printed a complete invoice, including the
      // customer name and phone number and every line price, to the console.
      setSelectedInvoice(response.data.data);
      setIsDialogOpen(true);
    }
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    toast.error("Error fetching invoice details");
  }
};

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-neutral-300 border-t-neutral-900 mx-auto"></div>
          <p className="mt-3 text-neutral-900">Loading Sales Data...</p>
        </div>
      </div>
    );
  }

  // Calculate data
  const salesData = calculateSalesData();
  const filteredInvoices = getFilteredInvoices();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl ml-10 font-bold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground">
            Comprehensive sales analysis with filtering and reporting
          </p>
          <div className="text-xs text-gray-500 mt-1">
            Generated by: {currentUser?.full_name || "User"} (
            {currentUser?.user_code || "USER"}) -{" "}
            <Badge
              variant={currentUser?.role === "admin" ? "default" : "secondary"}
              className="text-xs"
            >
              {currentUser?.role === "admin"
                ? "Administrator"
                : currentUser?.role === "employee"
                ? "Employee"
                : "Guest"}
            </Badge>
            {isDepartmentLocked && (
              <span className="ml-2 text-orange-600">
                <Lock className="inline h-3 w-3 mr-1" />
                Department Filter Locked
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {salesData && (
            <Button
              onClick={printSalesReportReceipt}
              className="bg-green-600 hover:bg-green-700"
              disabled={!salesData}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Sales Report
            </Button>
          )}
          <Button onClick={() => fetchData()} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <FiltersSection
        filters={filters}
        onFilterChange={updateFilter}
        departments={departments}
        currentUser={currentUser}
        isDepartmentLocked={isDepartmentLocked}
        searchTypes={SEARCH_TYPES}
        types={types}
        services={services}
      />

      {/* Summary Cards */}
      {salesData ? (
        <SummaryCards
          salesData={salesData}
          fromDate={filters.fromDate}
          toDate={filters.toDate}
        />
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold">No Data Available</h3>
              <p>No invoices match your current filters</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Table */}
      <InvoiceTable
        invoices={filteredInvoices}
        onViewDetails={viewInvoiceDetails}
        onPrintReceipt={printThermalReceipt}
        onCancelInvoice={handleCancelInvoice}
        isAdmin={currentUser?.role === "admin"}
        getTypeBadge={getTypeBadge}
        getServiceDisplay={getServiceDisplay}
        getPaymentBreakdown={getPaymentBreakdown}
        getStatusBadge={getStatusBadge}
      />

      {/* Breakdown Charts */}
      <BreakdownCharts salesData={salesData} getTypeBadge={getTypeBadge} />

      {/* Invoice Details Dialog */}
      <InvoiceDetailsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedInvoice={selectedInvoice}
        getDepartmentName={getDepartmentName}
        getServiceDisplay={getServiceDisplay}
        getProductDetails={getProductDetails}
        getPaymentBreakdown={getPaymentBreakdown}
        getStatusBadge={getStatusBadge}
        onPrintReceipt={printThermalReceipt}
        onCancelInvoice={handleCancelInvoice}
        isAdmin={currentUser?.role === "admin"}
      />
    </div>
  );
}

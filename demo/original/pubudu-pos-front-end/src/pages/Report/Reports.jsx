import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  FileText,
  Package,
  Users,
  Filter,
  AlertTriangle,
  Search,
  Lock,
  Unlock,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Common date filters
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    productCode: "all",
    customerCode: "all",
    departmentId: "all",
    paymentStatus: "all",
    invoiceType: "all",
  });

  // Available options for filters
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Search states
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Current user state
  const [currentUser, setCurrentUser] = useState({
    id: 0,
    user_code: "USER0000",
    full_name: "System User",
    username: "system",
    role: "guest",
    department_id: null,
  });

  // Department lock state - employees cannot change department
  const [isDepartmentLocked, setIsDepartmentLocked] = useState(false);

  useEffect(() => {
    fetchUserFromLocalStorage();
    fetchFilterOptions();
  }, []);

  const fetchUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        console.log("Loaded user from localStorage in ReportsDashboard:", user);
        
        setCurrentUser({
          id: user.id || 0,
          user_code: user.user_code || "USER0000",
          full_name: user.full_name || "System User",
          username: user.username || "system",
          role: user.role || "guest",
          department_id: user.department_id || null,
        });
        
        // Set department lock based on role
        if (user.role === "employee") {
          setIsDepartmentLocked(true);
          console.log("ReportsDashboard: User is employee, department locked to:", user.department_id);
          
          // Auto-set department filter for employees to their department
          if (user.department_id) {
            setFilters(prev => ({
              ...prev,
              departmentId: String(user.department_id)
            }));
          }
        } else {
          setIsDepartmentLocked(false);
          console.log("ReportsDashboard: User is admin, department can be changed");
        }
      } else {
        console.warn("No user found in localStorage for ReportsDashboard");
        toast.error("Please login to view reports");
      }
    } catch (error) {
      console.error("Error getting user from localStorage in ReportsDashboard:", error);
      toast.error("Error loading user data");
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get("/reports/filter-options");
      const data = response.data.data || {};
      
      setProducts(data.products || []);
      setCustomers(data.customers || []);
      
      // Filter departments based on user role
      const allDepartments = data.departments || [];
      if (currentUser.role === "employee" && currentUser.department_id) {
        // Show only employee's department
        const userDept = allDepartments.find(d => d.id === currentUser.department_id);
        setDepartments(userDept ? [userDept] : []);
        
        // Auto-set department filter for employees
        if (filters.departmentId === "all") {
          setFilters(prev => ({
            ...prev,
            departmentId: String(currentUser.department_id)
          }));
        }
      } else {
        // Admin or guest can see all departments
        setDepartments(allDepartments);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      toast.error("Failed to load filter options");
    }
  };

  const generateReport = async () => {
    if (!filters.fromDate || !filters.toDate) {
      toast.error("Please select both from and to dates");
      return;
    }

    setLoading(true);
    try {
      let endpoint = "";
      const params = new URLSearchParams({
        from_date: filters.fromDate,
        to_date: filters.toDate,
      });

      // Add additional filters based on report type
      if (filters.productCode && filters.productCode !== "all") {
        params.append("product_code", filters.productCode);
      }
      if (filters.customerCode && filters.customerCode !== "all") {
        params.append("customer_code", filters.customerCode);
      }
      
      // For employees, always filter by their department
      if (currentUser.role === "employee" && currentUser.department_id) {
        params.append("department_id", currentUser.department_id);
      } else if (filters.departmentId && filters.departmentId !== "all") {
        // For admins, use selected department filter
        params.append("department_id", filters.departmentId);
      }
      
      if (filters.paymentStatus && filters.paymentStatus !== "all") {
        params.append("payment_status", filters.paymentStatus);
      }
      // Add invoice type filter
      if (filters.invoiceType && filters.invoiceType !== "all") {
        params.append("invoice_type", filters.invoiceType);
      }

      switch (activeTab) {
        case "products":
          endpoint = "/reports/products";
          break;
        case "grn":
          endpoint = "/reports/grn";
          break;
        case "invoices":
          endpoint = "/reports/invoices";
          break;
        case "customers":
          endpoint = "/reports/customers";
          break;
        case "stock":
          endpoint = "/reports/stock";
          break;
        case "lowstock":
          endpoint = "/reports/low-stock";
          break;
        default:
          endpoint = "/reports/products";
      }

      console.log("API Request:", `${endpoint}?${params.toString()}`);
      
      const response = await api.get(`${endpoint}?${params}`);
      setReportData(response.data.data);
      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (departmentId) => {
    if (!departmentId || departmentId === "all") return "Unknown Department";
    const department = departments.find((dept) => dept.id == departmentId);
    return department ? department.department_name : "Unknown Department";
  };

  const generatePDF = () => {
    if (!reportData) {
      toast.error("No report data to export");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    const reportTitles = {
      products: "Products Sales Report",
      grn: "GRN Report",
      invoices: "Invoices Report",
      customers: "Customers Report",
      stock: "Stock Report",
      lowstock: "Low Stock Report (Below 10)",
    };
    doc.text(reportTitles[activeTab], margin, 20);

    // Add user information
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Generated by: ${currentUser.full_name} (${currentUser.role})`, margin, 28);
    
    // Date range
    doc.text(
      `Date Range: ${filters.fromDate} to ${filters.toDate}`,
      margin,
      36
    );

    // Additional filters
    const additionalFilters = [];
    if (filters.invoiceType !== "all") {
      additionalFilters.push(`Type: ${filters.invoiceType}`);
    }
    if (currentUser.role === "employee") {
      additionalFilters.push(`Department: ${getDepartmentName(currentUser.department_id)} (Your Department)`);
    } else if (filters.departmentId !== "all") {
      const deptName = getDepartmentName(filters.departmentId);
      additionalFilters.push(`Department: ${deptName}`);
    }
    if (additionalFilters.length > 0) {
      doc.text(`Filters: ${additionalFilters.join(", ")}`, margin, 44);
    }

    let yPosition = 50;

    switch (activeTab) {
      case "products":
        generateProductsPDF(doc, margin, yPosition);
        break;
      case "grn":
        generateGRNPDF(doc, margin, yPosition);
        break;
      case "invoices":
        generateInvoicesPDF(doc, margin, yPosition);
        break;
      case "customers":
        generateCustomersPDF(doc, margin, yPosition);
        break;
      case "stock":
        generateStockPDF(doc, margin, yPosition);
        break;
      case "lowstock":
        generateLowStockPDF(doc, margin, yPosition);
        break;
    }

    const filename = `${activeTab}_report_${filters.fromDate}_to_${filters.toDate}.pdf`;
    doc.save(filename);
    toast.success("PDF exported successfully");
  };

  const generateProductsPDF = (doc, margin, yPosition) => {
    const headers = currentUser.role === "employee" 
      ? [
          ["Product Code", "Product Name", "Quantity Sold", "Total Sales"]
        ]
      : [
          ["Product Code", "Product Name", "Quantity Sold", "Total Sales", "Avg Price"]
        ];
    
    const rows = reportData?.products?.map((product) => {
      const baseRow = [
        product.product_code || "N/A",
        product.product_name || "Unknown",
        product.quantity_sold?.toString() || "0",
        `LKR ${Number(product.total_sales || 0).toLocaleString()}`
      ];
      
      if (currentUser.role !== "employee") {
        baseRow.push(`LKR ${Number(product.average_price || 0).toLocaleString()}`);
      }
      
      return baseRow;
    }) || [];

    autoTable(doc, {
      startY: yPosition,
      head: headers,
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    if (reportData?.summary) {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Summary:", margin, finalY);
      doc.setFont(undefined, "normal");
      doc.text(
        `Total Products: ${reportData.summary.total_products}`,
        margin,
        finalY + 8
      );
      doc.text(
        `Total Quantity Sold: ${reportData.summary.total_quantity}`,
        margin,
        finalY + 16
      );
      doc.text(
        `Total Sales: LKR ${Number(
          reportData.summary.total_sales || 0
        ).toLocaleString()}`,
        margin,
        finalY + 24
      );
    }
  };

  const generateGRNPDF = (doc, margin, yPosition) => {
    const headers = currentUser.role === "employee"
      ? [
          ["GRN Code", "Date", "Department", "Items", "Status"]
        ]
      : [
          ["GRN Code", "Date", "Department", "Items", "Total Cost", "Total Selling", "Profit"]
        ];
    
    const rows = reportData?.grns?.map((grn) => {
      if (currentUser.role === "employee") {
        return [
          grn.grn_code || "N/A",
          grn.grn_date || "N/A",
          grn.department_name || "Unknown",
          grn.total_items?.toString() || "0",
          grn.status || "N/A"
        ];
      } else {
        return [
          grn.grn_code || "N/A",
          grn.grn_date || "N/A",
          grn.department_name || "Unknown",
          grn.total_items?.toString() || "0",
          `LKR ${Number(grn.total_cost || 0).toLocaleString()}`,
          `LKR ${Number(grn.total_selling || 0).toLocaleString()}`,
          `LKR ${Number(grn.total_profit || 0).toLocaleString()}`
        ];
      }
    }) || [];

    autoTable(doc, {
      startY: yPosition,
      head: headers,
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    if (reportData?.summary && currentUser.role !== "employee") {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Summary:", margin, finalY);
      doc.setFont(undefined, "normal");
      doc.text(
        `Total GRNs: ${reportData.summary.total_grns}`,
        margin,
        finalY + 8
      );
      doc.text(
        `Total Items: ${reportData.summary.total_items}`,
        margin,
        finalY + 16
      );
      doc.text(
        `Total Cost: LKR ${Number(
          reportData.summary.total_cost || 0
        ).toLocaleString()}`,
        margin,
        finalY + 24
      );
      doc.text(
        `Total Profit: LKR ${Number(
          reportData.summary.total_profit || 0
        ).toLocaleString()}`,
        margin,
        finalY + 32
      );
    }
  };

  const generateInvoicesPDF = (doc, margin, yPosition) => {
    const headers = [
      ["Invoice No", "Date", "Customer", "Type", "Net Total", "Payment Method"],
    ];
    const rows =
      reportData?.invoices?.map((invoice) => [
        invoice.inv_no || "N/A",
        invoice.inv_date || "N/A",
        invoice.customer_name || "Cash Sale",
        invoice.type || "other",
        `LKR ${Number(invoice.net_total || 0).toLocaleString()}`,
        invoice.payment_method || "N/A",
      ]) || [];

    autoTable(doc, {
      startY: yPosition,
      head: headers,
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    if (reportData?.summary) {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Summary:", margin, finalY);
      doc.setFont(undefined, "normal");
      doc.text(
        `Total Invoices: ${reportData.summary.total_invoices}`,
        margin,
        finalY + 8
      );
      doc.text(
        `Total Revenue: LKR ${Number(
          reportData.summary.total_revenue || 0
        ).toLocaleString()}`,
        margin,
        finalY + 16
      );
      doc.text(
        `Cash Collected: LKR ${Number(
          reportData.summary.cash_collected || 0
        ).toLocaleString()}`,
        margin,
        finalY + 24
      );
      doc.text(
        `Credit Given: LKR ${Number(
          reportData.summary.credit_given || 0
        ).toLocaleString()}`,
        margin,
        finalY + 32
      );
    }
  };

  const generateCustomersPDF = (doc, margin, yPosition) => {
    const headers = [
      [
        "Customer Code",
        "Name",
        "Phone",
        "Total Invoices",
        "Total Spent",
        ...(currentUser.role !== "employee" ? ["Credit Balance"] : [])
      ],
    ];
    
    const rows = reportData?.customers?.map((customer) => {
      const baseRow = [
        customer.customer_code || "N/A",
        customer.customer_name || "Unknown",
        customer.phone_no_01 || "N/A",
        customer.total_invoices?.toString() || "0",
        `LKR ${Number(customer.total_spent || 0).toLocaleString()}`
      ];
      
      if (currentUser.role !== "employee") {
        baseRow.push(`LKR ${Number(customer.credit_balance || 0).toLocaleString()}`);
      }
      
      return baseRow;
    }) || [];

    autoTable(doc, {
      startY: yPosition,
      head: headers,
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [236, 72, 153] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    if (reportData?.summary) {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Summary:", margin, finalY);
      doc.setFont(undefined, "normal");
      doc.text(
        `Total Customers: ${reportData.summary.total_customers}`,
        margin,
        finalY + 8
      );
      doc.text(
        `Active Customers: ${reportData.summary.active_customers}`,
        margin,
        finalY + 16
      );
      doc.text(
        `Total Revenue: LKR ${Number(
          reportData.summary.total_revenue || 0
        ).toLocaleString()}`,
        margin,
        finalY + 24
      );
      if (currentUser.role !== "employee") {
        doc.text(
          `Total Credit Balance: LKR ${Number(
            reportData.summary.total_credit_balance || 0
          ).toLocaleString()}`,
          margin,
          finalY + 32
        );
      }
    }
  };

  const generateStockPDF = (doc, margin, yPosition) => {
    const headers = currentUser.role === "employee"
      ? [
          ["Product Code", "Product Name", "Current Stock"]
        ]
      : [
          ["Product Code", "Product Name", "Current Stock", "Avg Cost", "Stock Value", "Last GRN Date"]
        ];
    
    const rows = reportData?.stock?.map((item) => {
      if (currentUser.role === "employee") {
        return [
          item.product_code || "N/A",
          item.product_name || "Unknown",
          item.current_stock?.toString() || "0"
        ];
      } else {
        return [
          item.product_code || "N/A",
          item.product_name || "Unknown",
          item.current_stock?.toString() || "0",
          `LKR ${Number(item.average_cost || 0).toLocaleString()}`,
          `LKR ${Number(item.stock_value || 0).toLocaleString()}`,
          item.last_grn_date ? new Date(item.last_grn_date).toLocaleDateString() : "N/A"
        ];
      }
    }) || [];

    autoTable(doc, {
      startY: yPosition,
      head: headers,
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [6, 182, 212] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    if (reportData?.summary) {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Summary:", margin, finalY);
      doc.setFont(undefined, "normal");
      doc.text(
        `Total Products: ${reportData.summary.total_products}`,
        margin,
        finalY + 8
      );
      doc.text(
        `Total Stock Items: ${reportData.summary.total_items}`,
        margin,
        finalY + 16
      );
      if (currentUser.role !== "employee") {
        doc.text(
          `Total Stock Value: LKR ${Number(
            reportData.summary.total_stock_value || 0
          ).toLocaleString()}`,
          margin,
          finalY + 24
        );
      }
      doc.text(
        `Low Stock Items (<10): ${reportData.summary.low_stock_items}`,
        margin,
        currentUser.role === "employee" ? finalY + 24 : finalY + 32
      );
    }
  };

  const generateLowStockPDF = (doc, margin, yPosition) => {
    const headers = currentUser.role === "employee"
      ? [
          ["Product Code", "Product Name", "Current Stock", "Status"]
        ]
      : [
          ["Product Code", "Product Name", "Current Stock", "Avg Cost", "Stock Value", "Last GRN Date", "Status"]
        ];
    
    const rows = reportData?.low_stock?.map((item) => {
      const status = item.current_stock <= 5 ? "CRITICAL" : "LOW";
      
      if (currentUser.role === "employee") {
        return [
          item.product_code || "N/A",
          item.product_name || "Unknown",
          item.current_stock?.toString() || "0",
          status
        ];
      } else {
        return [
          item.product_code || "N/A",
          item.product_name || "Unknown",
          item.current_stock?.toString() || "0",
          `LKR ${Number(item.average_cost || 0).toLocaleString()}`,
          `LKR ${Number(item.stock_value || 0).toLocaleString()}`,
          item.last_grn_date ? new Date(item.last_grn_date).toLocaleDateString() : "N/A",
          status
        ];
      }
    }) || [];

    autoTable(doc, {
      startY: yPosition,
      head: headers,
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [239, 68, 68] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    if (reportData?.summary) {
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Summary:", margin, finalY);
      doc.setFont(undefined, "normal");
      doc.text(
        `Total Low Stock Items: ${reportData.summary.total_low_stock}`,
        margin,
        finalY + 8
      );
      doc.text(
        `Critical Items (≤5): ${reportData.summary.critical_items}`,
        margin,
        finalY + 16
      );
      doc.text(
        `Low Items (6-10): ${reportData.summary.low_items}`,
        margin,
        finalY + 24
      );
      if (currentUser.role !== "employee") {
        doc.text(
          `Total Value at Risk: LKR ${Number(
            reportData.summary.total_value_at_risk || 0
          ).toLocaleString()}`,
          margin,
          finalY + 32
        );
      }
    }
  };

  const renderReportTable = () => {
    if (!reportData) return null;

    switch (activeTab) {
      case "products":
        return (
          <div className="space-y-4">
            {/* Summary Cards */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.summary.total_products}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Products Sold
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.summary.total_quantity}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Quantity Sold
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">
                      LKR{" "}
                      {Number(
                        reportData.summary.total_sales || 0
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Quantity Sold</TableHead>
                  <TableHead>Total Sales</TableHead>
                  {currentUser.role !== "employee" && <TableHead>Average Price</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.products?.map((product) => (
                  <TableRow key={product.product_code}>
                    <TableCell className="font-medium">
                      {product.product_code}
                    </TableCell>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.quantity_sold}</TableCell>
                    <TableCell>
                      LKR {Number(product.total_sales || 0).toLocaleString()}
                    </TableCell>
                    {currentUser.role !== "employee" && (
                      <TableCell>
                        LKR {Number(product.average_price || 0).toLocaleString()}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "grn":
        return (
          <div className="space-y-4">
            {/* Summary Cards - Different for employees */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.summary.total_grns}
                    </div>
                    <p className="text-sm text-muted-foreground">Total GRNs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.summary.total_items}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </CardContent>
                </Card>
                {currentUser.role !== "employee" && (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                          LKR{" "}
                          {Number(
                            reportData.summary.total_cost || 0
                          ).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">
                          LKR{" "}
                          {Number(
                            reportData.summary.total_profit || 0
                          ).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total Profit
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GRN Code</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Items</TableHead>
                  {currentUser.role !== "employee" && (
                    <>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Total Selling</TableHead>
                      <TableHead>Profit</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.grns?.map((grn) => (
                  <TableRow key={grn.grn_code}>
                    <TableCell className="font-medium">
                      {grn.grn_code}
                    </TableCell>
                    <TableCell>{grn.grn_date}</TableCell>
                    <TableCell>{grn.department_name}</TableCell>
                    <TableCell>{grn.total_items}</TableCell>
                    {currentUser.role !== "employee" && (
                      <>
                        <TableCell>
                          LKR {Number(grn.total_cost || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          LKR {Number(grn.total_selling || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              grn.total_profit > 0 ? "default" : "destructive"
                            }
                          >
                            LKR {Number(grn.total_profit || 0).toLocaleString()}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "invoices":
        return (
          <div className="space-y-4">
            {/* Summary Cards */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.summary.total_invoices}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Invoices
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      LKR{" "}
                      {Number(
                        reportData.summary.total_revenue || 0
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Revenue
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">
                      LKR{" "}
                      {Number(
                        reportData.summary.cash_collected || 0
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cash Collected
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">
                      LKR{" "}
                      {Number(
                        reportData.summary.credit_given || 0
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Credit Given
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Net Total</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.invoices?.map((invoice) => (
                  <TableRow key={invoice.inv_no}>
                    <TableCell className="font-medium">
                      {invoice.inv_no}
                    </TableCell>
                    <TableCell>{invoice.inv_date}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.type === "tire"
                            ? "default"
                            : invoice.type === "other"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {invoice.type || "other"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      LKR {Number(invoice.net_total || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.payment_status === "paid"
                            ? "default"
                            : invoice.payment_status === "partial"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {invoice.payment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "customers":
        return (
          <div className="space-y-4">
            {/* Summary Cards */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.summary.total_customers}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Customers
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.summary.active_customers}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Active Customers
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">
                      LKR{" "}
                      {Number(
                        reportData.summary.total_revenue || 0
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Revenue
                    </p>
                  </CardContent>
                </Card>
                {currentUser.role !== "employee" && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">
                        LKR{" "}
                        {Number(
                          reportData.summary.total_credit_balance || 0
                        ).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Credit Balance
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Invoices</TableHead>
                  <TableHead>Total Spent</TableHead>
                  {currentUser.role !== "employee" && <TableHead>Credit Balance</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.customers?.map((customer) => (
                  <TableRow key={customer.customer_code}>
                    <TableCell className="font-medium">
                      {customer.customer_code}
                    </TableCell>
                    <TableCell>{customer.customer_name}</TableCell>
                    <TableCell>{customer.phone_no_01}</TableCell>
                    <TableCell>{customer.total_invoices}</TableCell>
                    <TableCell>
                      LKR {Number(customer.total_spent || 0).toLocaleString()}
                    </TableCell>
                    {currentUser.role !== "employee" && (
                      <TableCell>
                        <Badge
                          variant={
                            customer.credit_balance > 0 ? "secondary" : "outline"
                          }
                        >
                          LKR{" "}
                          {Number(customer.credit_balance || 0).toLocaleString()}
                        </Badge>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "stock":
        return (
          <div className="space-y-4">
            {/* Summary Cards */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.summary.total_products}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Products
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.summary.total_items}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">
                      {reportData.summary.low_stock_items}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Low Stock Items
                    </p>
                  </CardContent>
                </Card>
                {currentUser.role !== "employee" && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">
                        LKR{" "}
                        {Number(
                          reportData.summary.total_stock_value || 0
                        ).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Stock Value</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Current Stock</TableHead>
                  {currentUser.role !== "employee" && (
                    <>
                      <TableHead>Average Cost</TableHead>
                      <TableHead>Stock Value</TableHead>
                      <TableHead>Last GRN Date</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.stock?.map((item) => (
                  <TableRow key={item.product_code}>
                    <TableCell className="font-medium">
                      {item.product_code}
                    </TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.current_stock > 10
                            ? "default"
                            : item.current_stock > 5
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {item.current_stock}
                      </Badge>
                    </TableCell>
                    {currentUser.role !== "employee" && (
                      <>
                        <TableCell>
                          LKR {Number(item.average_cost || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          LKR {Number(item.stock_value || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {item.last_grn_date ? new Date(item.last_grn_date).toLocaleDateString() : "N/A"}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case "lowstock":
        return (
          <div className="space-y-4">
            {/* Summary Cards */}
            {reportData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">
                      {reportData.summary.total_low_stock}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total Low Stock
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">
                      {reportData.summary.critical_items}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Critical Items (≤5)
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">
                      {reportData.summary.low_items}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Low Items (6-10)
                    </p>
                  </CardContent>
                </Card>
                {currentUser.role !== "employee" && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">
                        LKR{" "}
                        {Number(
                          reportData.summary.total_value_at_risk || 0
                        ).toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Value at Risk
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Current Stock</TableHead>
                  {currentUser.role !== "employee" && (
                    <>
                      <TableHead>Average Cost</TableHead>
                      <TableHead>Stock Value</TableHead>
                      <TableHead>Last GRN Date</TableHead>
                    </>
                  )}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.low_stock?.map((item) => (
                  <TableRow key={item.product_code}>
                    <TableCell className="font-medium">
                      {item.product_code}
                    </TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.current_stock <= 5 ? "destructive" : "secondary"
                        }
                      >
                        {item.current_stock}
                      </Badge>
                    </TableCell>
                    {currentUser.role !== "employee" && (
                      <>
                        <TableCell>
                          LKR {Number(item.average_cost || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          LKR {Number(item.stock_value || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {item.last_grn_date ? new Date(item.last_grn_date).toLocaleDateString() : "N/A"}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge
                        variant={
                          item.current_stock <= 5 ? "destructive" : "secondary"
                        }
                      >
                        {item.current_stock <= 5 ? "CRITICAL" : "LOW"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            No data available for this report type
          </div>
        );
    }
  };

  // Filter products and customers based on search
  const filteredProducts = products.filter(product => 
    (product.product_name?.toLowerCase() || "").includes(productSearch.toLowerCase()) ||
    (product.product_code?.toLowerCase() || "").includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    (customer.customer_name?.toLowerCase() || "").includes(customerSearch.toLowerCase()) ||
    (customer.customer_code?.toLowerCase() || "").includes(customerSearch.toLowerCase()) ||
    (customer.phone_no_01 || "").includes(customerSearch)
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reports Dashboard
          </h1>
          <p className="text-muted-foreground">
            Generate and export comprehensive business reports
          </p>
          <div className="text-xs text-gray-500 mt-1">
            User: {currentUser.full_name} ({currentUser.user_code}) -{" "}
            <Badge variant={currentUser.role === "admin" ? "default" : "secondary"} className="text-xs">
              {currentUser.role === "admin" ? "Administrator" : currentUser.role === "employee" ? "Employee" : "Guest"}
            </Badge>
            {isDepartmentLocked && (
              <span className="ml-2 text-orange-600">
                <Lock className="inline h-3 w-3 mr-1" />
                Department Filter Locked to Your Department
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Select date range and filters for your report
            {isDepartmentLocked && (
              <div className="text-sm text-orange-600 mt-1">
                <Lock className="inline h-3 w-3 mr-1" />
                Showing data only from your department
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value })
                }
              />
            </div>

            {/* Product Filter with Search */}
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={filters.productCode}
                onValueChange={(value) =>
                  setFilters({ ...filters, productCode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <SelectItem value="all">All Products</SelectItem>
                  {filteredProducts.map((product) => (
                    <SelectItem
                      key={product.product_code}
                      value={product.product_code}
                    >
                      {product.product_name} ({product.product_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Filter with Search */}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={filters.customerCode}
                onValueChange={(value) =>
                  setFilters({ ...filters, customerCode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <SelectItem value="all">All Customers</SelectItem>
                  {filteredCustomers.map((customer) => (
                    <SelectItem
                      key={customer.customer_code}
                      value={customer.customer_code}
                    >
                      {customer.customer_name} ({customer.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Department Filter */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <div className="relative">
                <Select
                  value={filters.departmentId}
                  onValueChange={(value) => {
                    if (!isDepartmentLocked) {
                      setFilters({ ...filters, departmentId: value });
                    }
                  }}
                  disabled={isDepartmentLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    {!isDepartmentLocked && (
                      <SelectItem value="all">All Departments</SelectItem>
                    )}
                    {departments
                      .filter((dept) => dept.id && dept.department_name)
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.department_name}
                          {currentUser.department_id === dept.id && " (Your Department)"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {isDepartmentLocked && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
              {isDepartmentLocked && (
                <div className="text-xs text-gray-500 flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Department filter is locked based on your employee role
                </div>
              )}
              {!isDepartmentLocked && currentUser.role === "admin" && (
                <div className="text-xs text-blue-500 flex items-center">
                  <Unlock className="h-3 w-3 mr-1" />
                  You can filter by any department as an admin
                </div>
              )}
            </div>

            {/* Payment Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment method</Label>
              <Select
                value={filters.paymentStatus}
                onValueChange={(value) =>
                  setFilters({ ...filters, paymentStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All method</SelectItem>
                  <SelectItem value="credit">credit</SelectItem>
                  <SelectItem value="bankslip">bankslip</SelectItem>
                  <SelectItem value="card">card</SelectItem>
                  <SelectItem value="cash">cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="invoiceType">Invoice Type</Label>
              <Select
                value={filters.invoiceType}
                onValueChange={(value) =>
                  setFilters({ ...filters, invoiceType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tire">Tire</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="tire and other">Tire & Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2 mt-4">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={generatePDF}
              disabled={!reportData || loading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="grn" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            GRN
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="lowstock" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Stock
          </TabsTrigger>
        </TabsList>

        {/* Report Content */}
        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {activeTab === "lowstock"
                    ? "Low Stock Report (Below 10)"
                    : activeTab.charAt(0).toUpperCase() +
                      activeTab.slice(1) +
                      " Report"}
                  {reportData && (
                    <Badge variant="secondary" className="ml-2">
                      {reportData[activeTab]?.length || 0} records
                    </Badge>
                  )}
                  {isDepartmentLocked && (
                    <Badge variant="outline" className="ml-2">
                      Your Department Only
                    </Badge>
                  )}
                </span>
                {reportData && (
                  <div className="text-sm text-muted-foreground">
                    {filters.fromDate} to {filters.toDate}
                    {filters.invoiceType !== "all" && ` • Type: ${filters.invoiceType}`}
                    {isDepartmentLocked ? ` • Dept: ${getDepartmentName(currentUser.department_id)}` : 
                     filters.departmentId !== "all" && ` • Dept: ${getDepartmentName(filters.departmentId)}`}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData ? (
                renderReportTable()
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold">
                    No report generated
                  </h3>
                  <p>Use the filters above to generate a report</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
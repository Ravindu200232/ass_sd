import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ProductSearchCard from "../../components/BinCard/ProductSearchCard";
import DateFilterCard from "../../components/BinCard/DateFilterCard";
import DepartmentFilterCard from "../../components/BinCard/DepartmentFilterCard";
import LedgerTable from "../../components/BinCard/LedgerTable";
import SummaryCards from "../../components/BinCard/SummaryCards";

export default function BinCard() {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [ledger, setLedger] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadLedger();
    }
  }, [dateFrom, dateTo, selectedProduct, selectedDepartment]);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");

      setDepartments(res.data.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const loadLedger = async () => {
    if (!selectedProduct) {
      setLedger([]);
      return;
    }

    setLoading(true);
    try {
      const ledgerData = await fetchLedgerData(selectedProduct.product_code);
      setLedger(ledgerData);
    } catch (error) {
      console.error("Error loading ledger:", error);
      setLedger([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerData = async (productCode) => {
    console.log("Fetching ledger for product:", productCode, "department:", selectedDepartment);
    
    // Fetch both GRNs and Invoices
    const [grnRes, invoiceRes] = await Promise.all([
      api.get("/grns"),
      api.get("/invoices"),
    ]);

    const grns = grnRes.data.data || [];
    const invoices = invoiceRes.data.data || [];

    console.log("GRNs fetched:", grns.length);
    console.log("Invoices fetched:", invoices.length);

    // Process GRN data (debits)
    const debitRows = processGrns(grns, productCode);
    
    // Process Invoice data (credits)
    const creditRows = processInvoices(invoices, productCode);

    // Combine and prepare ledger
    return prepareLedger(debitRows, creditRows, productCode);
  };

// Process GRN data (debits)
const processGrns = (grns, productCode) => {
  const rows = [];

  grns.forEach((grn) => {
    const grnItems = grn.items || [];
    const matchingItems = grnItems.filter(
      (item) => item.product_code === productCode
    );

    matchingItems.forEach((item) => {
      const departmentName =
        grn.department?.department_name ||
        grn.department_name ||
        grn.department ||
        "N/A";

      const departmentId =
        grn.department_id ||
        grn.department?.id ||
        grn.department?.department_id;

      // ✅ Use hisqty for debit qty (fallback to qty)
      const debitQty =
        parseFloat(item.hisqty ?? item.his_qty ?? item.qty) || 0;

      // ✅ Amount should multiply by the same qty you show
      const unitCost = parseFloat(item.stock_price || item.unit_price || item.price || 0) || 0;

      rows.push({
        type: "GRN",
        date: item.created_at || grn.created_at || grn.date,
        reference: grn.grn_code || grn.grn_no || grn.reference || "-",
        debit_qty: debitQty,
        debit_amount: unitCost * debitQty,
        department: departmentName,
        department_id: departmentId ? departmentId.toString() : null,
        department_name: departmentName,
        product_code: productCode,

        // optional: keep both for debugging/view
        qty: parseFloat(item.qty) || 0,
        hisqty: parseFloat(item.hisqty) || 0,
      });
    });
  });

  console.log("GRN rows found:", rows.length);
  return rows;
};


  const processInvoices = (invoices, productCode) => {
    const rows = [];
    
    invoices.forEach((invoice) => {
      const invoiceItems = invoice.items || [];
      const matchingItems = invoiceItems.filter(
        (item) => item.product_code === productCode
      );

      matchingItems.forEach((item) => {
        const departmentName = invoice.department?.department_name || 
                              invoice.department_name || 
                              invoice.department || 
                              "N/A";
        const departmentId = invoice.department_id || 
                           invoice.department?.id || 
                           invoice.department?.department_id;
        
        rows.push({
          type: "Issue",
          date: item.created_at || invoice.created_at || invoice.date,
          reference: invoice.inv_no || invoice.invoice_no || invoice.reference || "-",
          credit_qty: parseFloat(item.qty) || 0,
          credit_amount: parseFloat(item.selling_price || item.unit_price || item.price || 0) * (parseFloat(item.qty) || 0),
          department: departmentName,
          department_id: departmentId ? departmentId.toString() : null,
          department_name: departmentName,
          product_code: productCode,
        });
      });
    });

    console.log("Invoice rows found:", rows.length);
    return rows;
  };

  const prepareLedger = (debitRows, creditRows, productCode) => {
    // Combine all rows
    const allRows = [...debitRows, ...creditRows];
    console.log("All rows before filtering:", allRows.length);
    
    // Apply department filter
    let filteredRows = allRows;
    
    if (selectedDepartment !== "all" && selectedDepartment) {
      console.log("Filtering by department:", selectedDepartment);
      
      // Get the selected department from the departments list to match properly
      const selectedDept = departments.find(dept => {
        const deptId = dept.department_id?.toString();
        const deptName = dept.department_name || dept.name;
        return (
          deptId === selectedDepartment || 
          deptName === selectedDepartment
        );
      });
      
      console.log("Selected department object:", selectedDept);
      
      if (selectedDept) {
        const deptId = selectedDept.department_id?.toString();
        const deptName = selectedDept.department_name || selectedDept.name;
        
        filteredRows = allRows.filter(row => {
          // Try multiple ways to match department
          const rowDeptId = row.department_id?.toString();
          const rowDeptName = row.department || row.department_name;
          
          const matches = (
            (rowDeptId && deptId && rowDeptId === deptId) ||
            (rowDeptName && deptName && rowDeptName.toLowerCase() === deptName.toLowerCase()) ||
            (rowDeptId && deptName && rowDeptId === selectedDepartment) ||
            (rowDeptName && rowDeptName.toLowerCase() === selectedDepartment.toLowerCase())
          );
          
          return matches;
        });
      } else {
        // If department not found in list, try direct matching
        filteredRows = allRows.filter(row => {
          const rowDeptId = row.department_id?.toString();
          const rowDeptName = row.department || row.department_name;
          
          return (
            rowDeptId === selectedDepartment ||
            (rowDeptName && rowDeptName.toLowerCase().includes(selectedDepartment.toLowerCase()))
          );
        });
      }
      
      console.log("Rows after department filter:", filteredRows.length);
    }
    
    // Sort by date
    filteredRows.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Filter by date range if specified
    if (dateFrom) {
      filteredRows = filteredRows.filter(
        (row) => new Date(row.date) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filteredRows = filteredRows.filter(
        (row) => new Date(row.date) <= new Date(dateTo)
      );
    }

    console.log("Rows after date filtering:", filteredRows.length);

    // Calculate opening balance (before dateFrom, considering department filter)
    const openingBalance = calculateOpeningBalance(allRows, filteredRows);
    
    // Apply opening balance
    let runningBalanceQty = openingBalance.qty;
    let runningBalanceAmount = openingBalance.amount;

    // Prepare ledger with running balances
    const ledgerWithBalances = [];
    
    // Get department name for opening balance row
    let departmentNameForOpening = "All Departments";
    if (selectedDepartment !== "all" && selectedDepartment) {
      const dept = departments.find(d => {
        const deptId = d.department_id?.toString();
        const deptName = d.department_name || d.name;
        return (
          deptId === selectedDepartment || 
          deptName === selectedDepartment
        );
      });
      departmentNameForOpening = dept?.department_name || dept?.name || selectedDepartment;
    }

    // Add opening balance row if needed
    if (openingBalance.qty !== 0 || openingBalance.amount !== 0 || ledgerWithBalances.length === 0) {
      ledgerWithBalances.push({
        type: "Opening Balance",
        date: dateFrom || filteredRows[0]?.date || new Date().toISOString(),
        reference: "-",
        department: departmentNameForOpening,
        debit_qty: 0,
        debit_amount: 0,
        credit_qty: 0,
        credit_amount: 0,
        balance_qty: runningBalanceQty,
        balance_amount: runningBalanceAmount,
        isOpening: true,
      });
    }

    // Add transaction rows
    filteredRows.forEach((row) => {
      runningBalanceQty += (row.debit_qty || 0) - (row.credit_qty || 0);
      runningBalanceAmount += (row.debit_amount || 0) - (row.credit_amount || 0);

      ledgerWithBalances.push({
        ...row,
        balance_qty: runningBalanceQty,
        balance_amount: runningBalanceAmount,
        isOpening: false,
      });
    });

    console.log("Final ledger rows:", ledgerWithBalances.length);
    return ledgerWithBalances;
  };

  const calculateOpeningBalance = (allRows, filteredRows) => {
    if (!dateFrom) return { qty: 0, amount: 0 };

    // Get all rows before the dateFrom, applying the same department filter
    let openingRows = allRows;
    
    if (selectedDepartment !== "all" && selectedDepartment) {
      const selectedDept = departments.find(dept => {
        const deptId = dept.department_id?.toString();
        const deptName = dept.department_name || dept.name;
        return (
          deptId === selectedDepartment || 
          deptName === selectedDepartment
        );
      });
      
      if (selectedDept) {
        const deptId = selectedDept.department_id?.toString();
        const deptName = selectedDept.department_name || selectedDept.name;
        
        openingRows = allRows.filter(row => {
          const rowDeptId = row.department_id?.toString();
          const rowDeptName = row.department || row.department_name;
          
          return (
            (rowDeptId && deptId && rowDeptId === deptId) ||
            (rowDeptName && deptName && rowDeptName.toLowerCase() === deptName.toLowerCase())
          );
        });
      }
    }

    // Filter by date (before dateFrom)
    openingRows = openingRows.filter(
      (row) => new Date(row.date) < new Date(dateFrom)
    );

    const openingQty = openingRows.reduce((total, row) => {
      return total + (row.debit_qty || 0) - (row.credit_qty || 0);
    }, 0);

    const openingAmount = openingRows.reduce((total, row) => {
      return total + (row.debit_amount || 0) - (row.credit_amount || 0);
    }, 0);

    console.log("Opening balance calculation:", { openingQty, openingAmount, rows: openingRows.length });
    return { qty: openingQty, amount: openingAmount };
  };

  const handleProductSelect = (product) => {

    setSelectedProduct(product);
  };

  const handleDepartmentChange = (departmentValue) => {
    console.log("Department changed to:", departmentValue);
    setSelectedDepartment(departmentValue);
  };

  const handleDateFromChange = (newDate) => {
    setDateFrom(newDate);
  };

  const handleDateToChange = (newDate) => {
    setDateTo(newDate);
  };

  const handleClearFilters = () => {
    setSelectedDepartment("all");
    setDateFrom("");
    setDateTo("");
    if (selectedProduct) {
      loadLedger();
    }
  };

  const filteredProducts = products.filter((product) =>
    `${product.product_name || ""} ${product.product_code || ""} ${product.brand || ""} ${product.size || ""} ${product.description || ""}`
      .toLowerCase()
      .includes(productSearch.toLowerCase())
  );

  // Get current department name for display
  const getCurrentDepartmentName = () => {
    if (selectedDepartment === "all" || !selectedDepartment) {
      return "All Departments";
    }
    
    const dept = departments.find(d => {
      const deptId = d.department_id?.toString();
      const deptName = d.department_name || d.name;
      return (
        deptId === selectedDepartment || 
        deptName === selectedDepartment
      );
    });
    
    return dept?.department_name || dept?.name || selectedDepartment;
  };

  return (
    <div className="p-6 space-y-6">
      <ProductSearchCard
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        filteredProducts={filteredProducts}
        onProductSelect={handleProductSelect}
      />

      {selectedProduct && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateFilterCard
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={handleDateFromChange}
              onDateToChange={handleDateToChange}
            />
            <DepartmentFilterCard
              departments={departments}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={handleDepartmentChange}
              onClearFilters={handleClearFilters}
              hasActiveFilters={selectedDepartment !== "all" || dateFrom || dateTo}
            />
          </div>
        </>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading ledger data...</p>
        </div>
      )}

      {!loading && ledger.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <span className="text-lg">Product Ledger (Cashbook Style)</span>
              {selectedProduct && (
                <div className="flex flex-col md:items-end text-sm text-gray-600">
                  <span className="font-semibold">
                    Product: {selectedProduct.product_name} ({selectedProduct.product_code})
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Department: {getCurrentDepartmentName()}
                    </span>
                    {(dateFrom || dateTo) && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Date Range: {dateFrom ? new Date(dateFrom).toLocaleDateString() : "Start"} - {dateTo ? new Date(dateTo).toLocaleDateString() : "End"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <LedgerTable ledger={ledger} />
            <SummaryCards ledger={ledger} />
          </CardContent>
        </Card>
      )}

      {!loading && selectedProduct && ledger.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium">No ledger data found</p>
            <p className="mt-1 text-sm max-w-md mx-auto">
              {selectedDepartment !== "all" 
                ? `No transactions found for "${selectedProduct.product_name}" in department "${getCurrentDepartmentName()}" within the specified date range.`
                : `No transactions found for "${selectedProduct.product_name}" within the specified date range.`}
            </p>
            <p className="mt-3 text-xs text-gray-400">
              Try adjusting your filters or select a different product.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
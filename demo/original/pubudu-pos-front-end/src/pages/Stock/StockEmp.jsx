// StockEmp.jsx (Modular Version)
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";

// Import Components
import { UserInfoHeader } from "../../components/StockEmp/UserInfoHeader";
import { SearchBar } from "../../components/StockEmp/SearchBar";
import { DepartmentFilter } from "../../components/StockEmp/DepartmentFilter";
import { LowStockFilter } from "../../components/StockEmp/LowStockFilter";
import { StockStatusSummary } from "../../components/StockEmp/StockStatusSummary";
import { SummaryCards } from "../../components/StockEmp/SummaryCards";
import { ProductTable } from "../../components/StockEmp/ProductTable";
import { Pagination } from "../../components/StockEmp/Pagination";
import { ProductDetailsPanel } from "../../components/StockEmp/ProductDetailsPanel";

export default function StockEmp() {
  const navigate = useNavigate();

  // State declarations
  const [grns, setGrns] = useState([]);
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowStockLimit, setLowStockLimit] = useState(10);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState({
    id: 0,
    user_code: "USER0000",
    full_name: "System User",
    username: "system",
    role: "guest",
    department_id: null,
  });
  const [isDepartmentLocked, setIsDepartmentLocked] = useState(false);

  // Data loading
  useEffect(() => {
    fetchUserFromLocalStorage();
    loadData();
  }, []);

  const fetchUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        
        setCurrentUser({
          id: user.id || 0,
          user_code: user.user_code || "USER0000",
          full_name: user.full_name || "System User",
          username: user.username || "system",
          role: user.role || "guest",
          department_id: user.department_id || null,
        });
        
        if (user.role === "employee") {
          setIsDepartmentLocked(true);
          if (user.department_id) {
            setDepartmentFilter(String(user.department_id));
          }
        }
      }
    } catch (error) {
      console.error("Error getting user from localStorage:", error);
      toast.error("Error loading user data");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const activeDepartmentId =
        storedUser.role === "employee" ? storedUser.department_id : null;

      const [grnsRes, productRes, deptRes] = await Promise.all([
        api.get("/grns", activeDepartmentId ? { params: { department_id: activeDepartmentId } } : undefined),
        api.get("/products"),
        api.get("/departments"),
      ]);

      setGrns(grnsRes.data.data || []);
      setProducts(productRes.data.data || []);
      
      const allDepartments = deptRes.data.data || [];
      if (storedUser.role === "employee" && storedUser.department_id) {
        const userDept = allDepartments.find(d => d.id === storedUser.department_id);
        setDepartments(userDept ? [userDept] : []);
        if (departmentFilter === "all") {
          setDepartmentFilter(String(storedUser.department_id));
        }
      } else {
        setDepartments(allDepartments);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed fetching stock data");
    } finally {
      setLoading(false);
    }
  };

  // Stock calculation
  const stockData = useMemo(() => {
    let filteredGrns = grns;
    
    if (departmentFilter !== "all") {
      filteredGrns = grns.filter(grn => 
        String(grn.department_id) === departmentFilter
      );
    }

    const allItems = filteredGrns.flatMap(grn => 
      (grn.items || [])
        .filter(item => item.status === 'on' && Number(item.qty || 0) > 0)
        .map(item => ({
          ...item,
          department_id: grn.department_id,
          department_name: grn.department?.department_name || "Unknown Department",
        }))
    );

    const productMap = new Map();

    allItems.forEach(item => {
      const productCode = item.product_code;
      
      if (!productMap.has(productCode)) {
        const productInfo = products.find(p => p.product_code === productCode);
        
        productMap.set(productCode, {
          product_code: productCode,
          product_name: item.product_name,
          brand: productInfo?.brand_name || "NO BRAND",
          category: productInfo?.category || "",
          total_qty: 0,
          selling_price: item.selling_price || 0,
          total_value: 0,
          grn_items: [],
          department_id: item.department_id || null
        });
      }

      const product = productMap.get(productCode);
      const qty = Number(item.qty) || 0;
      const actualCost = Number(item.actual_cost) || 0;
      
      product.total_qty += qty;
      product.total_value += (actualCost * qty);
      product.grn_items.push(item);
    });

    return Array.from(productMap.values());
  }, [grns, products, departmentFilter]);

  // Filtering
  const filtered = useMemo(() => {
    let result = stockData;

    const s = globalSearch.toLowerCase();
    if (s) {
      result = result.filter((row) => {
        return (
          row.product_code.toLowerCase().includes(s) ||
          row.product_name.toLowerCase().includes(s) ||
          row.brand.toLowerCase().includes(s) ||
          row.category.toLowerCase().includes(s)
        );
      });
    }

    if (showLowStock) {
      result = result.filter(row => row.total_qty <= lowStockLimit);
    }

    return result;
  }, [stockData, globalSearch, showLowStock, lowStockLimit]);

  // Totals calculation
  const totals = useMemo(() => {
    const criticalStock = filtered.filter(item => item.total_qty <= 5).length;
    const lowStock = filtered.filter(item => item.total_qty > 5 && item.total_qty <= lowStockLimit).length;
    const normalStock = filtered.filter(item => item.total_qty > lowStockLimit).length;
    
    return {
      totalItems: filtered.reduce((sum, item) => sum + item.total_qty, 0),
      totalValue: filtered.reduce((sum, item) => sum + item.total_value, 0),
      criticalStock,
      lowStock,
      normalStock
    };
  }, [filtered, lowStockLimit]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Helper function
  const getDepartmentName = (departmentId) => {
    if (!departmentId || departmentId === "all") return "All Departments";
    const department = departments.find((dept) => dept.id == departmentId);
    return department ? department.department_name : "Unknown Department";
  };

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-4">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <UserInfoHeader 
            currentUser={currentUser}
            isDepartmentLocked={isDepartmentLocked}
            getDepartmentName={getDepartmentName}
          />
          
          <div className="flex items-center gap-3">
            <SearchBar 
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
              setPage={setPage}
            />
            
            <Button 
              className="bg-indigo-600 text-white" 
              onClick={() => navigate("/grn/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add GRN
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DepartmentFilter 
                departmentFilter={departmentFilter}
                setDepartmentFilter={setDepartmentFilter}
                setPage={setPage}
                departments={departments}
                isDepartmentLocked={isDepartmentLocked}
                currentUser={currentUser}
              />
              
              <LowStockFilter 
                showLowStock={showLowStock}
                setShowLowStock={setShowLowStock}
                lowStockLimit={lowStockLimit}
                setLowStockLimit={setLowStockLimit}
              />
              
              <StockStatusSummary totals={totals} />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <SummaryCards 
          filtered={filtered}
          totals={totals}
          showLowStock={showLowStock}
        />

        {/* Product Table with Pagination */}
        <div className="mb-4">
          <ProductTable 
            paged={paged}
            loading={loading}
            showLowStock={showLowStock}
            lowStockLimit={lowStockLimit}
            total={total}
            setSelectedProduct={setSelectedProduct}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setPage={setPage}
            getDepartmentName={getDepartmentName}
            departmentFilter={departmentFilter}
            selectedProduct={selectedProduct}
          />
          
          <Pagination 
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </div>

        {/* Product Details Panel */}
        <div className="mt-4">
          <ProductDetailsPanel 
            selectedProduct={selectedProduct}
            lowStockLimit={lowStockLimit}
          />
        </div>
      </div>
    </div>
  );
}

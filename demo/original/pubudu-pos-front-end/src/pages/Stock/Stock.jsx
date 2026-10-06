// StockPremium.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building, Warehouse, Store, Factory, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Import Components
import { StockHeader } from '../../components/Stock/StockHeader';
import { StockFilters } from '../../components/Stock/StockFilters';
import { StockTable } from '../../components/Stock/StockTable';
import { StockPagination } from '../../components/Stock/StockPagination';
import { StockDetailsPanel } from '../../components/Stock/StockDetailsPanel';
import { useStockData } from '../../components/Stock/StockDataUtils';

export default function StockPremium() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State for selected department
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDepartmentGrid, setShowDepartmentGrid] = useState(true);

  // Data states with department filter
  const { 
    departments,
    loading, 
    error, 
    loadData,
    enhancedStock 
  } = useStockData(selectedDepartment, isAdmin);

  // Filter states
  const [globalSearch, setGlobalSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [columnFilters, setColumnFilters] = useState({
    product_code: '',
    product_name: '',
    brand_name: '',
    min_price: '',
    max_price: '',
    qty: '',
  });

  // UI states
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [activeRow, setActiveRow] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Initialize data
  useEffect(() => {
    loadData();
  }, []);

  // Calculate department summary statistics - FIXED NUMBER FORMATTING
  const departmentSummary = useMemo(() => {
    const summary = {};
    
    // Initialize all departments
    departments.forEach(dept => {
      summary[dept.id] = {
        id: dept.id,
        name: dept.department_name,
        code: dept.department_code,
        totalItems: 0,
        totalStock: 0,
        totalValue: 0, // Initialize as number 0
        lastUpdate: null
      };
    });

    // Calculate stats from enhancedStock
    enhancedStock.forEach(item => {
      if (summary[item.department_id]) {
        summary[item.department_id].totalItems += 1;
        summary[item.department_id].totalStock += item.total_qty || 0;
        
        // Calculate inventory value from current stock qty x actual cost
        const batchTotalValue = item.batches?.reduce((sum, batch) => {
          const qty = parseFloat(batch.qty) || 0;
          const price = parseFloat(batch.actual_cost) || 0;
          return sum + (qty * price);
        }, 0) || 0;
        
        summary[item.department_id].totalValue += batchTotalValue;
        
        // Find latest date
        if (item.batches && item.batches.length > 0) {
          item.batches.forEach(batch => {
            if (batch.date) {
              const batchDate = new Date(batch.date);
              if (!summary[item.department_id].lastUpdate || 
                  batchDate > new Date(summary[item.department_id].lastUpdate)) {
                summary[item.department_id].lastUpdate = batch.date;
              }
            }
          });
        }
      }
    });

    return Object.values(summary);
  }, [departments, enhancedStock]);

  // Unique brands list from all stock
  const uniqueBrands = useMemo(() => {
    const brands = new Set();
    enhancedStock.forEach(row => {
      if (row.brand_name && row.brand_name !== 'NO BRAND') brands.add(row.brand_name);
    });
    return ['all', ...Array.from(brands).sort()];
  }, [enhancedStock]);

  // Brand summary stats (items + total value for selected brand)
  const brandSummary = useMemo(() => {
    if (brandFilter === 'all') return null;
    const brandItems = enhancedStock.filter(row => row.brand_name === brandFilter);
    const totalItems = brandItems.length;
    const totalQty   = brandItems.reduce((s, r) => s + (r.total_qty || 0), 0);
    const totalValue = brandItems.reduce((s, r) => {
      return s + (r.batches?.reduce((sum, batch) => {
        const qty = parseFloat(batch.qty) || 0;
        const cost = parseFloat(batch.actual_cost) || 0;
        return sum + qty * cost;
      }, 0) || 0);
    }, 0);
    return { totalItems, totalQty, totalValue };
  }, [brandFilter, enhancedStock]);

  // Filtered data
  const filtered = useMemo(() => {
    const s = globalSearch.toLowerCase();
    let result = enhancedStock.filter(row => {
      // Brand filter
      if (brandFilter !== 'all' && row.brand_name !== brandFilter) return false;

      if (s) {
        const text = `${row.product_code} ${row.product_name} ${row.brand_name} ${row.department_name}`.toLowerCase();
        if (!text.includes(s)) return false;
      }

      if (columnFilters.product_code &&
        !row.product_code.toLowerCase().includes(columnFilters.product_code.toLowerCase())) return false;

      if (columnFilters.product_name &&
        !row.product_name.toLowerCase().includes(columnFilters.product_name.toLowerCase())) return false;

      if (columnFilters.brand_name &&
        !row.brand_name.toLowerCase().includes(columnFilters.brand_name.toLowerCase())) return false;

      const q = parseFloat(columnFilters.qty);
      if (!isNaN(q) && (row.total_qty || 0) < q) return false;

      // price range
      if (columnFilters.min_price || columnFilters.max_price) {
        const min = parseFloat(columnFilters.min_price) || -Infinity;
        const max = parseFloat(columnFilters.max_price) || Infinity;
        const hasMatch = row.prices?.some(p => p >= min && p <= max) || false;
        if (!hasMatch) return false;
      }

      return true;
    });

    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aVal, bVal;
        switch (sortConfig.key) {
          case 'min_price':
            aVal = a.prices?.length > 0 ? Math.min(...a.prices) : 0;
            bVal = b.prices?.length > 0 ? Math.min(...b.prices) : 0;
            break;
          case 'avg_price':
            aVal = a.prices?.length > 0 ? a.prices.reduce((sum, price) => sum + price, 0) / a.prices.length : 0;
            bVal = b.prices?.length > 0 ? b.prices.reduce((sum, price) => sum + price, 0) / b.prices.length : 0;
            break;
          case 'total_qty':
            aVal = a.total_qty || 0;
            bVal = b.total_qty || 0;
            break;
          case 'department_name':
            aVal = a.department_name || '';
            bVal = b.department_name || '';
            break;
          default:
            aVal = a[sortConfig.key] || '';
            bVal = b[sortConfig.key] || '';
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [enhancedStock, globalSearch, columnFilters, sortConfig, brandFilter]);

  // Admin-only price summary across currently filtered items
  const adminPriceSummary = useMemo(() => {
    if (!isAdmin) return null;
    let totalActualCost = 0;
    let totalSellingValue = 0;
    let totalStockPrice = 0;
    let totalMainBranch = 0;

    filtered.forEach(row => {
      row.batches?.forEach(batch => {
        const qty = parseFloat(batch.qty) || 0;
        totalActualCost   += qty * (parseFloat(batch.actual_cost)        || 0);
        totalSellingValue += qty * (parseFloat(batch.selling_price)       || 0);
        totalStockPrice   += qty * (parseFloat(batch.stock_price)         || 0);
        totalMainBranch   += qty * (parseFloat(batch.main_branch_price)   || 0);
      });
    });

    return { totalActualCost, totalSellingValue, totalStockPrice, totalMainBranch };
  }, [filtered, isAdmin]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowClick = (product_code, row) => {
    setActiveRow(product_code);
    setSelected(row);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleDepartmentSelect = (deptId) => {
    setSelectedDepartment(deptId);
    setShowDepartmentGrid(false);
    setPage(1);
    toast.success(`Viewing ${departments.find(d => d.id === deptId)?.department_name} stock`);
  };

  const handleViewAllDepartments = () => {
    setSelectedDepartment(null);
    setShowDepartmentGrid(false);
    setPage(1);
    toast.success('Viewing all departments stock');
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setShowDepartmentGrid(true);
    setActiveRow(null);
    setSelected(null);
  };

  const handleExport = () => {
    const headers = [
      'Product Code', 
      'Product Name', 
      'Brand', 
      'Category',
      'Department',
      'Min Selling Price', 
      'Avg Selling Price',
      'Min Main Branch Price',
      'Avg Actual Cost',
      'Quantity'
    ];
    
    const csvData = filtered.map(row => {
      const minPrice = row.prices?.length > 0 ? Math.min(...row.prices) : 0;
      const avgPrice = row.prices?.length > 0 ? row.prices.reduce((a, b) => a + b, 0) / row.prices.length : 0;
      const minMainBranch = row.main_branch_prices?.length > 0 ? Math.min(...row.main_branch_prices) : 0;
      const avgActualCost = row.actual_costs?.length > 0 ? row.actual_costs.reduce((a, b) => a + b, 0) / row.actual_costs.length : 0;

      return [
        row.product_code || '',
        row.product_name || '',
        row.brand_name || '',
        row.category || '',
        row.department_name || '',
        minPrice,
        avgPrice.toFixed(2),
        minMainBranch,
        avgActualCost.toFixed(2),
        row.total_qty || 0
      ];
    });
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-report-${selectedDepartment ? 'department-' + selectedDepartment : 'all'}.csv`;
    link.click();
    toast.success('CSV exported successfully');
  };

  // Get department icon based on name
  const getDepartmentIcon = (departmentName) => {
    if (!departmentName) return <Building className="h-6 w-6" />;
    const name = departmentName.toLowerCase();
    if (name.includes('warehouse') || name.includes('storage')) return <Warehouse className="h-6 w-6" />;
    if (name.includes('store') || name.includes('shop')) return <Store className="h-6 w-6" />;
    if (name.includes('factory') || name.includes('plant')) return <Factory className="h-6 w-6" />;
    return <Building className="h-6 w-6" />;
  };

  // Calculate total summary - FIXED NUMBER FORMATTING
  const totalSummary = useMemo(() => {
    const summary = {
      totalDepartments: departments.length,
      totalItems: 0,
      totalStock: 0,
      totalValue: 0,
    };

    departmentSummary.forEach(dept => {
      summary.totalItems += dept.totalItems;
      summary.totalStock += dept.totalStock;
      summary.totalValue += dept.totalValue;
    });

    return summary;
  }, [departmentSummary, departments]);

  // Format currency function
  const formatCurrency = (amount) => {
    if (isNaN(amount)) return 'LKR 0';
    return `LKR ${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format number function
  const formatNumber = (num) => {
    if (isNaN(num)) return '0';
    return parseFloat(num).toLocaleString('en-US');
  };

  return (
    <div className="p-4">
      {/* Header */}
      <StockHeader
        globalSearch={globalSearch}
        onGlobalSearchChange={(value) => {
          setGlobalSearch(value);
          setPage(1);
        }}
        onExport={handleExport}
        onAddGRN={() => navigate('/stock/grn')}
      />

      {showDepartmentGrid ? (
        // DEPARTMENT SELECTION GRID
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Departments */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Departments</p>
                  <p className="text-3xl font-bold text-blue-800 mt-2">
                    {formatNumber(totalSummary.totalDepartments)}
                  </p>
                </div>
                <Building className="h-10 w-10 text-blue-400" />
              </div>
            </div>

            {/* Total Items */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Items</p>
                  <p className="text-3xl font-bold text-green-800 mt-2">
                    {formatNumber(totalSummary.totalItems)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">IT</span>
                </div>
              </div>
            </div>

            {/* Total Stock */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Stock</p>
                  <p className="text-3xl font-bold text-purple-800 mt-2">
                    {formatNumber(totalSummary.totalStock)}
                  </p>
                </div>
                <Warehouse className="h-10 w-10 text-purple-400" />
              </div>
            </div>

            {/* Total Value */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Total Value</p>
                  <p className="text-3xl font-bold text-amber-800 mt-2">
                    {formatCurrency(totalSummary.totalValue)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 font-bold">₹</span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Grid */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#0A294F]">Select Department</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleViewAllDepartments}
                  className="px-4 py-2 bg-[#0A6ED1] text-white rounded-lg hover:bg-[#0854A1] transition-colors text-sm font-medium"
                >
                  View All Departments
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {departmentSummary.map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => handleDepartmentSelect(dept.id)}
                  className="
                    bg-white border border-gray-200 rounded-xl p-5 
                    shadow-sm hover:shadow-md hover:border-[#0A6ED1]/30 
                    hover:bg-blue-50/50 cursor-pointer 
                    transition-all duration-200
                    group
                  "
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="
                        p-2 bg-blue-100 rounded-lg 
                        group-hover:bg-blue-200 transition-colors
                      ">
                        {getDepartmentIcon(dept.name)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#0A294F] group-hover:text-[#0A6ED1]">
                          {dept.name || 'Unnamed Department'}
                        </h4>
                        <p className="text-xs text-gray-500">{dept.code || 'No Code'}</p>
                      </div>
                    </div>
                    <div className="
                      px-2 py-1 bg-green-100 text-green-800 
                      text-xs font-medium rounded-full
                    ">
                      {formatNumber(dept.totalItems)} items
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Stock Quantity */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stock Qty</span>
                      <span className="font-semibold text-[#0A294F]">
                        {formatNumber(dept.totalStock)}
                      </span>
                    </div>

                    {/* Stock Value */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Stock Value</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(dept.totalValue)}
                      </span>
                    </div>

                    {/* Last Update */}
                    {dept.lastUpdate && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Last Update</span>
                        <span className="text-xs text-gray-500">
                          {new Date(dept.lastUpdate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button className="
                      w-full py-2 text-sm font-medium text-[#0A6ED1]
                      bg-blue-50 rounded-lg hover:bg-blue-100
                      transition-colors group-hover:bg-blue-100
                    ">
                      View Stock Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // STOCK TABLE VIEW
        <div className="space-y-4">
          {/* Department Header */}
          <div className="
            bg-gradient-to-r from-blue-50 to-blue-100
            border border-blue-200 rounded-xl p-4
            flex items-center justify-between
          ">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDepartments}
                className="
                  p-2 bg-white border border-blue-200 rounded-lg
                  hover:bg-blue-50 transition-colors
                  flex items-center gap-2 text-sm text-[#0A294F]
                "
              >
                <X className="h-4 w-4" />
                Back to Departments
              </button>
              
              {selectedDepartment ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getDepartmentIcon(
                      departments.find(d => d.id === selectedDepartment)?.department_name || ''
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A294F]">
                      {departments.find(d => d.id === selectedDepartment)?.department_name || 'Unknown Department'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Live Stock • {formatNumber(filtered.length)} items
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0A294F]">All Departments</h3>
                    <p className="text-sm text-gray-600">
                      Combined Stock • {formatNumber(filtered.length)} items
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDepartmentGrid(true)}
                className="
                  px-4 py-2 border border-gray-300 rounded-lg
                  hover:bg-gray-50 transition-colors text-sm
                "
              >
                Switch Department
              </button>
            </div>
          </div>

          {/* Brand Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Brand Filter:</label>
            <select
              value={brandFilter}
              onChange={e => { setBrandFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
            >
              {uniqueBrands.map(b => (
                <option key={b} value={b}>{b === 'all' ? 'All Brands' : b}</option>
              ))}
            </select>

            {brandSummary && (
              <>
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-indigo-500 font-medium">Items</span>
                  <span className="text-sm font-bold text-indigo-800">{formatNumber(brandSummary.totalItems)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-emerald-500 font-medium">Total Qty</span>
                  <span className="text-sm font-bold text-emerald-800">{formatNumber(brandSummary.totalQty)}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-amber-500 font-medium">Total Value</span>
                  <span className="text-sm font-bold text-amber-800">{formatCurrency(brandSummary.totalValue)}</span>
                </div>
                <button
                  onClick={() => { setBrandFilter('all'); setPage(1); }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg px-2 py-1.5 hover:border-red-300 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              </>
            )}
          </div>

          {/* Admin Price Summary */}
          {isAdmin && adminPriceSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Actual Cost */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Total Actual Cost</p>
                <p className="text-lg font-bold text-red-800 break-all">{formatCurrency(adminPriceSummary.totalActualCost)}</p>
                <p className="text-xs text-red-400 mt-1">Σ qty × actual cost</p>
              </div>
              {/* Stock Price */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Total Stock Price</p>
                <p className="text-lg font-bold text-orange-800 break-all">{formatCurrency(adminPriceSummary.totalStockPrice)}</p>
                <p className="text-xs text-orange-400 mt-1">Σ qty × stock price</p>
              </div>
              {/* Selling Price */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Total Selling Value</p>
                <p className="text-lg font-bold text-green-800 break-all">{formatCurrency(adminPriceSummary.totalSellingValue)}</p>
                <p className="text-xs text-green-400 mt-1">Σ qty × selling price</p>
              </div>
              {/* Main Branch Price */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Total Main Branch</p>
                <p className="text-lg font-bold text-blue-800 break-all">{formatCurrency(adminPriceSummary.totalMainBranch)}</p>
                <p className="text-xs text-blue-400 mt-1">Σ qty × main branch price</p>
              </div>
            </div>
          )}

          {/* Main Table Container */}
          <div className="bg-white border rounded-xl shadow-sm">
            {/* Table Header with Pagination Info */}
            <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  Showing <b>{(page - 1) * pageSize + 1}</b> - <b>{Math.min(page * pageSize, total)}</b> of <b>{formatNumber(total)}</b> items
                </div>
                {selectedDepartment && (
                  <div className="
                    text-sm bg-blue-100 text-blue-800 
                    px-3 py-1 rounded-full flex items-center gap-2
                  ">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    Department: {departments.find(d => d.id == selectedDepartment)?.department_name || 'Unknown'}
                  </div>
                )}
              </div>
              
              <StockPagination
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>

            {/* Filters and Table */}
            <StockFilters
              columnFilters={columnFilters}
              onColumnFilterChange={(key, value) => setColumnFilters(prev => ({ ...prev, [key]: value }))}
            />

            {/* Table */}
            <StockTable
              data={paged}
              loading={loading}
              error={error}
              sortConfig={sortConfig}
              activeRow={activeRow}
              onSort={handleSort}
              onRowClick={handleRowClick}
            />

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex justify-between items-center bg-gray-50 rounded-b-xl">
                <div className="text-sm text-gray-600">
                  Page {formatNumber(page)} of {formatNumber(totalPages)}
                </div>
                <div className="flex gap-2">
                  <button
                    className="
                      px-4 py-2 border border-gray-300 rounded-lg 
                      text-sm font-medium hover:bg-gray-50 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="
                      px-4 py-2 border border-gray-300 rounded-lg 
                      text-sm font-medium hover:bg-gray-50 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Details Panel */}
          {selected && (
            <StockDetailsPanel selected={selected} />
          )}
        </div>
      )}
    </div>
  );
}

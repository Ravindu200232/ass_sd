import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Warehouse,
  Layers,
  Activity,
  Users as UsersIcon,
  Building as BuildingIcon,
  BarChart3,
} from 'lucide-react';

import api from '@/lib/api';

// Custom Components
import { KPICard } from '../../components/Dashboard/KPICard';
import { DashboardHeader } from '../../components/Dashboard/DashboardHeader';
import { LoadingSpinner } from '../../components/Dashboard/LoadingSpinner';
import { StockStatusCard } from '../../components/Dashboard/StockStatusCard';
import { StockProgressBar } from '../../components/Dashboard/StockProgressBar';
import { ValueIndicators } from '../../components/Dashboard/ValueIndicators';
import { StockActions } from '../../components/Dashboard/StockActions';
import { SalesPerformanceCard } from '../../components/Dashboard/SalesPerformanceCard';
import { QuickActionCard } from '../../components/Dashboard/QuickActionCard';
import { DepartmentInfoSection } from '../../components/Dashboard/DepartmentInfoSection';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({});
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ---------------------------------------------------------------------------
  // FIXED: LOAD ALL DATA IN ONE CONTROLLED PROCESS (NO RACE CONDITIONS)
  // ---------------------------------------------------------------------------
  const loadAllDashboardData = async () => {
    setLoading(true);

    try {
      // Employees must not request administrator-only dashboard resources.
      // The API remains responsible for denying unauthorised direct requests.
      const deptRes = await api.get("/departments");
      const departments = deptRes.data.data || [];
      let summary = {};
      let users = [];

      if (user?.role === "admin") {
        const [summaryRes, usersRes] = await Promise.all([
          api.get("/reports/dashboard-summary"),
          api.get("/all-users")
        ]);
        summary = summaryRes.data.data || {};
        users = usersRes.data.data || [];
      }

      const employees = users.filter(u => u.role === "employee");
      const activeEmployees = employees.filter(e => e.status === "active");

      // FIX: SINGLE SET STATE → NO RANDOM OVERRIDES
      setDashboardData({
        ...summary,
        departments: { count: departments.length },
        employees: {
          count: employees.length,
          active: activeEmployees.length,
        }
      });

      // Admin sees all departments, employee sees only their own
      if (user?.role === "admin") {
        setDepartmentInfo(departments);
      } else {
        setDepartmentInfo(
          departments.find(d => d.id === user?.department_id) || null
        );
      }

    } catch (err) {
      console.error("Dashboard load error:", err);
    }

    setLoading(false);
  };

  // ---------------------------------------------------------------------------
  // STOCK CALCULATION (UNCHANGED)
  // ---------------------------------------------------------------------------
  const fetchDepartmentStock = async () => {
    try {
      const [grnRes] = await Promise.all([
        api.get("/grns"),
      ]);

      let grns = grnRes.data.data || [];

      if (user?.role === "employee") {
        grns = grns.filter(g => String(g.department_id) === String(user.department_id));
      }

      const items = grns.flatMap(g => g.items?.filter(i => i.status === "on") || []);

      let totalItems = 0,
        totalValue = 0,
        lowStock = 0,
        criticalStock = 0;

      const totals = {};

      items.forEach(item => {
        const code = item.product_code;
        const qty = Number(item.qty) || 0;
        const price = Number(item.selling_price) || 0;

        if (!totals[code]) totals[code] = { qty: 0, value: 0 };
        totals[code].qty += qty;
        totals[code].value += qty * price;

        totalItems += qty;
        totalValue += qty * price;
      });

      Object.values(totals).forEach(p => {
        if (p.qty <= 5) criticalStock++;
        else if (p.qty <= 10) lowStock++;
      });

      setStockData({
        total_items: totalItems,
        total_value: totalValue,
        total_products: Object.keys(totals).length,
        avg_value: totalItems ? totalValue / totalItems : 0,
        low_stock_items: lowStock,
        critical_stock_items: criticalStock,
        status: getStockStatus(criticalStock, lowStock, Object.keys(totals).length),
      });

    } catch (error) {
      console.error("Stock fetch error:", error);
    }
  };

  const getStockStatus = (critical, low, total) => {
    if (!total) return "unknown";
    const percent = ((critical + low) / total) * 100;
    if (percent > 30) return "critical";
    if (percent > 15) return "warning";
    return "healthy";
  };

  // ---------------------------------------------------------------------------
  // ON LOAD → run fixed unified loader
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    loadAllDashboardData();
    fetchDepartmentStock();
  }, [user]);

  // ---------------------------------------------------------------------------
  // REFRESH BUTTON HANDLER
  // ---------------------------------------------------------------------------
  const refreshAllData = async () => {
    setRefreshing(true);
    await loadAllDashboardData();
    await fetchDepartmentStock();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner />;

  const actualStock = stockData || {
    total_items: 0,
    total_value: 0,
    avg_value: 0,
    low_stock_items: 0,
    critical_stock_items: 0,
    total_products: 0,
    status: "unknown"
  };

  // ---------------------------------------------------------------------------
  // KPI CARDS
  // ---------------------------------------------------------------------------
  const baseStats = [
    {
      title: "Today's Sales",
      value: `LKR ${dashboardData?.today?.sales?.toLocaleString() || "0"}`,
      icon: DollarSign,
      description: `${dashboardData?.today?.invoices_count || 0} invoices today`,
      percentage: dashboardData?.today?.sales_growth || 0
    },
    {
      title: "Monthly Sales",
      value: `LKR ${dashboardData?.this_month?.sales?.toLocaleString() || "0"}`,
      icon: TrendingUp,
      description: `${dashboardData?.this_month?.invoices_count || 0} invoices this month`,
      percentage: dashboardData?.this_month?.sales_growth || 0
    },
    {
      title: "Total Stock Items",
      value: `${actualStock.total_items.toLocaleString()}`,
      icon: Warehouse,
      description: `${actualStock.low_stock_items} low stock items`,
    },
    {
      title: "Stock Value",
      value: `LKR ${actualStock.total_value.toLocaleString()}`,
      icon: Layers,
      description: `Avg: LKR ${actualStock.avg_value.toLocaleString()}`,
    },
  ];

  const adminStats = [
    ...baseStats,
    {
      title: "Total Employees",
      value: dashboardData?.employees?.count || 0,
      icon: UsersIcon,
      description: `${dashboardData?.employees?.active || 0} active`,
    },
    {
      title: "Total Departments",
      value: dashboardData?.departments?.count || 0,
      icon: BuildingIcon,
      description: "Registered departments",
    },
  ];

  const employeeStats = [
    ...baseStats,
    {
      title: "Department Status",
      value: actualStock.status.toUpperCase(),
      icon: Activity,
      description: "Stock health",
    },
  ];

  const stats = user?.role === "admin" ? adminStats : employeeStats;

  // ---------------------------------------------------------------------------
  // QUICK ACTIONS
  // ---------------------------------------------------------------------------
  const quickActions = [
    ...(user?.role === "admin"
      ? [
          {
            title: "Manage Employees",
            icon: UsersIcon,
            iconBg: "bg-orange-500",
            buttonText: "Go to Employees",
            buttonBg: "bg-orange-600 hover:bg-orange-700",
            href: "/employees",
          },
          {
            title: "Manage Departments",
            icon: BuildingIcon,
            iconBg: "bg-cyan-500",
            buttonText: "Go to Departments",
            buttonBg: "bg-cyan-600 hover:bg-cyan-700",
            href: "/departments",
          },
        ]
      : []),
    {
      title: "Create Invoice",
      icon: ShoppingCart,
      iconBg: "bg-emerald-500",
      buttonText: "New Sale",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
      href: "/sales",
    },
    ...(user?.role === "admin"
      ? [
          {
            title: "Manage Products",
            icon: Package,
            iconBg: "bg-indigo-500",
            buttonText: "Go to Products",
            buttonBg: "bg-indigo-600 hover:bg-indigo-700",
            href: "/products",
          },
        ]
      : []),
    {
      title: "View Reports",
      icon: BarChart3,
      iconBg: "bg-primary",
      buttonText: "Open Reports",
      buttonBg: "border-primary text-primary",
      href: "/reports",
    },
  ];

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8 p-6">

      <DashboardHeader
        user={user}
        departmentInfo={departmentInfo}
        refreshing={refreshing}
        refreshAllData={refreshAllData}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <KPICard key={i} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Package className="h-6 w-6 text-primary" />
              Stock Overview
            </CardTitle>
            <CardDescription>
              {user?.role === "admin"
                ? "Company-wide stock summary"
                : "Your department inventory"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <StockStatusCard
              stockStatus={{
                total: actualStock.total_items,
                low: actualStock.low_stock_items,
                critical: actualStock.critical_stock_items,
                healthy:
                  actualStock.total_items -
                  (actualStock.low_stock_items + actualStock.critical_stock_items),
              }}
              totalItems={actualStock.total_items}
            />

            <StockProgressBar
              stockStatus={{
                total: actualStock.total_items,
                low: actualStock.low_stock_items,
                critical: actualStock.critical_stock_items,
                healthy:
                  actualStock.total_items -
                  (actualStock.low_stock_items + actualStock.critical_stock_items),
              }}
            />

            <ValueIndicators stockData={actualStock} />

            <StockActions user={user} />
          </CardContent>
        </Card>

        <SalesPerformanceCard dashboardData={dashboardData} />
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, i) => (
            <QuickActionCard key={i} {...action} />
          ))}
        </div>
      </div>

      {/* EMPLOYEE DEPARTMENT INFO */}
      {user?.role === "employee" && departmentInfo && !Array.isArray(departmentInfo) && (
        <DepartmentInfoSection
          user={user}
          departmentInfo={departmentInfo}
          stockData={actualStock}
        />
      )}
    </div>
  );
}

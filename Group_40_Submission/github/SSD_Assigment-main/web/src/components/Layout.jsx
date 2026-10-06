// SAPLayout.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  BarChart3,
  DollarSign,
  Menu,
  LogOut,
  Receipt,
  Tag,
  Star,
  Wrench,
  Building,
  TrendingUp,
  FileText,
  X,
} from "lucide-react";

/* -----------------------------------------------------------
   SIDEBAR
----------------------------------------------------------- */

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    // ---------- COMMON (ADMIN + EMPLOYEE)
    { key: "1", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "0", name: "Create Invoice", href: "/sales/create", icon: ShoppingCart },
    { key: "s", name: "Sales History", href: "/sales/history", icon: FileText },
    { key: "c", name: "Customers", href: "/customers", icon: Users },

    // ---------- EMPLOYEE ONLY
    ...(user?.role === "employee"
      ? [{ key: "x", name: "Live Stock", href: "/stockemp", icon: Warehouse }]
      : []),

    // ---------- ADMIN ONLY
    ...(user?.role === "admin"
      ? [
          { key: "2", name: "Products", href: "/products", icon: Package },
          { key: "3", name: "Live Stock", href: "/stock", icon: Warehouse },
          { key: "4", name: "Stock GRN", href: "/stock/grn", icon: Receipt },
          { key: "5", name: "Categories", href: "/categories", icon: Tag },
          { key: "6", name: "Brands", href: "/brands", icon: Star },
          { key: "7", name: "Employees", href: "/employees", icon: Wrench },
          { key: "8", name: "Departments", href: "/departments", icon: Building },
          { key: "9", name: "Bin Card", href: "/price", icon: FileText },
          { key: "e", name: "Profit", href: "/sales/profit", icon: TrendingUp },
          { key: "p", name: "Price Controller", href: "/priceManagement", icon: Tag },
          { key: "g", name: "Groups", href: "/groups", icon: Users },
          { key: "v", name: "Services", href: "/services", icon: Wrench },
          { key: "j", name: "GRN Adjust", href: "/stock/grn-adjust", icon: Receipt },
        ]
      : []),

    // ---------- COMMON (BOTTOM)
    { key: "r", name: "Reports", href: "/reports", icon: BarChart3 },
    { key: "d", name: "Discount Requests", href: "/discount-requests", icon: DollarSign },
  ];

  return (
    <div className="h-full w-64 flex flex-col text-white bg-gradient-to-b from-[#0A294F] via-[#0F3B70] to-[#0A6ED1] shadow-2xl">
      {/* Top Row: Logo + Close */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package />
          <div>
            <p className="font-bold">Tire Shop</p>
            <p className="text-xs opacity-60">ERP System</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                ${active ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.name}</span>
              <span className="text-xs opacity-60">{item.key}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full text-white justify-start gap-2">
              <div className="w-8 h-8 bg-[#0A6ED1] rounded-full flex items-center justify-center">
                {user?.full_name?.[0]}
              </div>
              <span>{user?.full_name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut size={14} className="mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

/* -----------------------------------------------------------
   KEYBOARD SHORTCUTS (F9 + KEY)
----------------------------------------------------------- */

const useKeyboardShortcuts = (navigation) => {
  const navigate = useNavigate();

  useEffect(() => {
    let f9 = false;

    const handler = (e) => {
      if (e.key === "F9") {
        f9 = true;
        return;
      }
      if (f9) {
        const item = navigation.find((n) => n.key === e.key.toLowerCase());
        if (item) navigate(item.href);
        f9 = false;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, navigation]);
};

/* -----------------------------------------------------------
   MAIN LAYOUT (NO HEADER, SIDEBAR HIDDEN)
----------------------------------------------------------- */

export default function SAPLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { key: "1", href: "/dashboard" },
    { key: "0", href: "/sales/create" },
    { key: "s", href: "/sales/history" },
    { key: "c", href: "/customers" },
    { key: "x", href: "/stockemp" },
    { key: "r", href: "/reports" },
    { key: "d", href: "/discount-requests" },
  ];

  useKeyboardShortcuts(navigation);

  return (
    <div className="h-screen bg-[#F5F7FB] overflow-hidden relative">
      {/* Floating Menu Button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 bg-[#0A294F] text-white shadow-lg hover:bg-[#0F3B70]"
      >
        <Menu />
      </Button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className="relative z-50 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* MAIN CONTENT (FULL SCREEN, NO HEADER) */}
      <main className="h-full overflow-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}

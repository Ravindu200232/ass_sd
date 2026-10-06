import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Products from "./pages/Product/Products";
import Stock from "./pages/Stock/Stock";
import Sales from "./pages/Invoice/CreateInvoice";
import Customers from "./pages/Customer/Customers";
import Reports from "./pages/Report/Reports";
import DiscountRequests from "./pages/DiscountRequests/DiscountRequests";
import StockGRN from "./pages/Stock/StockGRN";
import SalesHistory from "./pages/Invoice/SalesHistory";
import Categories from "./pages/Categories/Categories";
import Labours from "./pages/Labours/Labours";
import Brands from "./pages/Brands/Brands";
import GRNForm from "./pages/GRN/GrnForm";
import Departments from "./pages/Department/Department";
import StockEmp from "./pages/Stock/StockEmp";
import BinCard from "./pages/BinCard/BinCard";
import ProfitReport from "./pages/Report/ProfitReport";
import EmployeeManagement from "./pages/EmployeeManagement/EmployeeManagement";
import PriceController from "./pages/PriceController/PriceController";
import Group from "./pages/Group/Group";
import Services from "./pages/Services/Services";
import GrnAdjust from "./pages/Stock/GrnAdjust";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <Products />
                  </Layout>
                </ProtectedRoute>
              }
            />
             <Route
              path="/priceManagement"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <PriceController />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <Stock />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/stock/grn-adjust"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <GrnAdjust />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/grn/create"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <GRNForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock/grn"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <StockGRN />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Sales />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/profit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfitReport />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SalesHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <Categories />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/groups"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <Group/>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/services"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <Services/>
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/departments"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <Departments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <EmployeeManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/labours"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <Labours />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/brands"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <Brands />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Sales />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stockemp"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StockEmp />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Customers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/price"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BinCard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/discount-requests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DiscountRequests />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

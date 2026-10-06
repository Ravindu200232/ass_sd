import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import {
  Plus,
  Search,
  Edit,
  User,
  Filter,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";


import api from "@/lib/api";
import { toast } from "sonner";

// Import components
import { CustomerForm } from "@/components/customers/CustomerForm";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerViewDialog } from "@/components/customers/CustomerViewDialog";
import { PayCreditDialog } from "@/components/customers/PayCreditDialog";
import { AdjustCreditDialog } from "@/components/customers/AdjustCreditDialog";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPayCreditDialogOpen, setIsPayCreditDialogOpen] = useState(false);
  const [isAdjustCreditDialogOpen, setIsAdjustCreditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creditInvoices, setCreditInvoices] = useState([]);
  const [creditPaymentHistory, setCreditPaymentHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    address: "",
    phone_no_01: "",
    phone_no_02: "",
    nic_no: "",
    department_id: "",
    credit_limit: 0,
    credit_enabled: false,
    credit_balance: 0,
  });

  const [payCreditData, setPayCreditData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
    allocations: {},
  });

  const [adjustCreditData, setAdjustCreditData] = useState({
    adjustment_type: "decrease",
    amount: "",
    reason: "",
    adjustment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Check if user is admin
  const isAdmin = currentUser?.role === "admin";
  const isEmployee = currentUser?.role === "employee";
  const employeeDepartmentId = currentUser?.department_id;

  // Fetch initial data
  useEffect(() => {
    fetchCustomers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data.data || []);
    } catch (error) {
      toast.error("Error loading departments");
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data.data);
    } catch (error) {
      toast.error("Error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditInvoices = async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/credit-invoices`);
      setCreditInvoices(response.data.data);
    } catch (error) {
      toast.error("Error fetching credit invoices");
    }
  };

  const fetchCreditPaymentHistory = async (customerId) => {
    try {
      const response = await api.get(`/customers/${customerId}/credit-payment-history`);
      setCreditPaymentHistory(response.data.data);
    } catch (error) {
      toast.error("Error fetching credit payment history");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.customer_name.trim()) {
      toast.error("Customer name required");
      setIsSubmitting(false);
      return;
    }
    if (!formData.phone_no_01.trim()) {
      toast.error("Primary phone required");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success("Customer updated");
      } else {
        await api.post("/customers", formData);
        toast.success("Customer created");
      }

      setIsDialogOpen(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error("Error saving customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayCredit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!payCreditData.amount || parseFloat(payCreditData.amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      setIsSubmitting(false);
      return;
    }

    if (parseFloat(payCreditData.amount) > selectedCustomer.credit_balance) {
      toast.error("Payment amount exceeds credit balance");
      setIsSubmitting(false);
      return;
    }

    try {
      const allocationArray = Object.entries(payCreditData.allocations)
        .filter(([invoiceId, amount]) => amount && parseFloat(amount) > 0)
        .map(([invoiceId, amount]) => ({
          invoice_id: parseInt(invoiceId),
          payment_amount: parseFloat(amount),
        }));

      const payload = {
        amount: parseFloat(payCreditData.amount),
        payment_date: payCreditData.payment_date,
        notes: payCreditData.notes,
        allocation: allocationArray,
      };

      const response = await api.post(
        `/customers/${selectedCustomer.id}/pay-credit`,
        payload
      );

      if (response.data.success) {
        toast.success("Credit payment recorded successfully");
        setIsPayCreditDialogOpen(false);
        resetPayCreditData();

        // Refresh data
        await fetchCustomers();
        if (isViewDialogOpen) {
          await refreshCustomerData();
        }
      } else {
        toast.error(response.data.message || "Error processing payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      if (error.response) {
        toast.error(
          error.response.data.message || "Error processing credit payment"
        );
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustCredit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!adjustCreditData.amount || parseFloat(adjustCreditData.amount) < 0) {
      toast.error("Please enter a valid amount");
      setIsSubmitting(false);
      return;
    }

    if (!adjustCreditData.reason.trim()) {
      toast.error("Please provide a reason for the adjustment");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post(
        `/customers/${selectedCustomer.id}/adjust-credit`,
        adjustCreditData
      );

      toast.success("Credit balance adjusted successfully");
      setIsAdjustCreditDialogOpen(false);
      resetAdjustCreditData();

      // Refresh data
      await fetchCustomers();
      if (isViewDialogOpen) {
        await refreshCustomerData();
      }
    } catch (error) {
      toast.error("Error adjusting credit balance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshCustomerData = async () => {
    try {
      const customerResponse = await api.get(`/customers/${selectedCustomer.id}`);
      setSelectedCustomer(customerResponse.data.data);
      await fetchCreditInvoices(selectedCustomer.id);
      await fetchCreditPaymentHistory(selectedCustomer.id);
    } catch (error) {
      console.error("Error refreshing customer data:", error);
    }
  };

  const handleAllocationChange = (invoiceId, amount) => {
    setPayCreditData((prev) => ({
      ...prev,
      allocations: {
        ...prev.allocations,
        [invoiceId]: amount,
      },
    }));
  };

  const autoAllocatePayments = () => {
    if (!payCreditData.amount || payCreditData.amount <= 0) return;

    const unpaidInvoices = creditInvoices.filter((inv) => {
      const creditAllocated = inv.credit_allocated || 0;
      const creditPaid = inv.credit_paid || 0;
      return creditAllocated > 0 && creditPaid < creditAllocated;
    });

    let remainingAmount = parseFloat(payCreditData.amount);
    const newAllocations = {};

    // Auto-allocate to oldest invoices first
    for (const invoice of unpaidInvoices) {
      if (remainingAmount <= 0) break;

      const creditAllocated = invoice.credit_allocated || 0;
      const creditPaid = invoice.credit_paid || 0;
      const invoiceRemaining = creditAllocated - creditPaid;

      const allocateAmount = Math.min(remainingAmount, invoiceRemaining);

      if (allocateAmount > 0) {
        newAllocations[invoice.id] = allocateAmount.toFixed(2);
        remainingAmount -= allocateAmount;
      }
    }

    // If there's still remaining amount, allocate it to the first invoice
    if (remainingAmount > 0 && unpaidInvoices.length > 0) {
      const firstInvoiceId = unpaidInvoices[0].id;
      const currentAllocation = parseFloat(newAllocations[firstInvoiceId] || 0);
      newAllocations[firstInvoiceId] = (
        currentAllocation + remainingAmount
      ).toFixed(2);
    }

    setPayCreditData((prev) => ({
      ...prev,
      allocations: newAllocations,
    }));
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      customer_name: customer.customer_name,
      address: customer.address || "",
      phone_no_01: customer.phone_no_01,
      phone_no_02: customer.phone_no_02 || "",
      nic_no: customer.nic_no || "",
      department_id: customer.department_id || "",
      credit_limit: customer.credit_limit || 0,
      credit_enabled: customer.credit_enabled || false,
      credit_balance: customer.credit_balance || 0,
    });
    setIsDialogOpen(true);
  };

  const handleView = async (customer) => {
    try {
      const response = await api.get(`/customers/${customer.id}`);
      setSelectedCustomer(response.data.data);
      await fetchCreditInvoices(customer.id);
      await fetchCreditPaymentHistory(customer.id);
      setIsViewDialogOpen(true);
    } catch {
      toast.error("Error loading customer");
    }
  };

const handleDelete = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`);

    if (response.data.success) {
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } else {
      toast.error(response.data.message || "Error deleting customer");
    }
  } catch (error) {
    console.error("Delete error:", error);
    if (error.response?.status === 400) {
      toast.error(
        error.response.data.message || "Cannot delete customer with existing transactions",
        { duration: 5000 }
      );
    } else if (error.response?.status === 404) {
      toast.error("Customer not found");
    } else {
      toast.error("Failed to delete customer");
    }
  }
};


  const resetForm = () => {
    const baseForm = {
      customer_name: "",
      address: "",
      phone_no_01: "",
      phone_no_02: "",
      nic_no: "",
      credit_limit: 0,
      credit_enabled: false,
      credit_balance: 0,
    };

    if (isEmployee && employeeDepartmentId) {
      setFormData({
        ...baseForm,
        department_id: String(employeeDepartmentId),
      });
    } else {
      setFormData({
        ...baseForm,
        department_id: "",
      });
    }
    setEditingCustomer(null);
  };

  const resetPayCreditData = () => {
    setPayCreditData({
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
      allocations: {},
    });
  };

  const resetAdjustCreditData = () => {
    setAdjustCreditData({
      adjustment_type: "decrease",
      amount: "",
      reason: "",
      adjustment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  // Auto-allocate when payment dialog opens
  useEffect(() => {
    if (isPayCreditDialogOpen && payCreditData.amount) {
      autoAllocatePayments();
    }
  }, [isPayCreditDialogOpen, payCreditData.amount]);

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.nic_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_no_01?.includes(searchTerm);

    const matchesDepartment =
      departmentFilter === "all" ||
      String(customer.department_id) === departmentFilter ||
      (!customer.department_id && departmentFilter === "unassigned");

    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header
        isEmployee={isEmployee}
        isAdmin={isAdmin}
        currentUser={currentUser}
        employeeDepartmentId={employeeDepartmentId}
        departments={departments}
        onAddCustomer={() => {
          resetForm();
          setIsDialogOpen(true);
        }}
      />

      {/* Search and Filters */}
      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        departmentFilter={departmentFilter}
        setDepartmentFilter={setDepartmentFilter}
        isAdmin={isAdmin}
        isEmployee={isEmployee}
        employeeDepartmentId={employeeDepartmentId}
        departments={departments}
      />

      {/* Customer Table */}
      <CustomerTableCard
        customers={filteredCustomers}
        departments={departments}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchTerm={searchTerm}
        departmentFilter={departmentFilter}
      />

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingCustomer={editingCustomer}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onReset={resetForm}
        isEmployee={isEmployee}
        employeeDepartmentId={employeeDepartmentId}
        departments={departments}
        isLoading={isSubmitting}
      />

      {/* Customer View Dialog */}
      <CustomerViewDialog
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        customer={selectedCustomer}
        creditInvoices={creditInvoices}
        creditPaymentHistory={creditPaymentHistory}
        onEdit={handleEdit}
        onRefreshInvoices={() => selectedCustomer && fetchCreditInvoices(selectedCustomer.id)}
        onRefreshHistory={() => selectedCustomer && fetchCreditPaymentHistory(selectedCustomer.id)}
        onPayCredit={() => setIsPayCreditDialogOpen(true)}
        onAdjustCredit={() => setIsAdjustCreditDialogOpen(true)}
        isLoading={isSubmitting}
      />

      {/* Pay Credit Dialog */}
      <PayCreditDialog
        isOpen={isPayCreditDialogOpen}
        onOpenChange={setIsPayCreditDialogOpen}
        customer={selectedCustomer}
        creditInvoices={creditInvoices}
        payCreditData={payCreditData}
        setPayCreditData={setPayCreditData}
        onPayCredit={handlePayCredit}
        onAllocationChange={handleAllocationChange}
        onAutoAllocate={autoAllocatePayments}
        isLoading={isSubmitting}
      />

      {/* Adjust Credit Dialog */}
      <AdjustCreditDialog
        isOpen={isAdjustCreditDialogOpen}
        onOpenChange={setIsAdjustCreditDialogOpen}
        customer={selectedCustomer}
        adjustCreditData={adjustCreditData}
        setAdjustCreditData={setAdjustCreditData}
        onAdjustCredit={handleAdjustCredit}
        isLoading={isSubmitting}
      />
    </div>
  );
}

// Helper Components
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-64">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-neutral-300 border-t-neutral-900 mx-auto"></div>
        <p className="mt-3 text-neutral-900">Loading Customers...</p>
      </div>
    </div>
  );
}

function Header({
  isEmployee,
  isAdmin,
  currentUser,
  employeeDepartmentId,
  departments,
  onAddCustomer,
}) {
  return (
    <div
      className="
        w-full bg-white 
        border border-[#D8E1EB] 
        rounded-xl shadow-sm 
        px-6 py-4 
        flex flex-col md:flex-row 
        items-start md:items-center 
        justify-between gap-4
      "
    >
      {/* LEFT — Title & User Info */}
      <div className="w-full md:w-auto">
        <h1 className="text-2xl font-bold tracking-tight text-[#0A294F]">
          Customers
        </h1>

        <p className="text-[#5A6B7A] text-sm">
          Manage your customer directory and credit limits
        </p>

        <div className="h-1 w-20 bg-[#0A6ED1] rounded-full mt-2"></div>

        {/* User Badge */}
        <div className="mt-3">
          {isEmployee && (
            <UserBadge
              name={currentUser?.full_name}
              role={currentUser?.role}
              department={
                departments.find((d) => d.id === employeeDepartmentId)
                  ?.department_name || "Unknown"
              }
              variant="blue"
            />
          )}

          {isAdmin && (
            <UserBadge
              name={currentUser?.full_name}
              role="Administrator"
              variant="green"
            />
          )}
        </div>
      </div>

      {/* RIGHT — Add Customer Button */}
      <div className="w-full md:w-auto flex justify-start md:justify-end">
        <Button
          onClick={onAddCustomer}
          className="
            flex items-center gap-2
            bg-[#0A6ED1] hover:bg-[#085AA5]
            text-white font-semibold
            px-5 py-2.5 rounded-lg
            shadow-sm hover:shadow-md 
            transition-all w-full md:w-auto
          "
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>
    </div>
  );
}


function UserBadge({ name, role, department, variant = "blue" }) {
  const variantClasses = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800"
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <Badge className={variantClasses[variant]}>
        <User className="h-3 w-3 mr-1" />
        {name} ({role})
      </Badge>
      {department && (
        <Badge variant="outline" className="text-xs">
          Department: {department}
        </Badge>
      )}
    </div>
  );
}

function SearchFilters({
  searchTerm,
  setSearchTerm,
  departmentFilter,
  setDepartmentFilter,
  isAdmin,
  isEmployee,
  employeeDepartmentId,
  departments
}) {
  return (
    <Card className="border-blue-300/30 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-bold from-neutral-900 to-black">
          All Customers
        </CardTitle>
        <CardDescription className="text-gray-500">
          Search and manage customers
        </CardDescription>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-transparent bg-gradient-to-r from-neutral-900 to-black bg-clip-text" />
            <Input
              placeholder="Search by name, code, NIC, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-neutral-800 focus-visible:ring-neutral-900 focus-visible:ring-offset-0 text-neutral-900"
            />
          </div>

          {/* Department Filter - Show only to Admin */}
          {isAdmin && departments.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-blue-600" />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[200px] border-blue-400/50 focus-visible:ring-blue-600">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.department_name || dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee Department Display */}
          {isEmployee && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">
                Department: {departments.find(d => d.id === employeeDepartmentId)?.department_name || "Unknown"}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}

function CustomerTableCard({ customers, departments, onView, onEdit, onDelete, searchTerm, departmentFilter }) {
  return (
    <Card className="border-blue-300/30 shadow-md">
      <CardContent className="pt-6">
        <CustomerTable
          customers={customers}
          departments={departments}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {customers.length === 0 && (
          <NoResultsMessage searchTerm={searchTerm} departmentFilter={departmentFilter} />
        )}
      </CardContent>
    </Card>
  );
}

function NoResultsMessage({ searchTerm, departmentFilter }) {
  return (
    <p className="text-center text-blue-600 py-6">
      No results found for "{searchTerm}"
      {departmentFilter !== "all" ? ` in selected department` : ""}
    </p>
  );
}

function CustomerFormDialog({
  isOpen,
  onOpenChange,
  editingCustomer,
  formData,
  setFormData,
  onSubmit,
  onReset,
  isEmployee,
  employeeDepartmentId,
  departments,
  isLoading
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) onReset();
    }}>
      <DialogContent className="max-w-2xl border-blue-300 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-700">
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Fill customer details below
          </DialogDescription>
          {isEmployee && (
            <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              <User className="h-4 w-4 inline mr-1" />
              Customer will be automatically assigned to your department
            </div>
          )}
        </DialogHeader>

        <CustomerForm
          formData={formData}
          setFormData={setFormData}
          editingCustomer={editingCustomer}
          isEmployee={isEmployee}
          employeeDepartmentId={employeeDepartmentId}
          departments={departments}
          onSubmit={onSubmit}
          onReset={onReset}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
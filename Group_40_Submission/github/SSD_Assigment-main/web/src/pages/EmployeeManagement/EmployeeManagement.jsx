import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

// Import components
import { LoadingSpinner } from '../../components/EmployeeManagement/Loading';
import { EmptyState } from '../../components/EmployeeManagement/EmptyState';
import { PageHeader } from '../../components/EmployeeManagement/PageHeader';
import { SearchBar } from '../../components/EmployeeManagement/SearchBar';
import { EmployeeTable } from '../../components/EmployeeManagement/EmployeeTable';
import { EmployeeForm } from '../../components/EmployeeManagement/EmployeeForm';
import { ViewEmployeeDialog } from '../../components/EmployeeManagement/ViewEmployeeDialog';

export default function EmployeeManagement() {
  // State for employees data
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for departments
  const [departments, setDepartments] = useState([]);
  
  // State for form
  const [formData, setFormData] = useState({
    full_name: "",
    nic_no: "",
    phone_no_01: "",
    phone_no_02: "",
    username: "",
    password: "",
    role: "employee",
    department_id: "",
  });
  
  // State for dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State for selected employee
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Fetch employees and departments
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get("/all-users");
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/reports/filter-options");
      setDepartments(response.data.data?.departments || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.nic_no.trim()) {
      toast.error("NIC number is required");
      return false;
    }
    if (!formData.phone_no_01.trim()) {
      toast.error("Phone number 01 is required");
      return false;
    }
    if (!formData.username.trim()) {
      toast.error("Username is required");
      return false;
    }
    if (!isEditDialogOpen && !formData.password) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (!formData.department_id) {
      toast.error("Department is required");
      return false;
    }
    return true;
  };

  const handleCreateEmployee = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post("/register", formData);
      
      if (response.data.success) {
        toast.success("Employee created successfully");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchEmployees();
      } else {
        toast.error(response.data.message || "Failed to create employee");
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error(error.response?.data?.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Remove password if empty (keep current)
      const dataToSend = { ...formData };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }

      const response = await api.put(`/users/${selectedEmployee.id}`, dataToSend);
      
      if (response.data.success) {
        toast.success("Employee updated successfully");
        setIsEditDialogOpen(false);
        resetForm();
        fetchEmployees();
      } else {
        toast.error(response.data.message || "Failed to update employee");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error(error.response?.data?.message || "Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const response = await api.delete(`/users/${selectedEmployee.id}`);
      
      if (response.data.success) {
        toast.success("Employee deleted successfully");
        setIsDeleteDialogOpen(false);
        fetchEmployees();
      } else {
        toast.error(response.data.message || "Failed to delete employee");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(error.response?.data?.message || "Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      nic_no: "",
      phone_no_01: "",
      phone_no_02: "",
      username: "",
      password: "",
      role: "employee",
      department_id: "",
    });
    setSelectedEmployee(null);
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      full_name: employee.full_name || "",
      nic_no: employee.nic_no || "",
      phone_no_01: employee.phone_no_01 || "",
      phone_no_02: employee.phone_no_02 || "",
      username: employee.username || "",
      password: "",
      role: employee.role || "employee",
      department_id: employee.department_id?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return "Not assigned";
    const department = departments.find((dept) => dept.id == departmentId);
    return department ? department.department_name : "Unknown Department";
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "employee":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "manager":
        return "Manager";
      case "employee":
        return "Employee";
      default:
        return role;
    }
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    (employee.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (employee.nic_no?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (employee.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (employee.phone_no_01 || "").includes(searchTerm) ||
    (employee.phone_no_02 || "").includes(searchTerm)
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <PageHeader onAddClick={() => setIsCreateDialogOpen(true)} />

      {/* Search Bar */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        resultCount={filteredEmployees.length}
      />

      {/* Employees Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employees List
          </CardTitle>
          <CardDescription>
            All registered employees in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner />
          ) : filteredEmployees.length === 0 ? (
            <EmptyState 
              searchTerm={searchTerm} 
              onAddEmployee={() => setIsCreateDialogOpen(true)} 
            />
          ) : (
            <EmployeeTable
              employees={filteredEmployees}
              departments={departments}
              onView={handleViewEmployee}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteClick}
              getDepartmentName={getDepartmentName}
              getRoleBadgeVariant={getRoleBadgeVariant}
              getRoleDisplayName={getRoleDisplayName}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <span className="hidden"></span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Employee</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new employee account.
            </DialogDescription>
          </DialogHeader>
          
          <EmployeeForm
            formData={formData}
            departments={departments}
            onChange={handleInputChange}
            onSelectChange={handleSelectChange}
            isEdit={false}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEmployee} disabled={loading}>
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <ViewEmployeeDialog
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        employee={selectedEmployee}
        getDepartmentName={getDepartmentName}
        getRoleBadgeVariant={getRoleBadgeVariant}
        getRoleDisplayName={getRoleDisplayName}
      />

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          
          <EmployeeForm
            formData={formData}
            departments={departments}
            onChange={handleInputChange}
            onSelectChange={handleSelectChange}
            isEdit={true}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee} disabled={loading}>
              {loading ? "Updating..." : "Update Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold">{selectedEmployee?.full_name}</span>'s account
              and remove all their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmployee}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Delete Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

// Import components
import { LoadingSpinner } from "@/components/departments/LoadingSpinner";
import { EmptyState } from "@/components/departments/EmptyState";
import { DepartmentTable } from "@/components/departments/DepartmentTable";
import { DepartmentForm } from "@/components/departments/DepartmentForm";
import { SearchBar } from "@/components/departments/SearchBar";

// Import Alert Dialog components
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

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    department_name: "",
    department_address: "",
    department_contact: "",
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/departments");
      setDepartments(response.data?.data || []);
    } catch (error) {
      console.error("Fetch departments error:", error?.response?.data || error);
      toast.error("Error fetching departments");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      department_name: "",
      department_address: "",
      department_contact: "",
    });
    setEditingDepartment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.department_name.trim()) {
      toast.error("Department name is required");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingDepartment) {
        await api.put(`/departments/${editingDepartment.id}`, formData);
        toast.success("Department updated successfully");
      } else {
        await api.post("/departments", formData);
        toast.success("Department created successfully");
      }

      setIsDialogOpen(false);
      setEditingDepartment(null);
      resetForm();
      await fetchDepartments();
    } catch (error) {
      console.error("Save department error:", error?.response?.data || error);
      toast.error(
        `Error ${editingDepartment ? "updating" : "creating"} department`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      department_name: department.department_name || "",
      department_address: department.department_address || "",
      department_contact: department.department_contact || "",
    });
    setIsDialogOpen(true);
  };

  // Delete handlers
  const confirmDelete = (department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!departmentToDelete?.id) return;

    const id = departmentToDelete.id; // snapshot id (safe even if state changes)
    try {
      setIsDeleting(true);

      await api.delete(`/departments/${encodeURIComponent(id)}`);

      toast.success("Department deleted successfully");

      // Optimistic UI update + refresh
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      setDeleteDialogOpen(false);
      setDepartmentToDelete(null);

      // Optional: keep if you want server truth always
      // await fetchDepartments();
    } catch (error) {
      console.error("Delete department error:", error?.response?.data || error);

      const msg =
        error?.response?.data?.message ||
        "Error deleting department (maybe linked to other records)";

      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (isDeleting) return;
    setDeleteDialogOpen(false);
    setDepartmentToDelete(null);
  };

  const filteredDepartments = departments.filter(
    (department) =>
      department.department_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      department.department_code
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* HEADER */}
      <Header onAddDepartment={() => setIsDialogOpen(true)} />

      {/* MAIN CARD */}
      <Card className="shadow-md rounded-xl">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold">
            All Departments
          </CardTitle>
          <CardDescription>Organizational departments list</CardDescription>

          {/* SEARCH BAR */}
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or code..."
          />
        </CardHeader>

        <CardContent>
          {departments.length === 0 ? (
            <EmptyState onAddDepartment={() => setIsDialogOpen(true)} />
          ) : (
            <DepartmentTable
              departments={filteredDepartments}
              onEdit={handleEdit}
              onDelete={confirmDelete}
              searchTerm={searchTerm}
            />
          )}
        </CardContent>
      </Card>

      {/* DEPARTMENT FORM DIALOG */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg rounded-xl border border-indigo-200 shadow-xl bg-white/90 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "Add New Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Update department details"
                : "Enter department information"}
            </DialogDescription>
          </DialogHeader>

          <DepartmentForm
            formData={formData}
            setFormData={setFormData}
            editingDepartment={editingDepartment}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              {departmentToDelete ? (
                <>
                  Are you sure you want to delete the department:
                  <strong className="block mt-2 text-lg">
                    {departmentToDelete.department_name}
                  </strong>
                  {departmentToDelete.department_code && (
                    <span className="text-muted-foreground">
                      (Code: {departmentToDelete.department_code})
                    </span>
                  )}
                  <p className="mt-2 text-sm text-amber-600">
                    Note: This action cannot be undone.
                  </p>
                </>
              ) : (
                "This action cannot be undone. This will permanently delete the department."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>

            {/* IMPORTANT FIX:
                Prevent the dialog from auto-closing before the async delete runs. */}
            <AlertDialogAction
              disabled={isDeleting || !departmentToDelete}
              onClick={(e) => {
                e.preventDefault(); // keeps dialog open while deleting
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper Components
function Header({ onAddDepartment }) {
  return (
    <div
      className="
        w-full
        bg-white
        border border-[#D5E3F4]
        rounded-xl
        shadow-sm
        p-5
        flex flex-col md:flex-row
        items-start md:items-center
        justify-between
        gap-4
      "
    >
      {/* LEFT */}
      <div className="w-full md:w-auto">
        <h1 className="text-3xl font-bold tracking-tight text-[#0A294F]">
          Departments
        </h1>
        <p className="text-[#5A6B7A] text-sm">
          Manage departments and organizational units
        </p>
        <div className="h-1 w-16 bg-[#0A6ED1] rounded-full mt-2"></div>
      </div>

      {/* RIGHT */}
      <div className="w-full md:w-auto flex justify-start md:justify-end">
        <Button
          onClick={onAddDepartment}
          className="
            flex items-center gap-2
            bg-[#0A6ED1] hover:bg-[#085AA5]
            text-white font-semibold
            px-5 py-2.5 rounded-lg
            shadow-sm hover:shadow-md
            transition-all
            w-full md:w-auto
          "
        >
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>
    </div>
  );
}

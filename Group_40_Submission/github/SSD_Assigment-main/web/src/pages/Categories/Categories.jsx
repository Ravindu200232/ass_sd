import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import LoadingState from "../../components/Categories/LoadingState";
import EmptyState from "../../components/Categories/EmptyState";
import PageHeader from "../../components/Categories/PageHeader";
import SearchBar from "../../components/Categories/SearchBar";
import CategoriesTable from "../../components/Categories/CategoriesTable";

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

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    category_name: "",
    status: "active",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data.data);
    } catch (error) {
      toast.error("Error fetching categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category_name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast.success("Category updated successfully");
      } else {
        await api.post("/categories", formData);
        toast.success("Category created successfully");
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({
        category_name: "",
        status: "active",
      });
      fetchCategories();
    } catch (error) {
      toast.error(
        `Error ${editingCategory ? "updating" : "creating"} category`
      );
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      status: category.status,
    });
    setIsDialogOpen(true);
  };

  // Delete handlers
  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      toast.error("Error deleting category");
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const clearForm = () => {
    setFormData({
      category_name: "",
      status: "active",
    });
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.category_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      category.category_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 p-2 md:p-4">
      <PageHeader
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        editingCategory={editingCategory}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        clearForm={clearForm}
      />

      <CategoriesCard
        categories={categories}
        filteredCategories={filteredCategories}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setIsDialogOpen={setIsDialogOpen}
        onEdit={handleEdit}
        onDelete={confirmDelete}  // Changed to confirmDelete
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete ? (
                <>
                  Are you sure you want to delete the category:
                  <strong className="block mt-2 text-lg">
                    {categoryToDelete.category_name}
                  </strong>
                  {categoryToDelete.category_code && (
                    <span className="text-muted-foreground">
                      (Code: {categoryToDelete.category_code})
                    </span>
                  )}
                  <p className="mt-2 text-sm text-amber-600">
                    Note: This action cannot be undone.
                  </p>
                </>
              ) : (
                "This action cannot be undone. This will permanently delete the category."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoriesCard({
  categories,
  filteredCategories,
  searchTerm,
  setSearchTerm,
  setIsDialogOpen,
  onEdit,
  onDelete
}) {
  return (
    <Card className="shadow-md rounded-xl">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold">
          All Categories
        </CardTitle>
        <CardDescription>Manage your product categories</CardDescription>

        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </CardHeader>

      <CardContent>
        {categories.length === 0 ? (
          <EmptyState onAddClick={() => setIsDialogOpen(true)} />
        ) : (
          <>
            <CategoryCount 
              total={categories.length} 
              filtered={filteredCategories.length} 
            />
            <CategoriesTable
              filteredCategories={filteredCategories}
              searchTerm={searchTerm}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryCount({ total, filtered }) {
  return (
    <div className="mb-4 text-sm text-muted-foreground">
      Showing {filtered} of {total} categories
    </div>
  );
}
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import LoadingState from "../../components/Brands/LoadingState";
import EmptyState from "../../components/Brands/EmptyState";
import PageHeader from "../../components/Brands/PageHeader";
import BrandDialog from "../../components/Brands/BrandDialog";
import BrandsTable from "../../components/Brands/BrandsTable";
import SearchBar from "../../components/Brands/SearchBar";

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

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    brand_name: "",
    status: "active",
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get("/brands");
      setBrands(response.data.data);
    } catch (error) {
      showError("Error fetching brands");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) return;

    try {
      await saveBrand();
      resetForm();
      showSuccess();
      fetchBrands();
    } catch (error) {
      showSaveError();
    }
  };

  const isFormValid = () => {
    if (!formData.brand_name.trim()) {
      toast.error("Brand name is required");
      return false;
    }
    return true;
  };

  const saveBrand = async () => {
    if (editingBrand) {
      return await api.put(`/brands/${editingBrand.id}`, formData);
    } else {
      return await api.post("/brands", formData);
    }
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setEditingBrand(null);
    setFormData({
      brand_name: "",
      status: "active",
    });
  };

  const showSuccess = () => {
    const message = editingBrand 
      ? "Brand updated successfully" 
      : "Brand created successfully";
    toast.success(message);
  };

  const showSaveError = () => {
    const action = editingBrand ? "updating" : "creating";
    toast.error(`Error ${action} brand`);
  };

  const showError = (message) => {
    toast.error(message);
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      brand_name: brand.brand_name,
      status: brand.status,
    });
    setIsDialogOpen(true);
  };

  // Delete handlers
  const confirmDelete = (brand) => {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    try {
      await api.delete(`/brands/${brandToDelete.id}`);
      toast.success("Brand deleted successfully");
      fetchBrands();
    } catch (error) {
      toast.error("Error deleting brand");
    } finally {
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setBrandToDelete(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearForm = () => {
    setFormData({
      brand_name: "",
      status: "active",
    });
    setEditingBrand(null);
  };

  const filteredBrands = filterBrands(brands, searchTerm);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 p-2 md:p-4">
      <PageHeader onAddClick={() => setIsDialogOpen(true)} />

      <BrandDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingBrand={editingBrand}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        onClearForm={clearForm}
      />

      <BrandsCard
        brands={brands}
        filteredBrands={filteredBrands}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onDelete={confirmDelete}  // Changed from handleDelete to confirmDelete
        onAddClick={() => setIsDialogOpen(true)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              {brandToDelete ? (
                <>
                  Are you sure you want to delete the brand:
                  <strong className="block mt-2 text-lg">
                    {brandToDelete.brand_name}
                  </strong>
                  {brandToDelete.brand_code && (
                    <span className="text-muted-foreground">
                      (Code: {brandToDelete.brand_code})
                    </span>
                  )}
                  <p className="mt-2 text-sm text-amber-600">
                    Note: This action cannot be undone.
                  </p>
                </>
              ) : (
                "This action cannot be undone. This will permanently delete the brand."
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

function BrandsCard({ 
  brands, 
  filteredBrands, 
  searchTerm, 
  onSearchChange, 
  onEdit, 
  onDelete,
  onAddClick 
}) {
  return (
    <Card className="shadow-md rounded-xl">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold">All Brands</CardTitle>
        <CardDescription>Manage your product brands</CardDescription>
        
        <SearchBar value={searchTerm} onChange={onSearchChange} />
      </CardHeader>

      <CardContent>
        {brands.length === 0 ? (
          <EmptyState onAddClick={onAddClick} />
        ) : (
          <>
            <BrandCount 
              total={brands.length} 
              filtered={filteredBrands.length} 
            />
            <BrandsTable
              brands={brands}
              filteredBrands={filteredBrands}
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BrandCount({ total, filtered }) {
  return (
    <div className="mb-4 text-sm text-muted-foreground">
      Showing {filtered} of {total} brands
    </div>
  );
}

function filterBrands(brands, searchTerm) {
  if (!searchTerm) return brands;

  return brands.filter(
    (brand) =>
      brand.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.brand_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
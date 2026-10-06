import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Wrench,
  Check,
  XCircle,
  X as CloseIcon,
} from "lucide-react";
import api from "@/lib/api";

export default function ServicesManagerDialog({
  isOpen,
  onClose,
  onServiceAdded,
}) {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Service form states
  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "custom",
    status: true,
  });

  const categories = [
    "alignment",
    "balancing",
    "repair",
    "fitting",
    "maintenance",
    "installation",
    "tire",
    "wheel",
    "suspension",
    "brake",
    "electrical",
    "air-conditioning",
    "general",
    "custom",
  ];

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Load services on dialog open
  useEffect(() => {
    if (isOpen) {
      loadServices();
    }
  }, [isOpen]);

  // Filter services based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredServices(services);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = services.filter(
        (service) =>
          service.name?.toLowerCase().includes(term) ||
          service.description?.toLowerCase().includes(term) ||
          service.category?.toLowerCase().includes(term)
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      const allServices = res.data?.data || [];
      // Filter to show only active services
      const activeServices = allServices.filter(
        (s) => s.status === true || s.status === 1
      );
      setServices(activeServices);
      setFilteredServices(activeServices);
    } catch (err) {
      console.error("Error loading services:", err);
      
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setServiceForm({
      name: "",
      price: "",
      description: "",
      category: "custom",
      status: true,
    });
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setServiceForm({
      name: service.name,
      price: service.price.toString(),
      description: service.description || "",
      category: service.category || "custom",
      status: service.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setServiceForm({
      name: "",
      price: "",
      description: "",
      category: "custom",
      status: true,
    });
  };

  const handleSave = async () => {
    if (!serviceForm.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    if (!serviceForm.price || Number(serviceForm.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }

    const serviceData = {
      name: serviceForm.name.trim(),
      price: Number(serviceForm.price),
      description: serviceForm.description.trim(),
      category: serviceForm.category || "custom",
      status: serviceForm.status,
    };

    try {
      if (isAddingNew) {
        // Create new service
        const res = await api.post("/services", serviceData);
        if (res.data?.data) {
          toast.success("Service created successfully");
          await loadServices();
          
          // Notify parent if callback provided
          if (onServiceAdded) {
            onServiceAdded(res.data.data);
          }
        }
        setIsAddingNew(false);
      } else if (editingId) {
        // Update existing service
        const res = await api.put(`/services/${editingId}`, serviceData);
        if (res.data?.data) {
          toast.success("Service updated successfully");
          await loadServices();
        }
        setEditingId(null);
      }

      // Reset form
      setServiceForm({
        name: "",
        price: "",
        description: "",
        category: "custom",
        status: true,
      });
    } catch (err) {
      console.error("Error saving service:", err);
      toast.error(err.response?.data?.message || "Failed to save service");
    }
  };



    

  const handleAddToCart = (service) => {
    if (onServiceAdded) {
      onServiceAdded(service);
      toast.success(`${service.name} added to cart`);
    }
  };

  // Prevent background scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Dialog Container */}
        <div 
          className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Services Manager
                </h2>
                <p className="text-sm text-gray-500">
                  Create, edit, or delete services. Add services directly to cart.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden flex flex-col p-6">
            {/* Search and Add Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search services by name, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <Button onClick={handleAddNew} className="h-10">
                <Plus className="h-4 w-4 mr-2" />
                Add New Service
              </Button>
            </div>

            {/* Service Form (Add/Edit) */}
            {(isAddingNew || editingId) && (
              <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {isAddingNew ? "Add New Service" : "Edit Service"}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label className="font-medium">Service Name *</Label>
                    <Input
                      value={serviceForm.name}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, name: e.target.value })
                      }
                      placeholder="Enter service name"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Price (LKR) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, price: e.target.value })
                      }
                      placeholder="Enter price"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Category</Label>
                    <Select
                      value={serviceForm.category}
                      onValueChange={(value) =>
                        setServiceForm({ ...serviceForm, category: value })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Status</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant={serviceForm.status ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setServiceForm({ ...serviceForm, status: true })
                        }
                        className="h-9"
                      >
                        <Check className="h-3 w-3 mr-2" />
                        Active
                      </Button>
                      <Button
                        type="button"
                        variant={!serviceForm.status ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          setServiceForm({ ...serviceForm, status: false })
                        }
                        className="h-9"
                      >
                        <XCircle className="h-3 w-3 mr-2" />
                        Inactive
                      </Button>
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-2">
                    <Label className="font-medium">Description</Label>
                    <Textarea
                      value={serviceForm.description}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter service description"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="min-w-[140px]">
                    <Save className="h-4 w-4 mr-2" />
                    {isAddingNew ? "Create Service" : "Update Service"}
                  </Button>
                </div>
              </div>
            )}

            {/* Services Table */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-xl">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading services...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Wrench className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {searchTerm ? "No services found" : "No services available"}
                  </h3>
                  <p className="text-gray-500 text-center mb-4">
                    {searchTerm 
                      ? "Try adjusting your search terms" 
                      : "Get started by adding your first service"}
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={handleAddNew}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Service
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="font-semibold text-gray-700">Name</TableHead>
                        <TableHead className="font-semibold text-gray-700">Category</TableHead>
                        <TableHead className="font-semibold text-gray-700">Price (LKR)</TableHead>
                        <TableHead className="font-semibold text-gray-700">Description</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow 
                          key={service.id} 
                          className="hover:bg-gray-50 border-b border-gray-100"
                        >
                          <TableCell className="font-medium py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <Wrench className="h-4 w-4 text-blue-500" />
                              </div>
                              <span className="font-semibold">{service.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge 
                              variant="outline" 
                              className="capitalize px-3 py-1 border-blue-200 text-blue-700 bg-blue-50"
                            >
                              {service.category || "custom"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="font-bold text-green-700">
                              LKR {Number(service.price).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 max-w-xs">
                            <div className="text-gray-600 truncate">
                              {service.description || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              className={`px-3 py-1 ${
                                service.status
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {service.status ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddToCart(service)}
                                title="Add to cart"
                                className="h-8 w-8 p-0 border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(service)}
                                title="Edit service"
                                className="h-8 w-8 p-0 border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-lg">
            <div className="text-sm text-gray-600">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
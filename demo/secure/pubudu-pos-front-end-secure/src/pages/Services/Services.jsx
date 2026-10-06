import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Trash2,
  Edit,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { validateSpreadsheetFile } from "@/lib/validateUpload";

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  cost: "",
  status: true,
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importStatus, setImportStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [duplicateAlert, setDuplicateAlert] = useState(null);

  // ✅ Progress states
  const [importProgress, setImportProgress] = useState(0);
  const [importProgressText, setImportProgressText] = useState("");
  const [importCounts, setImportCounts] = useState({
    total: 0,
    processed: 0,
    success: 0,
    duplicates: 0,
    errors: 0,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const resetImportState = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportStatus(null);
    setImportProgress(0);
    setImportProgressText("");
    setImportCounts({ total: 0, processed: 0, success: 0, duplicates: 0, errors: 0 });
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setServices(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  // Check for duplicate service
  const checkDuplicate = (name, excludeId = null) => {
    return services.some(
      (service) =>
        service.name.toLowerCase().trim() === name.toLowerCase().trim() &&
        service.id !== excludeId
    );
  };

  // Calculate profit and profit percentage
  const calculateProfit = (price, cost) => {
    const profit = parseFloat(price) - parseFloat(cost);
    const profitPercentage = cost > 0 ? (profit / parseFloat(cost)) * 100 : 0;
    return {
      profit: profit.toFixed(2),
      percentage: profitPercentage.toFixed(1),
    };
  };

  const submit = async () => {
    if (!form.name || !form.price || !form.cost) {
      toast.error("Name, price, and cost are required");
      return;
    }

    const price = parseFloat(form.price);
    const cost = parseFloat(form.cost);

    if (cost > price) {
      toast.error("Cost cannot be higher than price");
      return;
    }

    // Check for duplicate
    if (checkDuplicate(form.name, editingId)) {
      setDuplicateAlert({
        title: "Duplicate Service",
        description: `A service named "${form.name}" already exists. Please use a different name.`,
        type: "destructive",
      });
      return;
    }

    try {
      const payload = {
        ...form,
        price,
        cost,
      };

      if (editingId) {
        await api.put(`/services/${editingId}`, payload);
        toast.success("Service updated");
        setDuplicateAlert(null);
      } else {
        await api.post("/services", payload);
        toast.success("Service created");
        setDuplicateAlert(null);
      }

      setForm(emptyForm);
      setEditingId(null);
      loadServices();
    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors.name && errors.name.includes("already exists")) {
          setDuplicateAlert({
            title: "Duplicate Service",
            description: `A service named "${form.name}" already exists. Please use a different name.`,
            type: "destructive",
          });
        }
      } else {
        toast.error("Failed to save service");
      }
    }
  };

  const editService = (s) => {
    setForm({
      name: s.name || "",
      category: s.category || "",
      description: s.description || "",
      price: s.price?.toString() || "",
      cost: s.cost?.toString() || "",
      status: s.status ?? true,
    });
    setEditingId(s.id);
    setDuplicateAlert(null);
  };

  const deleteService = async (id) => {
    if (!confirm("Delete this service?")) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success("Service deleted");
      loadServices();
    } catch {
      toast.error("Failed to delete service");
    }
  };

  const toggleServiceStatus = async (id, currentStatus) => {
    try {
      await api.put(`/services/${id}`, { status: !currentStatus });
      toast.success(`Service ${!currentStatus ? "activated" : "deactivated"}`);
      loadServices();
    } catch {
      toast.error("Failed to update service status");
    }
  };

  // Export functions
  const exportToExcel = () => {
    if (services.length === 0) {
      toast.error("No services to export");
      return;
    }

    try {
      const data = services.map((service) => {
        const profitData = calculateProfit(service.price, service.cost);
        return {
          Name: service.name,
          Category: service.category || "",
          Description: service.description || "",
          Price: service.price,
          Cost: service.cost,
          Profit: profitData.profit,
          "Profit %": profitData.percentage,
          Status: service.status ? "Active" : "Inactive",
          Created_At: new Date(service.created_at).toLocaleDateString(),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Services");

      const maxWidth = data.reduce((w, r) => Math.max(w, r.Name.length), 10);
      worksheet["!cols"] = [
        { wch: maxWidth },
        { wch: 15 },
        { wch: 30 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 12 },
      ];

      XLSX.writeFile(
        workbook,
        `services_export_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      toast.success(`Exported ${services.length} services to Excel`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export services");
    }
  };

  const exportSelectedToExcel = () => {
    if (selectedServices.length === 0) {
      toast.error("Please select services to export");
      return;
    }

    const selectedData = services
      .filter((service) => selectedServices.includes(service.id))
      .map((service) => {
        const profitData = calculateProfit(service.price, service.cost);
        return {
          Name: service.name,
          Category: service.category || "",
          Description: service.description || "",
          Price: service.price,
          Cost: service.cost,
          Profit: profitData.profit,
          "Profit %": profitData.percentage,
          Status: service.status ? "Active" : "Inactive",
        };
      });

    const worksheet = XLSX.utils.json_to_sheet(selectedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Services");
    XLSX.writeFile(
      workbook,
      `selected_services_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success(`Exported ${selectedServices.length} selected services`);
  };

  const exportTemplate = () => {
    const template = [
      {
        Name: "Sample Service 1",
        Category: "Repair",
        Description: "Service description",
        Price: "1000.00",
        Cost: "700.00",
        Status: "Active",
      },
      {
        Name: "Sample Service 2",
        Category: "Maintenance",
        Description: "Another service description",
        Price: "2000.00",
        Cost: "1500.00",
        Status: "Inactive",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const instructions = [
      ["IMPORT INSTRUCTIONS:"],
      ["1. Required columns: Name, Price, Cost"],
      ["2. Optional columns: Category, Description, Status"],
      ["3. Status values: 'Active' or 'Inactive' (default: Active)"],
      ["4. Price and Cost should be numbers (e.g., 1000.00)"],
      ["5. Cost must be less than or equal to Price"],
      ["6. Duplicate service names will be skipped"],
      ["7. Do not modify column headers"],
      ["8. Delete sample rows before adding your data"],
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");

    XLSX.writeFile(workbook, "services_import_template.xlsx");
    toast.success("Downloaded import template");
  };

  // Import functions
  // V-17: this checked the extension and nothing else - no size limit, so a
  // multi-gigabyte file renamed to .xlsx went straight into XLSX.read(), and no
  // signature check, so any bytes at all could reach the parser.
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const check = await validateSpreadsheetFile(file);
    if (!check.ok) {
      toast.error(check.error);
      event.target.value = "";
      return;
    }

    setImportFile(file);
    previewExcelFile(file);
  };

  const previewExcelFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("Excel file is empty");
          return;
        }

        const requiredColumns = ["Name", "Price", "Cost"];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(
          (col) => !Object.keys(firstRow).includes(col)
        );

        if (missingColumns.length > 0) {
          toast.error(`Missing required columns: ${missingColumns.join(", ")}`);
          return;
        }

        const existingNames = services.map((s) => s.name.toLowerCase().trim());

        const previewData = jsonData.slice(0, 10).map((row, index) => {
          const price = parseFloat(row.Price);
          const cost = parseFloat(row.Cost);
          const name = row.Name?.toString() || "";
          const isDuplicate = existingNames.includes(name.toLowerCase().trim());
          const isValid = !!(
            row.Name &&
            !isNaN(price) &&
            price > 0 &&
            !isNaN(cost) &&
            cost >= 0 &&
            cost <= price &&
            !isDuplicate
          );

          const profitData = calculateProfit(isNaN(price) ? 0 : price, isNaN(cost) ? 0 : cost);

          return {
            index: index + 1,
            name: row.Name || "",
            category: row.Category || "",
            description: row.Description || "",
            price: isNaN(price) ? 0 : price,
            cost: isNaN(cost) ? 0 : cost,
            profit: profitData.profit,
            profitPercentage: profitData.percentage,
            status: row.Status === "Inactive" ? false : true,
            isValid,
            isDuplicate,
          };
        });

        setImportPreview(previewData);
        setImportStatus({
          total: jsonData.length,
          preview: previewData.length,
          valid: previewData.filter((i) => i.isValid).length,
          invalid: previewData.filter((i) => !i.isValid).length,
          duplicates: previewData.filter((i) => i.isDuplicate).length,
        });

        toast.info(`Previewing ${previewData.length} of ${jsonData.length} rows`);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        toast.error("Failed to read Excel file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // ✅ Import with Progress Bar
const toStr = (v) => {
  if (v === undefined || v === null) return "";
  return String(v).trim();
};

const processImport = async () => {
  if (!importFile) {
    toast.error("Please select a file first");
    return;
  }

  try {
    setLoading(true);
    setImportProgress(0);
    setImportProgressText("Reading file...");

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData.length) {
          toast.error("Excel file is empty");
          setLoading(false);
          return;
        }

        setImportProgressText(`Preparing ${jsonData.length} rows...`);

        // Convert Excel rows -> API payload
        const items = jsonData
          .map((row) => {
            const name = toStr(row.Name);
            const price = parseFloat(row.Price);
            const cost = parseFloat(row.Cost);

            return {
              name,
              category: toStr(row.Category) || null,
              description: toStr(row.Description) || null,
              price: isNaN(price) ? 0 : price,
              cost: isNaN(cost) ? 0 : cost,
              status: row.Status === "Inactive" ? false : true,
            };
          })
          .filter((x) => x.name); // name required

        if (items.length === 0) {
          toast.error("No valid rows (Name required)");
          setLoading(false);
          return;
        }

        setImportProgress(30);
        setImportProgressText("Uploading to server (one shot)...");

        // ✅ ONE API CALL
        const res = await api.post("/services/import/bulk", { items });

        setImportProgress(90);
        setImportProgressText("Finalizing...");

        const info = res?.data?.data;

        toast.success(
          `Import Done: ${info?.inserted ?? 0} created, ${info?.skipped ?? 0} skipped`,
          { duration: 10000 }
        );

        setImportProgress(100);
        setImportProgressText("Done");

        resetImportState();
        setImportModalOpen(false);
        await loadServices();
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.message || "Import failed", { duration: 10000 });
      } finally {
        setLoading(false);
        setImportProgressText("");
      }
    };

    reader.readAsArrayBuffer(importFile);
  } catch (error) {
    console.error(error);
    toast.error("Import failed");
    setLoading(false);
  }
};

  const toggleSelectService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((serviceId) => serviceId !== id) : [...prev, id]
    );
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(filteredServices.map((s) => s.id));
    }
  };

  const deleteSelected = async () => {
    if (selectedServices.length === 0) {
      toast.error("Please select services to delete");
      return;
    }

    if (!confirm(`Delete ${selectedServices.length} selected services?`)) return;

    try {
      setLoading(true);
      const batchSize = 10;
      for (let i = 0; i < selectedServices.length; i += batchSize) {
        const batch = selectedServices.slice(i, i + batchSize);
        await Promise.all(batch.map((id) => api.delete(`/services/${id}`).catch(() => null)));
      }

      toast.success(`Deleted ${selectedServices.length} services`);
      setSelectedServices([]);
      await loadServices();
    } catch {
      toast.error("Failed to delete selected services");
    } finally {
      setLoading(false);
    }
  };

  const updateSelectedStatus = async (status) => {
    if (selectedServices.length === 0) {
      toast.error("Please select services to update");
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        selectedServices.map((id) => api.put(`/services/${id}`, { status }).catch(() => null))
      );

      toast.success(
        `Updated ${selectedServices.length} services to ${status ? "Active" : "Inactive"}`
      );
      await loadServices();
    } catch {
      toast.error("Failed to update selected services");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Services Management</h1>
          <p className="text-gray-500">Manage your services, import/export in bulk</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportTemplate}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Template
          </Button>

          <Button variant="outline" onClick={exportToExcel} disabled={services.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export All ({services.length})
          </Button>

          <Button onClick={() => setImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
        </div>
      </div>

      {/* Create/Edit */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">{editingId ? "Edit Service" : "Create New Service"}</h2>

        {duplicateAlert && (
          <Alert variant={duplicateAlert.type} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{duplicateAlert.title}</AlertTitle>
            <AlertDescription>{duplicateAlert.description}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Tire Replacement"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (duplicateAlert) setDuplicateAlert(null);
              }}
              className={checkDuplicate(form.name, editingId) ? "border-red-500" : ""}
            />
            {checkDuplicate(form.name, editingId) && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                This service name already exists
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Repair, Maintenance"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (LKR) *</Label>
            <Input
              id="price"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost (LKR) *</Label>
            <Input
              id="cost"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </div>

          {form.price && form.cost && parseFloat(form.cost) <= parseFloat(form.price) && (
            <div className="md:col-span-2 grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-500">Profit</div>
                <div className="text-lg font-bold text-green-600">
                  LKR {calculateProfit(form.price, form.cost).profit}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Profit %</div>
                <div className="text-lg font-bold text-blue-600">
                  {calculateProfit(form.price, form.cost).percentage}%
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border rounded-md"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value === "true" })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the service..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={loading || checkDuplicate(form.name, editingId)}>
            <Plus className="h-4 w-4 mr-2" />
            {editingId ? "Update Service" : "Create Service"}
          </Button>

          {editingId && (
            <Button
              variant="outline"
              onClick={() => {
                setForm(emptyForm);
                setEditingId(null);
                setDuplicateAlert(null);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>

      {/* List */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold">Services List</h2>
            <p className="text-sm text-gray-500">
              Total: {services.length} services • Showing: {filteredServices.length}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />

            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="h-9 px-3">
                  {selectedServices.length} selected
                </Badge>

                <Button size="sm" variant="outline" onClick={() => updateSelectedStatus(true)} disabled={loading}>
                  <Check className="h-4 w-4 mr-2" />
                  Activate
                </Button>

                <Button size="sm" variant="outline" onClick={() => updateSelectedStatus(false)} disabled={loading}>
                  <X className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>

                <Button size="sm" variant="outline" onClick={exportSelectedToExcel} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>

                <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No services found. {searchTerm && "Try a different search term."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={
                        selectedServices.length === filteredServices.length && filteredServices.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Service</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Profit</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => {
                  const profitData = calculateProfit(service.price, service.cost);
                  const isProfitable = parseFloat(profitData.profit) > 0;

                  return (
                    <tr key={service.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => toggleSelectService(service.id)}
                          className="h-4 w-4 rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{service.category || <span className="text-gray-400">-</span>}</td>
                      <td className="py-3 px-4 font-medium">LKR {parseFloat(service.price).toLocaleString()}</td>
                      <td className="py-3 px-4">LKR {parseFloat(service.cost).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className={`font-medium ${isProfitable ? "text-green-600" : "text-red-600"}`}>
                            LKR {profitData.profit}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {profitData.percentage}%
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`cursor-pointer ${
                            service.status
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          onClick={() => toggleServiceStatus(service.id, service.status)}
                        >
                          {service.status ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => editService(service)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteService(service.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Import Services from Excel</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loading} // ✅ prevent closing while importing
                  onClick={() => {
                    setImportModalOpen(false);
                    resetImportState();
                  }}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />

                  {!importFile ? (
                    <>
                      <p className="text-lg font-medium mb-2">Upload Excel File</p>
                      <p className="text-gray-500 mb-4">Upload .xlsx, .xls, or .csv file with service data</p>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        disabled={loading}
                      />
                      <Button asChild disabled={loading}>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">File Selected</p>
                      <p className="text-gray-500 mb-2">{importFile.name}</p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          disabled={loading}
                          onClick={() => {
                            resetImportState();
                          }}
                        >
                          Change File
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Notes */}
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-800" />
                  <AlertTitle className="text-blue-800">Import Notes</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Duplicate service names will be automatically skipped</li>
                      <li>Cost must be less than or equal to Price</li>
                      <li>All prices and costs must be valid numbers</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* ✅ Progress Bar */}
                {loading && importFile && (
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="text-gray-700">{importProgressText || "Importing..."}</div>
                      <div className="font-medium">{importProgress}%</div>
                    </div>

                    <Progress value={importProgress} />

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-gray-500">Total</div>
                        <div className="font-semibold">{importCounts.total}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-gray-500">Processed</div>
                        <div className="font-semibold">{importCounts.processed}</div>
                      </div>
                      <div className="bg-green-50 rounded p-2">
                        <div className="text-green-600">Success</div>
                        <div className="font-semibold text-green-700">{importCounts.success}</div>
                      </div>
                      <div className="bg-yellow-50 rounded p-2">
                        <div className="text-yellow-600">Duplicates</div>
                        <div className="font-semibold text-yellow-700">{importCounts.duplicates}</div>
                      </div>
                      <div className="bg-red-50 rounded p-2">
                        <div className="text-red-600">Errors</div>
                        <div className="font-semibold text-red-700">{importCounts.errors}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {importPreview.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Preview ({importPreview.length} rows)</h3>

                    {importStatus && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-500">Total Rows</div>
                          <div className="text-xl font-bold">{importStatus.total}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-500">In Preview</div>
                          <div className="text-xl font-bold">{importStatus.preview}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <div className="text-sm text-green-600">Valid</div>
                          <div className="text-xl font-bold text-green-700">{importStatus.valid}</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded">
                          <div className="text-sm text-yellow-600">Duplicates</div>
                          <div className="text-xl font-bold text-yellow-700">{importStatus.duplicates || 0}</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded">
                          <div className="text-sm text-red-600">Invalid</div>
                          <div className="text-xl font-bold text-red-700">{importStatus.invalid}</div>
                        </div>
                      </div>
                    )}

                    {importStatus?.duplicates > 0 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Duplicate Services Found</AlertTitle>
                        <AlertDescription>
                          {importStatus.duplicates} duplicate services will be skipped during import.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-2 px-3 text-left text-sm font-medium">#</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Name</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Category</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Price</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Cost</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Profit</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Status</th>
                            <th className="py-2 px-3 text-left text-sm font-medium">Valid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row) => (
                            <tr key={row.index} className="border-t">
                              <td className="py-2 px-3">{row.index}</td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  {row.name}
                                  {row.isDuplicate && (
                                    <Badge variant="outline" className="text-xs">
                                      Duplicate
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-3">{row.category || "-"}</td>
                              <td className="py-2 px-3">LKR {row.price.toLocaleString()}</td>
                              <td className="py-2 px-3">LKR {row.cost.toLocaleString()}</td>
                              <td className="py-2 px-3">
                                <div className="flex flex-col">
                                  <div
                                    className={`font-medium ${
                                      parseFloat(row.profit) > 0 ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    LKR {row.profit}
                                  </div>
                                  <div className="text-xs text-gray-500">{row.profitPercentage}%</div>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant={row.status ? "default" : "outline"}>
                                  {row.status ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="py-2 px-3">
                                {row.isValid ? (
                                  <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    {row.isDuplicate && <span className="text-xs text-red-500">Duplicate</span>}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    disabled={loading}
                    onClick={() => {
                      setImportModalOpen(false);
                      resetImportState();
                    }}
                  >
                    Cancel
                  </Button>

                  <Button onClick={processImport} disabled={!importFile || loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Services
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

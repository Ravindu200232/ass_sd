/* =========================================================
   pages/Products.jsx  (FULL UPDATED VERSION)
   - Fix: Type filter not working (case mismatch BRAND NEW vs Brand New)
   - Fix: safer string handling for Select values
========================================================= */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import api from "@/lib/api";
import { toast } from "sonner";
import XLSX from "xlsx/dist/xlsx.full.min.js";

// Import components
import { LoadingSpinner } from "../../components/Products/Loading";
import { PageHeader } from "../../components/Products/PageHeader";
import { SearchFilters } from "../../components/Products/SearchFilters";
import {
  ProductsTable,
  EmptyTableRow,
} from "../../components/Products/ProductsTable";
import { PaginationControls } from "../../components/Products/Pagination";
import { ProductFormDialog } from "../../components/Products/ProductFormDialog";
import { ImportDialog } from "../../components/Products/ImportDialog";

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
import { validateSpreadsheetFile, validateRowCount } from "@/lib/validateUpload";

/**
 * IMPORTANT:
 * In your DB screenshot, type values are like:
 * - "BRAND NEW"
 * - "Local"
 * So we normalize comparisons to make filters always work.
 */
const typeOptions = [
  "Brand New",
  "Recondition",
  "Used",
  "Imported",
  "Local",
  "Rebuild",
];

const emptyForm = {
  product_name: "",
  description: "",
  brand_name: "none",
  category: "none",
  group: "",
  size: "",
  pattern: "",
  weight: "",
  type: "",
};

// Helpers
const normalizeString = (str) => {
  if (str === undefined || str === null) return "";
  return str.toString().trim().toLowerCase();
};

const toStr = (v) => {
  if (v === undefined || v === null) return "";
  return String(v).trim();
};

const isLikelyType = (value, typeOptionsList) => {
  if (!value) return false;
  const normalizedValue = normalizeString(value);
  return (typeOptionsList || []).some(
    (type) => normalizeString(type) === normalizedValue
  );
};

const STRING_FIELDS = [
  "product_name",
  "description",
  "product_code",
  "category",
  "group",
  "size",
  "pattern",
  "weight",
  "type",
];

const RETRY_ATTEMPTS = 3;

export default function Products() {
  // Data states
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSize, setFilterSize] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Sorting & pagination
  const [sortBy, setSortBy] = useState({
    column: "id",
    direction: "desc",
  });
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Import states
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importMapping, setImportMapping] = useState({});
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    status: "idle",
    errors: [],
  });
  const [isImporting, setIsImporting] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, bRes, cRes, gRes] = await Promise.all([
        api.get("/products"),
        api.get("/brands"),
        api.get("/categories"),
        api.get("/groups"),
      ]);

      setProducts(pRes.data.data || []);
      setBrands(bRes.data.data || []);

      const activeCategories = (cRes.data.data || []).filter(
        (cat) => cat.status === "active" || cat.status === undefined
      );
      setCategories(activeCategories);

      const activeGroups = (gRes.data.data || []).filter(
        (g) => g.status === "active"
      );
      setGroups(activeGroups);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGroupSelect = useCallback(
    (group) => {
      if (selectedGroups.includes(group)) {
        setSelectedGroups(selectedGroups.filter((g) => g !== group));
      } else {
        setSelectedGroups([...selectedGroups, group]);
      }
    },
    [selectedGroups]
  );

  const removeSelectedGroup = useCallback(
    (group) => {
      setSelectedGroups(selectedGroups.filter((g) => g !== group));
    },
    [selectedGroups]
  );

  const handleEdit = useCallback((product) => {
    setEditingProduct(product);

    const gs = product.group
      ? product.group
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g)
      : [];
    setSelectedGroups(gs);

    setFormData({
      product_name: product.product_name || "",
      description: product.description || "",
      brand_name: product.brand_name || "none",
      category: product.category || "none",
      group: product.group || "",
      size: product.size || "",
      pattern: product.pattern || "",
      weight: product.weight || "",
      type: product.type || "",
    });

    setIsDialogOpen(true);
  }, []);

  const submitForm = useCallback(
    async (e) => {
      e?.preventDefault?.();

      try {
        const submitData = {
          ...formData,
          brand_name: formData.brand_name === "none" ? "" : formData.brand_name,
          category: formData.category === "none" ? "" : formData.category,
          group: selectedGroups.join(","),
        };

        if (editingProduct) {
          await api.put(`/products/${editingProduct.id}`, submitData);
          toast.success("Product updated");
        } else {
          await api.post("/products", submitData);
          toast.success("Product created");
        }

        setIsDialogOpen(false);
        clearForm();
        loadData();
      } catch (err) {
        console.error(err);
        toast.error("Failed to save product");
      }
    },
    [formData, editingProduct, selectedGroups]
  );

  const clearForm = useCallback(() => {
    setFormData(emptyForm);
    setSelectedGroups([]);
    setEditingProduct(null);
  }, []);

  // Delete handlers
  const confirmDelete = useCallback((product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!productToDelete) return;

    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success("Product deleted successfully");

      loadData();

      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
    }
  }, [productToDelete]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  }, []);

  // Import functions
  const autoDetectColumns = useCallback((headers) => {
    const mapping = {};
    const columnPatterns = {
      product_name: ["product", "name", "product name", "item", "item name"],
      product_code: ["code", "sku", "product code", "item code", "id"],
      brand_name: ["brand", "brand name", "manufacturer", "maker"],
      category: ["category", "category name", "main category"],
      description: ["description", "desc", "details", "note"],
      size: ["size", "dimension", "measurement"],
      weight: ["weight", "kg", "grams"],
      pattern: ["pattern", "model", "design"],
      group: ["group", "vehicle group", "groups", "vehicle"],
      type: ["type", "condition", "status"],
    };

    headers.forEach((header) => {
      if (!header) return;
      const headerLower = header.toString().toLowerCase().trim();

      for (const [field, patterns] of Object.entries(columnPatterns)) {
        if (patterns.some((pattern) => headerLower.includes(pattern))) {
          mapping[header] = field;
          break;
        }
      }

      if (!mapping[header]) mapping[header] = "";
    });

    return mapping;
  }, []);

  const updateImportMapping = useCallback((excelColumn, field) => {
    setImportMapping((prev) => ({
      ...prev,
      [excelColumn]: field,
    }));
  }, []);

  const handleFileUpload = useCallback(
    async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // V-17: this was the only upload path in the app that validated properly
      // (10 MB cap plus a type allow-list). It now uses the shared validator so
      // all four paths behave identically, and it additionally gains a
      // magic-byte check - the reported MIME type and the extension are both
      // attacker-controlled, the file signature is not.
      const check = await validateSpreadsheetFile(file);
      if (!check.ok) {
        toast.error(check.error);
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            toast.error("File is empty or has no data");
            return;
          }

          const headers = jsonData[0];
          const rows = jsonData
            .slice(1)
            .filter((row) => row.some((cell) => cell !== null && cell !== ""));

          const maxRows = 5000;
          if (rows.length > maxRows) {
            toast.warning(
              `Large file detected. Only processing first ${maxRows} rows out of ${rows.length}`
            );
          }

          const autoMapping = autoDetectColumns(headers);
          setImportMapping(autoMapping);

          const preparedData = rows.slice(0, maxRows).map((row, index) => {
            const item = {};
            headers.forEach((header, colIndex) => {
              const mappedField = autoMapping[header];
              const cellValue = row[colIndex];

              if (mappedField) {
                item[mappedField] = cellValue;
              }
              item[header] = cellValue;
            });
            return { ...item, _originalRow: row, _rowIndex: index + 2 };
          });

          setImportData(preparedData);
          setIsImportDialogOpen(true);
          toast.success(`Found ${preparedData.length} rows to import`);
        } catch (error) {
          console.error("Error parsing file:", error);
          toast.error("Error parsing file. Please check the format.");
        }
      };

      reader.readAsArrayBuffer(file);
      event.target.value = "";
    },
    [autoDetectColumns]
  );

  // Retry with backoff
  const retryOperation = async (operation, retries = RETRY_ATTEMPTS) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retries) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      }
    }
  };

  // Bulk import executor (your ONE-SHOT endpoint)
  const executeImport = useCallback(async () => {
    const items = importData
      .map((item) => {
        const processed = {};

        Object.keys(importMapping).forEach((excelColumn) => {
          const mappedField = importMapping[excelColumn];
          if (!mappedField) return;

          const rawValue = item[mappedField] ?? item[excelColumn];
          if (rawValue === undefined || rawValue === null || rawValue === "") return;

          const value = STRING_FIELDS.includes(mappedField) ? toStr(rawValue) : rawValue;

          if (mappedField === "category") {
            if (isLikelyType(value, typeOptions)) {
              processed["type"] = toStr(value);
              processed["category"] = "Tyre";
            } else {
              processed["category"] = toStr(value);
            }
          } else if (mappedField === "type") {
            processed["type"] = toStr(value);
          } else {
            processed[mappedField] = value;
          }
        });

        if (!processed.product_name && processed.description) {
          processed.product_name = processed.description;
        }

        return processed;
      })
      .filter((x) => x.description && toStr(x.description) !== "");

    if (items.length === 0) {
      toast.error("No valid data to import - Description is required for all products");
      return;
    }

    setIsImporting(true);
    setImportProgress({
      current: 0,
      total: items.length,
      status: "importing_products",
      errors: [],
    });

    try {
      const res = await api.post("/products/import/bulk", { items });
      const info = res?.data?.data;

      toast.success(
        `Import Complete: ${info?.inserted ?? 0} created, ${
          info?.skipped_duplicates ?? 0
        } duplicates skipped`,
        { duration: 10000 }
      );

      await loadData();

      setIsImportDialogOpen(false);
      setImportData([]);
      setImportMapping({});
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Bulk import failed", {
        duration: 10000,
      });
    } finally {
      setIsImporting(false);
      setImportProgress((prev) => ({
        ...prev,
        current: prev.total,
        status: "done",
      }));
    }
  }, [importData, importMapping]);

  // Sorting
  const toggleSort = useCallback((column) => {
    setPageIndex(0);
    setSortBy((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { column, direction: "desc" };
    });
  }, []);

  // ✅ FIXED FILTERING (NORMALIZED) - TYPE FILTER NOW WORKS
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const norm = (v) => (v ?? "").toString().trim().toLowerCase();

    return products.filter((p) => {
      if (filterBrand !== "all" && norm(p.brand_name) !== norm(filterBrand))
        return false;

      if (filterCategory !== "all" && norm(p.category) !== norm(filterCategory))
        return false;

      if (filterSize !== "all" && norm(p.size) !== norm(filterSize)) return false;

      // ✅ MAIN FIX HERE
      if (filterType !== "all" && norm(p.type) !== norm(filterType)) return false;

      if (!term) return true;

      return (
        norm(p.product_name).includes(term) ||
        norm(p.product_code).includes(term) ||
        norm(p.description).includes(term) ||
        norm(p.brand_name).includes(term) ||
        norm(p.category).includes(term) ||
        norm(p.type).includes(term)
      );
    });
  }, [products, searchTerm, filterBrand, filterCategory, filterSize, filterType]);

  // Sorting - default by ID desc
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { column, direction } = sortBy;

    arr.sort((a, b) => {
      if (column === "id") {
        const aId = a.id || 0;
        const bId = b.id || 0;
        return direction === "desc" ? bId - aId : aId - bId;
      }

      const av = (a[column] ?? "").toString().toLowerCase();
      const bv = (b[column] ?? "").toString().toLowerCase();
      if (!av && !bv) return 0;
      if (!av) return direction === "asc" ? -1 : 1;
      if (!bv) return direction === "asc" ? 1 : -1;
      if (av < bv) return direction === "asc" ? -1 : 1;
      if (av > bv) return direction === "asc" ? 1 : -1;
      return 0;
    });

    if (column !== "id") {
      arr.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return arr;
  }, [filtered, sortBy]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => {
    const start = pageIndex * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageIndex, pageSize]);

  const gotoPage = useCallback(
    (idx) => {
      const safe = Math.max(0, Math.min(idx, pageCount - 1));
      setPageIndex(safe);
    },
    [pageCount]
  );

  // Export
  const exportCSV = useCallback(() => {
    const rows = paged.map((p) => ({
      product_code: p.product_code,
      product_name: p.product_name,
      brand_name: p.brand_name,
      category: p.category,
      group: p.group,
      size: p.size,
      type: p.type,
      pattern: p.pattern,
      weight: p.weight,
      description: p.description,
    }));

    if (rows.length === 0) {
      toast.error("No rows to export");
      return;
    }

    const header = Object.keys(rows[0]).join(",");
    const csv = [
      header,
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [paged]);

  // Unique values for filters
  const uniqueSizes = useMemo(() => {
    const set = new Set(products.map((p) => p.size).filter(Boolean));
    return [...set].sort();
  }, [products]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-4">
      <PageHeader
        onAddClick={() => {
          clearForm();
          setIsDialogOpen(true);
        }}
        onExportClick={exportCSV}
        onImportClick={() => document.getElementById("excel-upload").click()}
      />

      <input
        type="file"
        id="excel-upload"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      <Card className="overflow-visible">
        <CardHeader className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b">
          <SearchFilters
            searchTerm={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              setPageIndex(0);
            }}
            filterBrand={filterBrand}
            onBrandChange={(value) => {
              setFilterBrand(value);
              setPageIndex(0);
            }}
            filterCategory={filterCategory}
            onCategoryChange={(value) => {
              setFilterCategory(value);
              setPageIndex(0);
            }}
            filterSize={filterSize}
            onSizeChange={(value) => {
              setFilterSize(value);
              setPageIndex(0);
            }}
            filterType={filterType}
            onTypeChange={(value) => {
              setFilterType(value);
              setPageIndex(0);
            }}
            onClearFilters={() => {
              setSearchTerm("");
              setFilterBrand("all");
              setFilterCategory("all");
              setFilterSize("all");
              setFilterType("all");
              setPageIndex(0);
            }}
            brands={brands}
            categories={categories}
            uniqueSizes={uniqueSizes}
            typeOptions={typeOptions}
          />
        </CardHeader>

        <CardContent className="p-0">
          <ProductsTable
            products={paged}
            sortBy={sortBy}
            onSort={toggleSort}
            onEdit={handleEdit}
            onDelete={confirmDelete}
          />

          <PaginationControls
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalItems={sorted.length}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
            onFirstPage={() => gotoPage(0)}
            onPrevPage={() => gotoPage(pageIndex - 1)}
            onNextPage={() => gotoPage(pageIndex + 1)}
            onLastPage={() => gotoPage(pageCount - 1)}
            pageCount={pageCount}
          />
        </CardContent>
      </Card>

      <ProductFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingProduct={editingProduct}
        formData={formData}
        onFormChange={handleFormChange}
        onSelectChange={handleSelectChange}
        onSubmit={submitForm}
        selectedGroups={selectedGroups}
        onGroupSelect={handleGroupSelect}
        onRemoveGroup={removeSelectedGroup}
        clearForm={clearForm}
        brands={brands}
        categories={categories}
        typeOptions={typeOptions}
        vehicleGroups={groups.map((g) => g.group_name)}
      />

      <ImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        importData={importData}
        importMapping={importMapping}
        onUpdateMapping={updateImportMapping}
        importProgress={importProgress}
        isImporting={isImporting}
        onExecuteImport={executeImport}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete ? (
                <>
                  This action cannot be undone. This will permanently delete the
                  product:
                  <strong className="block mt-2 text-lg">
                    {productToDelete.product_name}
                  </strong>
                  {productToDelete.product_code && (
                    <span className="text-muted-foreground">
                      (Code: {productToDelete.product_code})
                    </span>
                  )}
                </>
              ) : (
                "This action cannot be undone. This will permanently delete the selected product."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

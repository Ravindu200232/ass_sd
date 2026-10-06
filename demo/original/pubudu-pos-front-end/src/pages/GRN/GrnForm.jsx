import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody } from "@/components/ui/table";
import api from '@/lib/api';
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Import utils
import { getLatestGRNStockPrice, getLatestStockPrices } from '@/lib/grn-utils';

// Import components
import { ProductSearchDrawer } from '../../components/GRNForm/ProductSearchDrawer';
import { DraftsDialog } from '../../components/GRNForm/DraftsDialog';
import { GRNHeader } from '../../components/GRNForm/GRNHeader';
import { FormControls } from '../../components/GRNForm/FormControls';
import { GRNTableHeader } from '../../components/GRNForm/TableHeader';
import { GRNTableRow } from '../../components/GRNForm/GRNTableRow';
import { SummarySection } from '../../components/GRNForm/SummarySection';
import { CSVImportModal } from '../../components/GRNForm/CSVImportModal';

// How many items to send per API call when bulk-importing large datasets
const BULK_CHUNK_SIZE = 100;

export default function GRNForm() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  // Core data
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Latest GRN cache
  const [latestStockPrices, setLatestStockPrices] = useState({});

  // GRN form
  const [grnItems, setGrnItems] = useState([]);
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split("T")[0]);
  const [departmentId, setDepartmentId] = useState("");

  // Drafts
  const [isDraftPopup, setIsDraftPopup] = useState(false);
  const [draftList, setDraftList] = useState([]);

  // Drawer search
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // Inline suggestions per row
  const [inlineSuggestions, setInlineSuggestions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGRNHistory, setIsLoadingGRNHistory] = useState(false);

  // CSV bulk import
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(null); // { current, total } | null

  // Fetch products & departments
  useEffect(() => {
    fetchProducts();
    fetchDepartments();
  }, []);

  // Fetch latest GRN data for all products when products load
  useEffect(() => {
    if (products.length > 0) {
      fetchLatestGRNData();
    }
  }, [products]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading products");
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error loading departments");
    }
  }, []);

  // Fetch latest GRN data for all products
  const fetchLatestGRNData = useCallback(async () => {
    if (products.length === 0) return;
    
    setIsLoadingGRNHistory(true);
    try {
      const productCodes = products.map(p => p.product_code);
      const latestPrices = await getLatestStockPrices(productCodes);
      setLatestStockPrices(latestPrices);
    } catch (error) {
      console.error('Error fetching GRN history:', error);
    } finally {
      setIsLoadingGRNHistory(false);
    }
  }, [products]);

  // Debounce for drawer search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 200);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!debouncedTerm) return [];
    const term = debouncedTerm.toLowerCase();
    return products.filter((p) => {
      return (
        (p.product_name || "").toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term) ||
        (p.product_code || "").toLowerCase().includes(term) ||
        (p.brand || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term) ||
        (p.size || "").toLowerCase().includes(term)
      );
    });
  }, [products, debouncedTerm]);

  // Calculations
  const calculateActualCost = useCallback((
    stockPrice, 
    discount1, 
    discount2, 
    discount3, 
    discount4
  ) => {
    let price = parseFloat(stockPrice) || 0;
    
    if (discount1 > 0) price = price - (price * (parseFloat(discount1) / 100));
    if (discount2 > 0) price = price - (price * (parseFloat(discount2) / 100));
    if (discount3 > 0) price = price - (price * (parseFloat(discount3) / 100));
    if (discount4 > 0) price = price - (price * (parseFloat(discount4) / 100));
    
    return Math.max(0, price);
  }, []);

  // Get latest GRN data for a specific product (with fallback)
  const getLatestProductGRNData = useCallback(async (productCode) => {
    if (!productCode) return null;
    
    // First check cache
    if (latestStockPrices[productCode]) {
      return latestStockPrices[productCode];
    }
    
    // Fetch if not in cache
    try {
      const latestData = await getLatestGRNStockPrice(productCode);
      if (latestData) {
        setLatestStockPrices(prev => ({
          ...prev,
          [productCode]: {
            stock_price: latestData.stock_price,
            main_branch_price: latestData.main_branch_price,
            selling_price: latestData.selling_price,
            discount1: latestData.discount1,
            discount2: latestData.discount2,
            discount3: latestData.discount3,
            discount4: latestData.discount4,
            actual_cost: latestData.actual_cost,
            grn_date: latestData.grn_date,
            grn_code: latestData.grn_code
          }
        }));
      }
      return latestData;
    } catch (error) {
      console.error('Error fetching GRN data for product:', error);
      return null;
    }
  }, [latestStockPrices]);

  // Item management
  const addItem = useCallback(() => {
    setGrnItems((prev) => [
      ...prev,
      {
        product_code: "",
        product_name: "",
        product_description: "",
        stock_price: "",
        main_branch_price: "",
        selling_price: "",
        discount1: "",
        discount2: "",
        discount3: "",
        discount4: "",
        actual_cost: "",
        qty: 1,
      },
    ]);
  }, []);

  const removeItem = useCallback((index) => {
    setGrnItems((prev) => prev.filter((_, i) => i !== index));
    setInlineSuggestions((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  }, []);

  const updateItem = useCallback((index, field, value) => {
    setGrnItems((prev) => {
      const copy = [...prev];
      const newItem = { ...copy[index] };
      
      if (field === 'stock_price') {
        newItem.stock_price = value;
      } else if (field === 'selling_price') {
        newItem.selling_price = value;
      } else if (field.startsWith('discount')) {
        const numVal = parseFloat(value);
        if (!isNaN(numVal) && numVal > 100) {
          toast.error(`Discount cannot exceed 100%`);
          newItem[field] = "100";
        } else if (!isNaN(numVal) && numVal < 0) {
          newItem[field] = "0";
        } else {
          newItem[field] = value;
        }
      } else {
        newItem[field] = field === "qty" ? parseInt(value) || 0 : value;
      }

      // Recalculate actual cost if stock price or discounts changed
      if (field === 'stock_price' || field.startsWith('discount')) {
        const stockPrice = parseFloat(newItem.stock_price) || 0;
        const discount1 = parseFloat(newItem.discount1) || 0;
        const discount2 = parseFloat(newItem.discount2) || 0;
        const discount3 = parseFloat(newItem.discount3) || 0;
        const discount4 = parseFloat(newItem.discount4) || 0;

        const actualCost = calculateActualCost(
          stockPrice, 
          discount1, 
          discount2, 
          discount3, 
          discount4
        );
        newItem.actual_cost = actualCost.toFixed(2);
        
        // Auto-update main_branch_price to match actual_cost when discounts change
        newItem.main_branch_price = actualCost.toFixed(2);
      }

      copy[index] = newItem;
      return copy;
    });
  }, [calculateActualCost]);

  // Inline suggestion functions
  const showInlineSuggestionsForRow = useCallback((index, text = "") => {
    const term = (text || "").trim().toLowerCase();
    if (!term) {
      hideInlineSuggestionsForRow(index);
      return;
    }

    const list = products.filter((p) => {
      return (
        (p.product_name || "").toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term) ||
        (p.product_code || "").toLowerCase().includes(term)
      );
    }).slice(0, 12);

    setInlineSuggestions((prev) => ({
      ...prev,
      [index]: {
        open: true,
        list,
      },
    }));
  }, [products]);

  const hideInlineSuggestionsForRow = useCallback((index) => {
    setInlineSuggestions((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        open: false,
        list: [],
      },
    }));
  }, []);

  const handleInlineSearchChange = useCallback((index, text) => {
    updateItem(index, "product_name", text);
    showInlineSuggestionsForRow(index, text);
  }, [updateItem, showInlineSuggestionsForRow]);

  const handleInlineSelect = useCallback(async (index, product) => {
    // Get latest GRN data for this product
    let latestGRNData = null;
    if (product.product_code) {
      latestGRNData = await getLatestProductGRNData(product.product_code);
    }

    setGrnItems((prev) => {
      const copy = [...prev];
      while (copy.length <= index) {
        copy.push({
          product_code: "",
          product_name: "",
          product_description: "",
          stock_price: "",
          main_branch_price: "",
          selling_price: "",
          discount1: "",
          discount2: "",
          discount3: "",
          discount4: "",
          actual_cost: "",
          qty: 1,
        });
      }
      
      const existingSellingPrice = copy[index].selling_price;
      
      const stockPrice = latestGRNData?.stock_price || product.stock_price || "";
      const mainBranchPrice = latestGRNData?.actual_cost || product.main_branch_price || "";
      const sellingPrice = existingSellingPrice || latestGRNData?.selling_price || product.selling_price || "";
      
      copy[index] = {
        ...copy[index],
        product_code: product.product_code,
        product_name: product.product_name,
        product_description: product.description || "",
        stock_price: stockPrice,
        main_branch_price: mainBranchPrice,
        selling_price: sellingPrice,
        discount1: latestGRNData?.discount1 || product.discount1 || "",
        discount2: latestGRNData?.discount2 || product.discount2 || "",
        discount3: latestGRNData?.discount3 || product.discount3 || "",
        discount4: latestGRNData?.discount4 || product.discount4 || "",
      };

      const calculatedStockPrice = parseFloat(stockPrice) || 0;
      const discount1 = parseFloat(copy[index].discount1) || 0;
      const discount2 = parseFloat(copy[index].discount2) || 0;
      const discount3 = parseFloat(copy[index].discount3) || 0;
      const discount4 = parseFloat(copy[index].discount4) || 0;

      const actualCost = calculateActualCost(
        calculatedStockPrice, 
        discount1, 
        discount2, 
        discount3, 
        discount4
      );
      copy[index].actual_cost = actualCost.toFixed(2);

      if (latestGRNData) {
        toast.success(`Loaded from ${latestGRNData.grn_code} (${new Date(latestGRNData.grn_date).toLocaleDateString()})`, {
          description: `Stock: LKR ${stockPrice}, Main Branch: LKR ${mainBranchPrice}`
        });
      }

      return copy;
    });

    hideInlineSuggestionsForRow(index);
  }, [calculateActualCost, hideInlineSuggestionsForRow, getLatestProductGRNData]);

  const openProductDrawer = useCallback((index) => {
    setCurrentSearchIndex(index);
    setIsProductDrawerOpen(true);
    setSearchTerm("");
  }, []);

  const closeProductDrawer = useCallback(() => {
    setIsProductDrawerOpen(false);
    setSearchTerm("");
    setDebouncedTerm("");
    setCurrentSearchIndex(null);
  }, []);

  const handleDrawerSelect = useCallback(async (product) => {
    let latestGRNData = null;
    if (product.product_code) {
      latestGRNData = await getLatestProductGRNData(product.product_code);
    }

    const targetIndex = currentSearchIndex !== null ? currentSearchIndex : 
      grnItems.findIndex(i => !i.product_code) >= 0 ? grnItems.findIndex(i => !i.product_code) : grnItems.length;

    setGrnItems(prev => {
      const copy = [...prev];
      while (copy.length <= targetIndex) {
        copy.push({ 
          product_code: "", 
          product_name: "", 
          product_description: "",
          stock_price: "", 
          main_branch_price: "", 
          selling_price: "",
          discount1: "", 
          discount2: "", 
          discount3: "", 
          discount4: "", 
          actual_cost: "", 
          qty: 1 
        });
      }
      
      const existingSellingPrice = copy[targetIndex].selling_price;
      
      const stockPrice = latestGRNData?.stock_price || product.stock_price || "";
      const mainBranchPrice = latestGRNData?.actual_cost || product.main_branch_price || "";
      const sellingPrice = existingSellingPrice || latestGRNData?.selling_price || product.selling_price || "";
      
      copy[targetIndex] = { 
        ...copy[targetIndex], 
        product_code: product.product_code, 
        product_name: product.product_name, 
        product_description: product.description || "",
        stock_price: stockPrice,
        main_branch_price: mainBranchPrice,
        selling_price: sellingPrice,
        discount1: latestGRNData?.discount1 || product.discount1 || "",
        discount2: latestGRNData?.discount2 || product.discount2 || "",
        discount3: latestGRNData?.discount3 || product.discount3 || "",
        discount4: latestGRNData?.discount4 || product.discount4 || "",
      };

      const calculatedStockPrice = parseFloat(stockPrice) || 0;
      const discount1 = parseFloat(copy[targetIndex].discount1) || 0;
      const discount2 = parseFloat(copy[targetIndex].discount2) || 0;
      const discount3 = parseFloat(copy[targetIndex].discount3) || 0;
      const discount4 = parseFloat(copy[targetIndex].discount4) || 0;

      const actualCost = calculateActualCost(
        calculatedStockPrice, 
        discount1, 
        discount2, 
        discount3, 
        discount4
      );
      copy[targetIndex].actual_cost = actualCost.toFixed(2);

      return copy;
    });

    if (latestGRNData) {
      toast.success(`Loaded from ${latestGRNData.grn_code} (${new Date(latestGRNData.grn_date).toLocaleDateString()})`, {
        description: `Stock: LKR ${stockPrice}, Main Branch: LKR ${mainBranchPrice}`
      });
    }

    if (currentSearchIndex !== null) hideInlineSuggestionsForRow(currentSearchIndex);
    closeProductDrawer();
  }, [currentSearchIndex, grnItems, calculateActualCost, hideInlineSuggestionsForRow, closeProductDrawer, getLatestProductGRNData]);

  // ── CSV import handler ─────────────────────────────────────────────────────
  const handleCSVImport = useCallback((importedRows) => {
    // Merge imported rows into the existing grnItems list
    setGrnItems((prev) => [...prev, ...importedRows]);
  }, []);

  // Drafts
  const saveDraft = useCallback(() => {
    if (grnItems.length === 0) {
      toast.error("No items to save as draft");
      return;
    }
    const draftId = Date.now();
    const draftData = { 
      id: draftId, 
      grn_date: grnDate, 
      department_id: departmentId, 
      items: grnItems 
    };
    const existing = JSON.parse(localStorage.getItem("grn_drafts") || "[]");
    existing.push(draftData);
    localStorage.setItem("grn_drafts", JSON.stringify(existing));
    toast.success("Draft saved!");
  }, [grnItems, grnDate, departmentId]);

  const loadDrafts = useCallback(() => {
    const saved = JSON.parse(localStorage.getItem("grn_drafts") || "[]");
    setDraftList(saved);
    setIsDraftPopup(true);
  }, []);

  const applyDraft = useCallback((draft) => {
    setGrnDate(draft.grn_date);
    setDepartmentId(draft.department_id);
    setGrnItems(draft.items);
    setIsDraftPopup(false);
    toast.success("Draft loaded!");
  }, []);

  const deleteDraft = useCallback((draftId) => {
    const filtered = draftList.filter(x => x.id !== draftId);
    localStorage.setItem("grn_drafts", JSON.stringify(filtered));
    setDraftList(filtered);
    toast.success("Draft removed");
  }, [draftList]);

  const clearDrafts = useCallback(() => {
    localStorage.removeItem("grn_drafts");
    setDraftList([]);
    toast.success("Drafts cleared!");
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    if (!departmentId) {
      toast.error("Select department");
      return false;
    }
    if (grnItems.length === 0) {
      toast.error("Add at least 1 item");
      return false;
    }
    for (let i = 0; i < grnItems.length; i++) {
      if (!grnItems[i].product_code) {
        toast.error(`Product not selected in row ${i + 1}`);
        return false;
      }
      if (!grnItems[i].stock_price) {
        toast.error(`Stock price missing in row ${i + 1}`);
        return false;
      }
      if (!grnItems[i].main_branch_price) {
        toast.error(`Main branch price missing in row ${i + 1}`);
        return false;
      }
      if (!grnItems[i].selling_price) {
        toast.error(`Selling price missing in row ${i + 1}`);
        return false;
      }
      const discounts = [
        { key: "discount1", label: "D1" },
        { key: "discount2", label: "D2" },
        { key: "discount3", label: "D3" },
        { key: "discount4", label: "D4" },
      ];
      for (const { key, label } of discounts) {
        const val = parseFloat(grnItems[i][key]);
        if (!isNaN(val) && val > 100) {
          toast.error(`${label} discount in row ${i + 1} cannot exceed 100%`);
          return false;
        }
      }
    }
    return true;
  }, [departmentId, grnItems]);

  // Submit GRN — splits into chunks of BULK_CHUNK_SIZE so no items are lost
  const submitGRN = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setBulkProgress(null);

    const mappedItems = grnItems.map((i) => ({
      product_code: i.product_code,
      product_name: i.product_name,
      product_description: i.product_description || "",
      stock_price: parseFloat(i.stock_price) || 0,
      main_branch_price: parseFloat(i.main_branch_price) || 0,
      selling_price: parseFloat(i.selling_price) || 0,
      discount1: parseFloat(i.discount1) || 0,
      discount2: parseFloat(i.discount2) || 0,
      discount3: parseFloat(i.discount3) || 0,
      discount4: parseFloat(i.discount4) || 0,
      actual_cost: parseFloat(i.actual_cost) || 0,
      qty: i.qty || 0,
    }));

    // Build chunks — single GRN stays as one request
    const chunks = [];
    for (let i = 0; i < mappedItems.length; i += BULK_CHUNK_SIZE) {
      chunks.push(mappedItems.slice(i, i + BULK_CHUNK_SIZE));
    }

    const results = [];
    let lastSuccessData = null;

    for (let ci = 0; ci < chunks.length; ci++) {
      if (chunks.length > 1) {
        setBulkProgress({ current: ci + 1, total: chunks.length });
        toast.loading(`Saving batch ${ci + 1} of ${chunks.length}...`, {
          id: "grn-bulk-progress",
        });
      }

      try {
        const res = await api.post("/grns", {
          grn_date: grnDate,
          department_id: departmentId,
          items: chunks[ci],
        });

        // Some APIs return { success: false, message: "..." } with HTTP 200
        if (res.data?.success === false) {
          const apiMsg = res.data?.message || "Server rejected the request";
          console.error(`GRN batch ${ci + 1} rejected:`, apiMsg, res.data);
          results.push({ chunk: ci + 1, success: false, error: apiMsg });
        } else {
          lastSuccessData = res.data?.data || res.data;
          results.push({ chunk: ci + 1, success: true });
        }
      } catch (err) {
        // Extract the real server error message from axios error response
        const apiMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors).flat().join(", ")
            : null) ||
          err.message ||
          "Unknown error";
        console.error(`GRN batch ${ci + 1} failed (${err.response?.status}):`, apiMsg, err.response?.data);
        results.push({ chunk: ci + 1, success: false, error: apiMsg });
      }
    }

    toast.dismiss("grn-bulk-progress");
    setBulkProgress(null);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      if (chunks.length > 1) {
        toast.success(
          `${successCount}/${chunks.length} batches saved (${successCount * BULK_CHUNK_SIZE}+ items)!`
        );
        if (failCount > 0) {
          toast.error(
            `${failCount} batch(es) failed — ${failCount * BULK_CHUNK_SIZE} items may not have been saved`
          );
        }
      } else {
        toast.success("GRN Created!");
      }

      if (lastSuccessData) {
        localStorage.setItem("grn_report_data", JSON.stringify(lastSuccessData));
      }

      clearDrafts();
      setGrnItems([]);
      setIsProductDrawerOpen(false);
      setSearchTerm("");

      setTimeout(() => {
        if (lastSuccessData?.grn_code) navigate(`/stock/grn`);
      }, 500);
    } else {
      // Show the actual error from the first failed batch
      const firstError = results[0]?.error || "Unknown error";
      toast.error(`GRN failed: ${firstError}`, { duration: 8000 });
    }

    setIsSubmitting(false);
  }, [grnDate, departmentId, grnItems, validateForm, clearDrafts, navigate]);

  // Escape key handler
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setInlineSuggestions({});
        setIsProductDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Totals calculation
  const totals = useMemo(() => {
    const totalCost = grnItems.reduce((sum, i) => sum + (parseFloat(i.actual_cost) || 0) * (i.qty || 0), 0);
    const totalSelling = grnItems.reduce((sum, i) => sum + (parseFloat(i.selling_price) || 0) * (i.qty || 0), 0);
    const profit = totalSelling - totalCost;
    
    return { totalCost, totalSelling, profit };
  }, [grnItems]);

  return (
    <div className="p-3 md:p-4 w-full bg-[#F5F9FC] min-h-screen">
      {isLoadingGRNHistory && (
        <div className="fixed top-4 right-4 bg-[#0A6ED1] text-white px-4 py-2 rounded-md shadow-lg z-50 text-sm">
          Loading GRN history...
        </div>
      )}

      {bulkProgress && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 text-sm flex items-center gap-2">
          <div className="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
          Saving batch {bulkProgress.current} / {bulkProgress.total}...
        </div>
      )}

      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        products={products}
        onImport={handleCSVImport}
        calculateActualCost={calculateActualCost}
      />

      <DraftsDialog
        isOpen={isDraftPopup}
        onClose={() => setIsDraftPopup(false)}
        draftList={draftList}
        onApplyDraft={applyDraft}
        onDeleteDraft={deleteDraft}
        onClearDrafts={clearDrafts}
      />

      <ProductSearchDrawer
        isOpen={isProductDrawerOpen}
        onClose={closeProductDrawer}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        debouncedTerm={debouncedTerm}
        filteredProducts={filteredProducts}
        currentSearchIndex={currentSearchIndex}
        onSelectProduct={handleDrawerSelect}
        searchInputRef={searchInputRef}
        latestStockPrices={latestStockPrices}
      />

      <Card className="border-[#D9E8F5] shadow-md">
        <GRNHeader />
        
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          <FormControls
            grnDate={grnDate}
            onDateChange={setGrnDate}
            departmentId={departmentId}
            onDepartmentChange={setDepartmentId}
            departments={departments}
            onAddItem={addItem}
            onSaveDraft={saveDraft}
            onLoadDraft={loadDrafts}
            onImportCSV={() => setIsCSVModalOpen(true)}
          />

          <div className="w-full overflow-visible rounded-lg border border-[#D9E8F5] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <GRNTableHeader />
                
                <tbody>
                  {grnItems.map((item, index) => (
                    <GRNTableRow
                      key={index}
                      item={item}
                      index={index}
                      onProductSearchClick={openProductDrawer}
                      onInlineSearchChange={handleInlineSearchChange}
                      onInlineSelect={handleInlineSelect}
                      onUpdateItem={updateItem}
                      onRemoveItem={removeItem}
                      inlineSuggestions={inlineSuggestions}
                      hideInlineSuggestions={hideInlineSuggestionsForRow}
                      latestStockPrices={latestStockPrices}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <SummarySection
            totalCost={totals.totalCost}
            totalSelling={totals.totalSelling}
            profit={totals.profit}
            onSubmit={submitGRN}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
// src/pages/PriceManagement/PriceController.jsx

import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Search,
  Download,
  RefreshCcw,
  Save,
  ChevronDown,
  ChevronUp,
  Package,
  Percent,
  DollarSign,
  CheckSquare,
  Square,
  Edit2,
  AlertCircle,
  Check,
  X,
  Tag,
  Layers,
  Hash,
  ShoppingBag,
  Eye,
  EyeOff,
  ShoppingCart,
  Wallet,
  Boxes,
  Wrench,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const FIELD_OPTIONS = [
  {
    value: "stock_price",
    label: "Stock Price",
    shortLabel: "Stock",
    icon: Boxes,
    color: "text-teal-700",
    bg: "bg-teal-50",
    activeBg: "bg-teal-600",
    activeText: "text-white",
    border: "border-teal-600",
  },
  {
    value: "actual_cost",
    label: "Actual Cost",
    shortLabel: "Cost",
    icon: Wallet,
    color: "text-purple-700",
    bg: "bg-purple-50",
    activeBg: "bg-purple-600",
    activeText: "text-white",
    border: "border-purple-600",
  },
  {
    value: "selling_price",
    label: "Selling Price",
    shortLabel: "Sell",
    icon: ShoppingCart,
    color: "text-[#0A6ED1]",
    bg: "bg-[#E5F0FF]",
    activeBg: "bg-[#0A6ED1]",
    activeText: "text-white",
    border: "border-[#0A6ED1]",
  },
];

const safeFloat = (v) => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

const toDateValue = (v) => {
  if (!v) return 0;
  const time = new Date(v).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortLatestFirst = (a, b) => {
  const dateDiff =
    toDateValue(b.grn_date || b.date || b.updated_at || b.created_at) -
    toDateValue(a.grn_date || a.date || a.updated_at || a.created_at);
  if (dateDiff !== 0) return dateDiff;
  return safeFloat(b.id) - safeFloat(a.id);
};

// ─── FIELD TOGGLE ─────────────────────────────────────────────────────────────
function FieldToggle({ value, onChange, size = "md" }) {
  const sm = size === "sm";
  return (
    <div
      className={`flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ${sm ? "text-xs" : "text-sm"}`}
    >
      {FIELD_OPTIONS.map((opt) => {
        const active = value === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              flex items-center gap-1.5 rounded-md font-medium transition-all
              ${sm ? "px-2 py-1" : "px-3 py-1.5"}
              ${
                active
                  ? `${opt.activeBg} ${opt.activeText} shadow-sm`
                  : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <Icon className={sm ? "w-3 h-3" : "w-4 h-4"} />
            {sm ? opt.shortLabel : opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── PROFIT BADGE ─────────────────────────────────────────────────────────────
function ProfitBadge({ value }) {
  const n = safeFloat(value);
  let cls = "bg-red-100 text-red-800 border border-red-200";
  if (n >= 30) cls = "bg-green-100 text-green-800 border border-green-200";
  else if (n >= 15)
    cls = "bg-yellow-100 text-yellow-800 border border-yellow-200";
  else if (n >= 0)
    cls = "bg-orange-100 text-orange-800 border border-orange-200";
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}
    >
      {n.toFixed(2)}%
    </span>
  );
}

// ─── PRICE CELL ───────────────────────────────────────────────────────────────
function PriceCell({ field, currentVal, originalVal, adjField, adjChange, activeColor }) {
  const isAdjusted = adjField === field;
  return (
    <div className="text-sm">
      <div className={`font-semibold ${isAdjusted ? activeColor : "text-gray-700"}`}>
        Rs.{safeFloat(currentVal).toFixed(2)}
      </div>
      {isAdjusted && (
        <div className="text-xs mt-0.5">
          <span className="text-gray-400 line-through">
            Rs.{safeFloat(originalVal).toFixed(2)}
          </span>
          <span
            className={`ml-1.5 font-medium ${adjChange >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            {adjChange >= 0 ? "↑" : "↓"}
            {Math.abs(adjChange).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── SELECT FIELD ─────────────────────────────────────────────────────────────
const SelectField = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 rounded-lg border border-[#C9D9EE] bg-white text-sm focus:ring-2 focus:ring-[#0A6ED1]/40 focus:border-[#0A6ED1] outline-none"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, bg, border, iconBg }) => (
  <div
    className={`${bg} ${border} p-3 rounded-xl shadow-sm flex items-center gap-3 hover:shadow-md transition-all`}
  >
    <div className={`${iconBg} p-2 rounded-lg`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div>
      <p className="text-xs font-medium text-[#5A6B7A] uppercase tracking-wide">
        {title}
      </p>
      <p className="text-lg font-bold text-[#0A294F] mt-0.5">{value}</p>
    </div>
  </div>
);

// ─── PRODUCT ROW ──────────────────────────────────────────────────────────────
const ProductRow = ({
  product,
  isExpanded,
  onToggleExpand,
  onToggleSelect,
  onPriceChange,
  onReset,
  adjustment,
  editTargetField,
  departments,
  roundPrice,
}) => {
  const [editing, setEditing]     = useState(false);
  const [editField, setEditField] = useState(editTargetField);
  const [tempVal, setTempVal]     = useState(0);

  const department = departments.find((d) => d.id === product.department_id);
  const stockPrice   = safeFloat(product.stock_price);
  const sellingPrice = safeFloat(product.selling_price);
  const actualCost   = safeFloat(product.actual_cost);
  const qty          = safeFloat(product.qty);

  const hasAdj   = !!adjustment;
  const adjField = adjustment?.field;
  const originalAdjVal =
    adjField === "stock_price"
      ? product.original_stock_price
      : adjField === "actual_cost"
      ? product.original_actual_cost
      : product.original_selling_price;
  const newAdjVal = safeFloat(adjustment?.value);
  const adjChange = newAdjVal - originalAdjVal;

  const startEdit = () => {
    const resolvedField =
      product.entity_type === "service" ||
      editTargetField === "actual_cost" ||
      editTargetField === "stock_price"
        ? "selling_price"
        : editTargetField;
    setEditField(resolvedField);
    setTempVal(sellingPrice);
    setEditing(true);
  };

  const confirmEdit = () => {
    const rounded = roundPrice(tempVal);
    onPriceChange(rounded, editField);
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  if (!product.has_grn) return null;

  return (
    <>
      <tr
        className={`border-b transition-colors ${hasAdj ? "bg-amber-50/60" : "hover:bg-gray-50"}`}
      >
        {/* Checkbox */}
        <td className="px-3 py-2">
          <button type="button" onClick={onToggleSelect}>
            {product.isSelected ? (
              <CheckSquare className="w-4 h-4 text-[#0A6ED1]" />
            ) : (
              <Square className="w-4 h-4 text-gray-300" />
            )}
          </button>
        </td>

        {/* Product info */}
        <td className="px-3 py-2 min-w-[180px]">
          <div className="font-medium text-gray-800 text-sm leading-tight">
            {product.description}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Hash className="w-3 h-3" />
            {product.product_code}
          </div>
        </td>

        {/* Brand / Category */}
        <td className="px-3 py-2">
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 text-gray-700">
              <Tag className="w-3 h-3 text-gray-400" />
              {product.brand_name}
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Layers className="w-3 h-3" />
              {product.category}
            </div>
          </div>
        </td>

        {/* GRN */}
        <td className="px-3 py-2">
          <div className="text-sm font-medium text-gray-800">
            {product.grn_code}
          </div>
          <div className="text-xs text-gray-500">
            {product.grn_date
              ? new Date(product.grn_date).toLocaleDateString()
              : "N/A"}
          </div>
        </td>

        {/* Stock Price */}
        <td className="px-3 py-2">
          <PriceCell
            field="stock_price"
            currentVal={stockPrice}
            originalVal={product.original_stock_price}
            adjField={adjField}
            adjChange={adjChange}
            activeColor="text-teal-700"
          />
        </td>

        {/* Actual Cost */}
        <td className="px-3 py-2">
          <PriceCell
            field="actual_cost"
            currentVal={actualCost}
            originalVal={product.original_actual_cost}
            adjField={adjField}
            adjChange={adjChange}
            activeColor="text-purple-700"
          />
        </td>

        {/* Selling Price */}
        <td className="px-3 py-2">
          <PriceCell
            field="selling_price"
            currentVal={sellingPrice}
            originalVal={product.original_selling_price}
            adjField={adjField}
            adjChange={adjChange}
            activeColor="text-[#0A6ED1]"
          />
        </td>

        {/* Stock / Profit */}
        <td className="px-3 py-2">
          <div className="text-xs text-gray-600">Qty: {qty}</div>
          <div className="mt-1">
            <ProfitBadge value={product.profit_margin} />
          </div>
        </td>

        {/* Actions */}
        <td className="px-3 py-2">
          {editing ? (
            <div className="flex flex-col gap-1 min-w-[200px]">
              {product.entity_type === "service" ? (
                <span className="text-xs font-semibold text-[#0A6ED1]">
                  Service Price
                </span>
              ) : (
                <FieldToggle
                  value={editField}
                  onChange={setEditField}
                  size="sm"
                />
              )}
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-xs">Rs.</span>
                <input
                  type="number"
                  value={tempVal}
                  onChange={(e) => setTempVal(safeFloat(e.target.value))}
                  onBlur={() => setTempVal(roundPrice(tempVal))}
                  className="w-24 px-2 py-1 text-sm border rounded border-gray-300 focus:border-[#0A6ED1] focus:ring-1 focus:ring-[#0A6ED1] outline-none"
                  step="0.01"
                  min="0"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={confirmEdit}
                  className="text-green-600 hover:text-green-800 p-1"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {hasAdj && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-xs text-red-600 hover:text-red-800 px-1.5 py-1 border border-red-200 rounded hover:bg-red-50"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={startEdit}
                title={`Edit ${FIELD_OPTIONS.find((f) => f.value === editTargetField)?.label}`}
                className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onToggleExpand}
                className="text-gray-500 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded detail row */}
      {isExpanded && (
        <tr className="bg-blue-50/50 border-b">
          <td colSpan={9} className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-gray-700 mb-2">Price Details</p>
                <div className="space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Original Stock Price:</span>
                    <span className="font-medium">
                      Rs.{product.original_stock_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original Actual Cost:</span>
                    <span className="font-medium">
                      Rs.{product.original_actual_cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original Selling Price:</span>
                    <span className="font-medium">
                      Rs.{product.original_selling_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-1 mt-1 space-y-1">
                    <div className="flex justify-between">
                      <span>Current Stock Price:</span>
                      <span className={`font-semibold ${adjField === "stock_price" ? "text-teal-700" : ""}`}>
                        Rs.{stockPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Actual Cost:</span>
                      <span className={`font-semibold ${adjField === "actual_cost" ? "text-purple-700" : ""}`}>
                        Rs.{actualCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Selling Price:</span>
                      <span className={`font-semibold ${adjField === "selling_price" ? "text-[#0A6ED1]" : ""}`}>
                        Rs.{sellingPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-1 border-t">
                    <span>Profit per Unit:</span>
                    <span className="text-green-600 font-medium">
                      Rs.{(sellingPrice - actualCost).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">Inventory</p>
                <div className="space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Qty:</span>
                    <span className="font-medium">{qty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium">
                      Rs.{(sellingPrice * qty).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <span>{department?.department_name || "N/A"}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-2">Product Info</p>
                <div className="space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Group:</span> <span>{product.group}</span>
                  </div>
                  {product.size && (
                    <div className="flex justify-between">
                      <span>Size:</span> <span>{product.size}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const PriceController = () => {
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [grns, setGrns] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceTargetType, setPriceTargetType] = useState("products");

  // priceAdjustments[productId] = { field: "selling_price"|"actual_cost"|"stock_price", value: number }
  const [priceAdjustments, setPriceAdjustments] = useState({});
  const [showChangesTable, setShowChangesTable] = useState(false);

  // ── Global edit-field toggle (applies to bulk ops + row edit button) ──────
  const [editTargetField, setEditTargetField] = useState("selling_price");

  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [expandedProduct, setExpandedProduct] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");

  // Bulk
  const [bulkOperation, setBulkOperation] = useState("increase");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkType, setBulkType] = useState("percentage");

  // Rounding
  const [roundingIncrement, setRoundingIncrement] = useState(50);
  const [roundingDirection, setRoundingDirection] = useState("nearest");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedProducts(new Set());
    setPriceAdjustments({});
    setExpandedProduct(null);
    if (priceTargetType === "services") {
      setEditTargetField("selling_price");
      setSelectedDepartment("all");
      setSelectedBrand("all");
      setSelectedSize("all");
    }
  }, [priceTargetType]);

  // ── Rounding ───────────────────────────────────────────────────────────────
  const roundPrice = (price) => {
    const n = safeFloat(price);
    if (roundingIncrement === 0) return n; // No rounding
    let r;
    switch (roundingDirection) {
      case "up":
        r = Math.ceil(n / roundingIncrement) * roundingIncrement;
        break;
      case "down":
        r = Math.floor(n / roundingIncrement) * roundingIncrement;
        break;
      default:
        r = Math.round(n / roundingIncrement) * roundingIncrement;
    }
    return Math.max(r, roundingIncrement);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pr, gr, dr, sr] = await Promise.all([
        api.get("/products"),
        api.get("/grns"),
        api.get("/departments"),
        api.get("/services"),
      ]);
      setProducts(pr.data.data || []);
      setGrns(gr.data.data || []);
      setDepartments(dr.data.data || []);
      setServices(sr.data.data || []);
      setSelectedProducts(new Set());
      setPriceAdjustments({});
      toast.success("Data refreshed!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const getLatestGrn = (productCode) =>
    grns
      .filter((g) => g.items?.some((i) => i.product_code === productCode))
      .map((g) => ({
        ...g,
        item: g.items.find((i) => i.product_code === productCode),
      }))
      .sort(sortLatestFirst)[0] || null;

  // ── Enriched products ──────────────────────────────────────────────────────
  const enrichedProducts = useMemo(() => {
    return products.map((product) => {
      const latestGrn = getLatestGrn(product.product_code);
      const item = latestGrn?.item;

      if (!latestGrn || !item) {
        return {
          ...product,
          entity_type: "product",
          stock_price: 0,
          original_stock_price: 0,
          selling_price: 0,
          original_selling_price: 0,
          actual_cost: 0,
          original_actual_cost: 0,
          profit_margin: 0,
          grn_code: "N/A",
          grn_date: null,
          department_id: null,
          qty: 0,
          has_grn: false,
          isSelected: selectedProducts.has(product.id),
        };
      }

      const stockPrice   = safeFloat(item.stock_price);
      const sellingPrice = safeFloat(item.selling_price);
      const actualCost   = safeFloat(item.actual_cost);
      const profitMargin =
        sellingPrice > 0
          ? ((sellingPrice - actualCost) / sellingPrice) * 100
          : 0;

      const adj = priceAdjustments[product.id];

      return {
        id: product.id,
        entity_type: "product",
        product_code: product.product_code,
        product_name: product.product_name,
        description: product.description,
        brand_name: product.brand_name || "No Brand",
        category: product.category || "No Category",
        group: product.group || "No Group",
        size: product.size,

        // Current display values (adjusted or original)
        stock_price:   adj?.field === "stock_price"   ? adj.value : stockPrice,
        selling_price: adj?.field === "selling_price" ? adj.value : sellingPrice,
        actual_cost:   adj?.field === "actual_cost"   ? adj.value : actualCost,

        // Originals (never overwritten)
        original_stock_price:   stockPrice,
        original_selling_price: sellingPrice,
        original_actual_cost:   actualCost,

        profit_margin: profitMargin,
        grn_code: latestGrn.grn_code || "N/A",
        grn_date: latestGrn.grn_date || null,
        department_id: latestGrn.department_id || null,
        qty: safeFloat(item.qty),

        has_grn: true,
        isSelected: selectedProducts.has(product.id),
        hasAdjustment: !!adj,
        latest_grn_item: item,
      };
    });
  }, [products, grns, selectedProducts, priceAdjustments]);

  const enrichedServices = useMemo(() => {
    return services.map((service) => {
      const adj = priceAdjustments[service.id];
      const price = safeFloat(service.price);
      const cost = safeFloat(service.cost);
      const currentPrice = adj?.field === "selling_price" ? adj.value : price;
      const profitMargin =
        currentPrice > 0 ? ((currentPrice - cost) / currentPrice) * 100 : 0;

      return {
        id: service.id,
        entity_type: "service",
        service_id: service.id,
        product_code: `SVC-${service.id}`,
        product_name: service.name,
        description: service.description || service.name,
        brand_name: service.category || "Service",
        category: service.category || "Uncategorized",
        group: "Service",
        size: "",
        stock_price: 0,
        selling_price: currentPrice,
        actual_cost: cost,
        original_stock_price: 0,
        original_selling_price: price,
        original_actual_cost: cost,
        profit_margin: profitMargin,
        grn_code: "SERVICE",
        grn_date: service.updated_at || service.created_at || null,
        department_id: null,
        qty: 1,
        has_grn: true,
        isSelected: selectedProducts.has(service.id),
        hasAdjustment: !!adj,
        service_payload: service,
      };
    });
  }, [services, selectedProducts, priceAdjustments]);

  const activeItems =
    priceTargetType === "services" ? enrichedServices : enrichedProducts;

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return activeItems.filter((p) => {
      if (!p.has_grn) return false;
      const s = searchTerm.toLowerCase();
      return (
        ((p.product_name || "").toLowerCase().includes(s) ||
          (p.product_code || "").toLowerCase().includes(s) ||
          (p.description || "").toLowerCase().includes(s) ||
          (p.brand_name || "").toLowerCase().includes(s) ||
          (p.category || "").toLowerCase().includes(s)) &&
        (priceTargetType === "services" ||
          selectedDepartment === "all" ||
          String(p.department_id) === String(selectedDepartment)) &&
        (priceTargetType === "services" ||
          selectedBrand === "all" ||
          p.brand_name === selectedBrand) &&
        (selectedCategory === "all" || p.category === selectedCategory) &&
        (priceTargetType === "services" ||
          selectedSize === "all" ||
          (p.size || "")
            .split(",")
            .map((x) => x.trim())
            .includes(selectedSize))
      );
    });
  }, [
    activeItems,
    searchTerm,
    selectedDepartment,
    selectedBrand,
    selectedCategory,
    selectedSize,
    priceTargetType,
  ]);

  const brands = useMemo(
    () => [
      "all",
      ...new Set(activeItems.map((p) => p.brand_name).filter(Boolean)),
    ],
    [activeItems],
  );
  const categories = useMemo(
    () => [
      "all",
      ...new Set(activeItems.map((p) => p.category).filter(Boolean)),
    ],
    [activeItems],
  );
  const sizes = useMemo(
    () => [
      "all",
      ...new Set(
        activeItems
          .flatMap((p) => (p.size ? p.size.split(",") : []))
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ],
    [activeItems],
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const sel = filteredProducts.filter((p) => p.isSelected);
    const base = sel.length > 0 ? sel : filteredProducts;
    return {
      totalProducts: filteredProducts.length,
      selectedProducts: sel.length,
      avgProfit:
        base.length > 0
          ? base.reduce((s, p) => s + (p.profit_margin || 0), 0) / base.length
          : 0,
      totalValue: base.reduce((s, p) => s + p.selling_price * (p.qty || 0), 0),
      pendingChanges: Object.keys(priceAdjustments).length,
    };
  }, [filteredProducts, priceAdjustments]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    const s = new Set(selectedProducts);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedProducts(s);
  };
  const selectAll = () => {
    setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    toast.success(
      `Selected ${filteredProducts.length} ${
        priceTargetType === "services" ? "services" : "products"
      }`,
    );
  };
  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  // ── Price adjustment ───────────────────────────────────────────────────────
  const handlePriceChange = (productId, newPrice, field) => {
    const rounded = roundPrice(safeFloat(newPrice));
    setPriceAdjustments((prev) => ({
      ...prev,
      [productId]: { field: field || editTargetField, value: rounded },
    }));
  };

  const resetAdjustment = (productId) => {
    setPriceAdjustments((prev) => {
      const c = { ...prev };
      delete c[productId];
      return c;
    });
  };

  // ── Helper: get original value for a field ─────────────────────────────────
  const getOriginalValue = (product, field) => {
    if (field === "stock_price")  return product.original_stock_price;
    if (field === "actual_cost")  return product.original_actual_cost;
    return product.original_selling_price;
  };

  // ── Bulk operation ─────────────────────────────────────────────────────────
  const applyBulkOperation = () => {
    const v = safeFloat(bulkValue);
    if (!bulkValue || v <= 0) {
      toast.error("Enter a valid value");
      return;
    }
    if (!selectedProducts.size) {
      toast.error("Select products first");
      return;
    }

    let count = 0;
    Array.from(selectedProducts).forEach((id) => {
      const p = activeItems.find((x) => x.id === id);
      if (!p?.has_grn) return;

      if (priceTargetType === "services" || editTargetField === "selling_price") {
        // Direct: apply percentage/amount to selling_price itself
        const originalSelling = p.original_selling_price;
        let newVal;
        if (bulkType === "percentage") {
          const m = bulkOperation === "increase" ? 1 + v / 100 : 1 - v / 100;
          newVal = originalSelling * m;
        } else {
          newVal =
            bulkOperation === "increase"
              ? originalSelling + v
              : Math.max(0, originalSelling - v);
        }
        handlePriceChange(id, newVal, "selling_price");
      } else {
        // actual_cost or stock_price: calculate selling_price directly from
        // the base field. actual_cost/stock_price are never modified.
        const baseVal = getOriginalValue(p, editTargetField);

        let newSellingPrice;
        if (bulkType === "percentage") {
          const m = bulkOperation === "increase" ? 1 + v / 100 : 1 - v / 100;
          newSellingPrice = baseVal * m;
        } else {
          newSellingPrice =
            bulkOperation === "increase"
              ? baseVal + v
              : Math.max(0, baseVal - v);
        }

        handlePriceChange(id, newSellingPrice, "selling_price");
      }
      count++;
    });

    const fieldLabel =
      priceTargetType === "services"
        ? "Service Price"
        : FIELD_OPTIONS.find((f) => f.value === editTargetField)?.label ||
          editTargetField;
    const targetLabel =
      editTargetField !== "selling_price"
        ? `${fieldLabel} → Selling Price`
        : fieldLabel;
    toast.success(
      `Applied to ${count} ${
        priceTargetType === "services" ? "services" : "products"
      } (${targetLabel})`,
    );
  };

  // ── Pending changes ────────────────────────────────────────────────────────
  const pendingChanges = useMemo(() => {
    return Object.entries(priceAdjustments)
      .map(([id, adj]) => {
        const p = activeItems.find((x) => x.id.toString() === id);
        if (!p?.has_grn) return null;

        const originalVal = getOriginalValue(p, adj.field);
        const newVal      = safeFloat(adj.value);
        const change      = newVal - originalVal;
        const pct =
          originalVal > 0 ? ((change / originalVal) * 100).toFixed(2) : "0.00";
        const fieldCfg = FIELD_OPTIONS.find((f) => f.value === adj.field);

        const fieldBadgeClass =
          adj.field === "selling_price"
            ? "bg-[#E5F0FF] text-[#0A3C7D]"
            : adj.field === "actual_cost"
            ? "bg-purple-100 text-purple-800"
            : "bg-teal-100 text-teal-800";

        return {
          id,
          entity_type: p.entity_type,
          service_id: p.service_id,
          product_code: p.product_code,
          product_name: p.product_name,
          description: p.description || p.product_name,
          brand: p.brand_name,
          grn_code: p.grn_code,
          field: adj.field,
          field_label: fieldCfg?.label || adj.field,
          field_color: fieldCfg?.color || "text-gray-700",
          field_badge: fieldBadgeClass,
          original_val: originalVal,
          new_val: newVal,
          change_amount: change,
          change_percent: pct,
          service_payload: p.service_payload,
        };
      })
      .filter(Boolean);
  }, [priceAdjustments, activeItems]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const savePriceChanges = async () => {
    if (!pendingChanges.length) {
      toast.error("No changes to save");
      return;
    }
    setSaving(true);
    const t = toast.loading(`Saving ${pendingChanges.length} change(s)...`);

    try {
      const results = [];
      for (const ch of pendingChanges) {
        try {
          const res =
            ch.entity_type === "service"
              ? await api.post("/services/update-price", {
                  id: ch.service_id,
                  price: ch.new_val,
                })
              : await api.post("/grn-items/update-price", {
                  product_code: ch.product_code,
                  grn_code: ch.grn_code,
                  field: ch.field,   // "selling_price" | "actual_cost" | "stock_price"
                  value: ch.new_val,
                  reason: `${ch.field_label} adjustment from Price Controller`,
                });
          results.push({
            product_code: ch.product_code,
            success: res.data.success,
          });
        } catch (e) {
          results.push({
            product_code: ch.product_code,
            success: false,
            message: e.response?.data?.message || e.message,
          });
        }
      }

      toast.dismiss(t);
      const ok   = results.filter((r) => r.success).length;
      const fail = results.filter((r) => !r.success);

      if (ok > 0) {
        toast.success(`✅ Updated ${ok} price(s) successfully!`);
        if (fail.length)
          setTimeout(
            () =>
              toast.error(
                `Failed: ${fail.length} ${
                  priceTargetType === "services" ? "service(s)" : "product(s)"
                }`,
              ),
            800,
          );
        setPriceAdjustments({});
        setShowChangesTable(false);
        await fetchData();
      } else {
        toast.error("❌ All updates failed");
        const sql = pendingChanges
          .map((c) =>
            c.entity_type === "service"
              ? `UPDATE services SET price = ${c.new_val} WHERE id = ${c.service_id};`
              : `UPDATE grn_items SET ${c.field} = ${c.new_val} WHERE product_code = '${c.product_code}' AND grn_code = '${c.grn_code}';`,
          )
          .join("\n");
        console.log("Manual SQL:", sql);
        try {
          await navigator.clipboard.writeText(sql);
          toast.success("SQL copied to clipboard");
        } catch {}
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!filteredProducts.length) {
      toast.error("No data to export");
      return;
    }
    const rows = filteredProducts
      .filter((p) => p.has_grn)
      .map((p) => {
        const dept = departments.find((d) => d.id === p.department_id);
        return priceTargetType === "services"
          ? [
              p.product_code,
              `"${p.product_name}"`,
              p.category || "",
              safeFloat(p.actual_cost).toFixed(2),
              safeFloat(p.selling_price).toFixed(2),
              safeFloat(p.profit_margin).toFixed(2),
            ].join(",")
          : [
              p.product_code,
              `"${p.product_name}"`,
              p.brand_name || "",
              p.category || "",
              p.grn_code,
              p.grn_date ? new Date(p.grn_date).toLocaleDateString() : "",
              dept?.department_name || "",
              safeFloat(p.stock_price).toFixed(2),
              safeFloat(p.actual_cost).toFixed(2),
              safeFloat(p.selling_price).toFixed(2),
              safeFloat(p.qty),
              safeFloat(p.profit_margin).toFixed(2),
            ].join(",");
      });
    const csv = [
      priceTargetType === "services"
        ? "Service Code,Service Name,Category,Cost,Price,Profit %"
        : "Product Code,Product Name,Brand,Category,GRN Code,GRN Date,Department,Stock Price,Actual Cost,Selling Price,Qty,Profit %",
      ...rows,
    ].join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `${priceTargetType}-prices-${new Date().toISOString().split("T")[0]}.csv`,
    });
    a.click();
    toast.success(
      `Exported ${filteredProducts.length} ${
        priceTargetType === "services" ? "services" : "products"
      }`,
    );
  };

  // ── Pending Changes Table ─────────────────────────────────────────────────
  const PendingChangesTable = () => {
    if (!pendingChanges.length) return null;

    const spCount = pendingChanges.filter((c) => c.field === "selling_price").length;
    const acCount = pendingChanges.filter((c) => c.field === "actual_cost").length;
    const skCount = pendingChanges.filter((c) => c.field === "stock_price").length;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-amber-300 overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800">
              Pending Changes ({pendingChanges.length})
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              {skCount > 0 && (
                <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                  {skCount} Stock Price
                </span>
              )}
              {acCount > 0 && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                  {acCount} Actual Cost
                </span>
              )}
              {spCount > 0 && (
                <span className="px-2 py-0.5 bg-[#E5F0FF] text-[#0A3C7D] rounded-full">
                  {spCount} Selling Price
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowChangesTable(!showChangesTable)}
            className="text-amber-600 hover:text-amber-800 p-1"
          >
            {showChangesTable ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {showChangesTable && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-amber-100">
                  <tr>
                    {[
                      "Product",
                      "Brand",
                      "GRN",
                      "Updating Field",
                      "Old Value",
                      "New Value",
                      "Change",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold text-amber-800 text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {pendingChanges.map((ch) => (
                    <tr key={ch.id} className="hover:bg-amber-50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">
                          {ch.product_code}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[140px]">
                          {ch.description}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{ch.brand}</td>
                      <td className="px-3 py-2 font-medium text-gray-700">
                        {ch.grn_code}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ch.field_badge}`}
                        >
                          {ch.field === "selling_price" ? (
                            <ShoppingCart className="w-3 h-3" />
                          ) : ch.field === "actual_cost" ? (
                            <Wallet className="w-3 h-3" />
                          ) : (
                            <Boxes className="w-3 h-3" />
                          )}
                          {ch.field_label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        Rs.{safeFloat(ch.original_val).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 font-bold text-blue-600">
                        Rs.{safeFloat(ch.new_val).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            ch.change_amount >= 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ch.change_amount >= 0 ? "↑" : "↓"} Rs.
                          {Math.abs(safeFloat(ch.change_amount)).toFixed(2)} (
                          {ch.change_percent}%)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
              <button
                onClick={savePriceChanges}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving
                  ? "Saving..."
                  : `Save ${pendingChanges.length} Change(s)`}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F6FB]">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 rounded-full border-[3px] border-[#D5E3F4] border-t-[#0A6ED1] mx-auto" />
          <p className="mt-3 text-sm font-medium text-[#0A294F]/70">
            Loading price data...
          </p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#0A294F",
            border: "1px solid #D5E3F4",
            borderRadius: "8px",
            padding: "12px 16px",
          },
        }}
      />

      <div className="min-h-screen bg-[#F4F6FB] p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* ── HEADER ─────────────────────────────────────────────── */}
          <div className="bg-white border border-[#D5E3F4] rounded-xl shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0A294F]">
                  Price Controller
                </h1>
                <p className="text-sm text-[#5A6B7A] mt-0.5">
                  {priceTargetType === "services"
                    ? "Update service selling prices"
                    : "Update stock price, actual cost & selling price for GRN products"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {pendingChanges.length > 0 && (
                  <button
                    onClick={() => setShowChangesTable(!showChangesTable)}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 text-sm font-medium"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {pendingChanges.length} Pending
                  </button>
                )}
                <button
                  onClick={fetchData}
                  className="flex items-center gap-2 px-3 py-2 border border-[#0A6ED1]/40 text-[#0A6ED1] bg-white hover:bg-[#E5F1FF] rounded-lg text-sm font-medium"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-2 bg-[#0A6ED1] hover:bg-[#085AA5] text-white text-sm font-medium rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* ── STATS ──────────────────────────────────────────────── */}
          <div className="bg-white border border-[#D5E3F4] rounded-xl shadow-sm p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#0A294F] mr-1">
                Price Type
              </span>
              <button
                onClick={() => setPriceTargetType("products")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  priceTargetType === "products"
                    ? "bg-[#0A6ED1] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Package className="w-4 h-4" />
                Products
              </button>
              <button
                onClick={() => setPriceTargetType("services")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  priceTargetType === "services"
                    ? "bg-[#0A6ED1] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Wrench className="w-4 h-4" />
                Services
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title={priceTargetType === "services" ? "Services" : "Products"}
              value={stats.totalProducts}
              icon={priceTargetType === "services" ? Wrench : Package}
              bg="bg-white"
              border="border border-[#D5E3F4]"
              iconBg="bg-[#0A6ED1]"
            />
            <StatCard
              title="Selected"
              value={stats.selectedProducts}
              icon={CheckSquare}
              bg="bg-white"
              border="border border-[#D5E3F4]"
              iconBg="bg-green-600"
            />
            <StatCard
              title="Avg Profit"
              value={`${safeFloat(stats.avgProfit).toFixed(2)}%`}
              icon={Percent}
              bg="bg-[#FFF9E8]"
              border="border border-[#F2D9A6]"
              iconBg="bg-orange-500"
            />
            <StatCard
              title="Inv. Value"
              value={`Rs.${(safeFloat(stats.totalValue) / 1000).toFixed(1)}K`}
              icon={DollarSign}
              bg="bg-[#F5F0FF]"
              border="border border-[#E0D5F4]"
              iconBg="bg-purple-600"
            />
          </div>

          {/* ── GLOBAL EDIT-FIELD SELECTOR ──────────────────────────── */}
          {priceTargetType === "products" ? (
          <div className="bg-white border border-[#D5E3F4] rounded-xl shadow-sm p-3">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0A294F]">
                  Price Field to Edit
                </p>
                <p className="text-xs text-[#5A6B7A] mt-0.5">
                  {editTargetField === "selling_price"
                    ? "Applies to the ✏️ edit button and bulk operations"
                    : "Adjustment calculated from this field → applied to Selling Price only"}
                </p>
              </div>
              <FieldToggle
                value={editTargetField}
                onChange={setEditTargetField}
              />
            </div>
          </div>
          ) : (
            <div className="bg-white border border-[#D5E3F4] rounded-xl shadow-sm p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#0A294F]">
                    Service Price Editing
                  </p>
                  <p className="text-xs text-[#5A6B7A] mt-0.5">
                    Bulk and row edits update the selected service price directly
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-lg bg-[#E5F0FF] text-[#0A3C7D] text-sm font-semibold">
                  Selling Price
                </span>
              </div>
            </div>
          )}

          {/* ── ROUNDING ───────────────────────────────────────────── */}
          <div className="bg-white border border-[#D5E3F4] rounded-xl shadow-sm p-3">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#0A294F]">
                Price Rounding
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={roundingIncrement}
                  onChange={(e) => setRoundingIncrement(Number(e.target.value))}
                  className="px-2 py-1.5 rounded border border-[#C9D9EE] bg-white text-xs"
                >
                  {[0, 10, 25, 50, 100, 500].map((v) => (
                    <option key={v} value={v}>
                      {v === 0 ? "No Rounding" : `Round to ${v}`}
                    </option>
                  ))}
                </select>
                <select
                  value={roundingDirection}
                  onChange={(e) => setRoundingDirection(e.target.value)}
                  className="px-2 py-1.5 rounded border border-[#C9D9EE] bg-white text-xs"
                >
                  <option value="nearest">Nearest</option>
                  <option value="up">Always Up</option>
                  <option value="down">Always Down</option>
                </select>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1.5 rounded">
                  e.g. 142→150, 168→200
                </span>
              </div>
            </div>
          </div>

          {/* ── PENDING CHANGES TABLE ───────────────────────────────── */}
          <PendingChangesTable />

          {/* ── BULK OPERATIONS ─────────────────────────────────────── */}
          {selectedProducts.size > 0 && (
            <div className="bg-white border border-[#D5E3F4] rounded-xl shadow-sm p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#0A294F]">
                    {selectedProducts.size} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                  >
                    Clear
                  </button>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      editTargetField === "selling_price"
                        ? "bg-[#E5F0FF] text-[#0A3C7D]"
                        : editTargetField === "actual_cost"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {editTargetField !== "selling_price" ? "Base: " : "Editing: "}
                    {FIELD_OPTIONS.find((f) => f.value === editTargetField)?.label}
                    {editTargetField !== "selling_price" && " → Selling Price"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkOperation}
                    onChange={(e) => setBulkOperation(e.target.value)}
                    className="px-2 py-1.5 rounded border border-[#C9D9EE] bg-white text-xs"
                  >
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder="Value"
                    className="px-2 py-1.5 rounded border border-[#C9D9EE] text-xs w-20"
                    step="0.01"
                    min="0"
                  />
                  <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value)}
                    className="px-2 py-1.5 rounded border border-[#C9D9EE] bg-white text-xs"
                  >
                    <option value="percentage">%</option>
                    <option value="amount">Rs.</option>
                  </select>
                  <button
                    onClick={applyBulkOperation}
                    className="px-3 py-1.5 bg-[#0A6ED1] text-white rounded hover:bg-[#085AA5] text-xs font-semibold"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── FILTERS ─────────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="bg-white border border-[#D5E3F4] rounded-xl shadow-sm p-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9AB5] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#C9D9EE] text-sm focus:ring-2 focus:ring-[#0A6ED1]/40 focus:border-[#0A6ED1] outline-none"
                  />
                </div>
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 px-3 py-2 bg-[#0A6ED1] text-white rounded-lg hover:bg-[#085AA5] text-sm font-medium"
                >
                  {selectedProducts.size === filteredProducts.length &&
                  filteredProducts.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  Select All
                </button>
              </div>
            </div>
            <div className="bg-white border border-[#D5E3F4] rounded-xl shadow-sm p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <SelectField
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  options={[
                    { value: "all", label: "All Departments" },
                    ...departments.map((d) => ({
                      value: d.id.toString(),
                      label: d.department_name,
                    })),
                  ]}
                />
                <SelectField
                  value={selectedBrand}
                  onChange={setSelectedBrand}
                  options={brands.map((b) => ({
                    value: b,
                    label: b === "all" ? "All Brands" : b,
                  }))}
                />
                <SelectField
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categories.map((c) => ({
                    value: c,
                    label: c === "all" ? "All Categories" : c,
                  }))}
                />
                <SelectField
                  value={selectedSize}
                  onChange={setSelectedSize}
                  options={sizes.map((s) => ({
                    value: s,
                    label: s === "all" ? "All Sizes" : s,
                  }))}
                />
              </div>
            </div>
          </div>

          {/* ── PRODUCTS TABLE ──────────────────────────────────────── */}
          {filteredProducts.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-[#D5E3F4] overflow-hidden min-h-[450px]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F3F6FC]">
                    <tr>
                      <th className="px-3 py-2.5 w-8" />
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#8A9AB5] uppercase">
                        Product
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#8A9AB5] uppercase">
                        Brand / Category
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#8A9AB5] uppercase">
                        GRN
                      </th>
                      <th
                        className={`px-3 py-2.5 text-left text-xs font-semibold uppercase ${
                          editTargetField === "stock_price"
                            ? "text-teal-600"
                            : "text-[#8A9AB5]"
                        }`}
                      >
                        Stock Price {editTargetField === "stock_price" && "✏️"}
                      </th>
                      <th
                        className={`px-3 py-2.5 text-left text-xs font-semibold uppercase ${
                          editTargetField === "actual_cost"
                            ? "text-purple-600"
                            : "text-[#8A9AB5]"
                        }`}
                      >
                        Actual Cost {editTargetField === "actual_cost" && "✏️"}
                      </th>
                      <th
                        className={`px-3 py-2.5 text-left text-xs font-semibold uppercase ${
                          editTargetField === "selling_price"
                            ? "text-[#0A6ED1]"
                            : "text-[#8A9AB5]"
                        }`}
                      >
                        Selling Price{" "}
                        {editTargetField === "selling_price" && "✏️"}
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#8A9AB5] uppercase">
                        Stock / Profit
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#8A9AB5] uppercase w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        isExpanded={expandedProduct === product.id}
                        onToggleExpand={() =>
                          setExpandedProduct((p) =>
                            p === product.id ? null : product.id,
                          )
                        }
                        onToggleSelect={() => toggleSelect(product.id)}
                        onPriceChange={(val, field) =>
                          handlePriceChange(product.id, val, field)
                        }
                        onReset={() => resetAdjustment(product.id)}
                        adjustment={priceAdjustments[product.id]}
                        editTargetField={editTargetField}
                        departments={departments}
                        roundPrice={roundPrice}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-[#E1E6F0] bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredProducts.length} products
                  {pendingChanges.length > 0 && (
                    <span className="ml-2 text-amber-600 font-medium">
                      • {pendingChanges.length} change(s) pending
                    </span>
                  )}
                </p>
                {pendingChanges.length > 0 && (
                  <button
                    onClick={savePriceChanges}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-semibold rounded-lg"
                  >
                    <Save className="w-4 h-4" />
                    {saving
                      ? "Saving..."
                      : `Save ${pendingChanges.length} Change(s)`}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-[#D5E3F4] p-10 text-center min-h-[450px] flex flex-col justify-center items-center">
              <ShoppingBag className="w-12 h-12 text-[#C0CADB] mx-auto mb-4" />
              <p className="text-lg font-semibold text-[#0A294F]">
                No products found
              </p>
              <p className="text-sm text-[#5A6B7A] mt-1">
                Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PriceController;

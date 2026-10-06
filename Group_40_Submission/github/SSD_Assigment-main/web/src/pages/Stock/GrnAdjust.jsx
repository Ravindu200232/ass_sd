// pages/GrnAdjust.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  Search,
  Calendar,
  Building2,
  FileText,
  X,
  Plus,
  Minus,
  RefreshCw,
  Package,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  User2,
  FileDown,
  BarChart3,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  Printer,
} from "lucide-react";
import { validateSpreadsheetFile, validateRowCount } from "@/lib/validateUpload";

// Main Page Component
export default function GrnAdjust() {
  const navigate = useNavigate();
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentHistory, setAdjustmentHistory] = useState([]);

  useEffect(() => {
    fetchGRNs();
    fetchAdjustmentHistory();
  }, []);

  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/grns");
      setGrns(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjustmentHistory = async () => {
    try {
      const res = await api.get("/grns/adjustment-history");
      setAdjustmentHistory(res.data.data || []);
    } catch (error) {
      console.error("Failed to load adjustment history:", error);
    }
  };

  const filtered = grns.filter((g) => {
    const s = search.toLowerCase();
    return (
      (g.grn_code?.toLowerCase().includes(s) ||
        g.created_by?.full_name?.toLowerCase().includes(s) ||
        g.department?.department_name?.toLowerCase().includes(s)) &&
      (dateFilter ? g.grn_date?.startsWith(dateFilter) : true) &&
      (departmentFilter
        ? g.department?.department_name
            ?.toLowerCase()
            .includes(departmentFilter.toLowerCase())
        : true)
    );
  });

  const handleAdjustQuantity = (grnItem) => {
    setSelectedItem(grnItem);
    setShowAdjustModal(true);
  };

  const handleAdjustSuccess = () => {
    toast.success("Quantity adjusted successfully");
    fetchGRNs();
    fetchAdjustmentHistory();
    setShowAdjustModal(false);
    setSelectedItem(null);
  };

  const handleBulkSuccess = () => {
    toast.success("Bulk adjustment completed");
    fetchGRNs();
    fetchAdjustmentHistory();
    setShowBulkModal(false);
  };

  const downloadExcelReport = () => {
    const data = filtered.map((grn) => ({
      "GRN Code": grn.grn_code,
      Date: grn.grn_date,
      Department: grn.department?.department_name,
      "Created By": grn.created_by?.full_name,
      "Total Items": grn.total_item,
      "Total Cost": grn.total_cost,
      "Total Selling": grn.total_selling_amount,
      "Total Profit": grn.total_profit,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GRN Report");
    XLSX.writeFile(
      wb,
      `grn-report-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* PAGE HEADER */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  GRN Adjustment & Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage Goods Received Notes and adjust quantities
                </p>
              </div>
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/grn/create")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create GRN
            </Button>

            <Button
              onClick={() => setShowBulkModal(true)}
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Bulk Adjust
            </Button>

            
          </div>
        </div>
      </div>


<div className="max-w-7xl mx-auto mb-6">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">
              Total GRNs
            </p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {grns.length}
            </h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-green-600 font-medium">
          Total Items
        </p>
        <h3 className="text-2xl font-bold text-gray-800 mt-1">
          {grns.reduce((total, grn) => {
            // If grn has items array, sum all quantities
            if (grn.items && Array.isArray(grn.items)) {
              const itemSum = grn.items.reduce((sum, item) => {
                return sum + (Number(item.qty) || 0);
              }, 0);
              return total + itemSum;
            }
            
            // Fallback: check if total_item is a number
            return total + (Number(grn.total_item) || 0);
          }, 0)}
        </h3>
      </div>
      <div className="p-3 bg-green-100 rounded-lg">
        <BarChart3 className="w-6 h-6 text-green-600" />
      </div>
    </div>
  </CardContent>
</Card>

    <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-medium">
              Total Cost
            </p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              LKR{" "}
              {grns.reduce((total, grn) => {
                // Sum actual costs from items if available
                if (grn.items && Array.isArray(grn.items)) {
                  return total + grn.items.reduce((sum, item) => {
                    return sum + ((item.actual_cost || 0) * (item.qty || 0));
                  }, 0);
                }
                // Fallback to total_cost
                return total + (grn.total_cost || 0);
              }, 0).toLocaleString()}
            </h3>
          </div>
          <div className="p-3 bg-purple-100 rounded-lg">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </CardContent>
    </Card>

    
  </div>
</div>

      {/* FILTERS SECTION */}
      <Card className="max-w-7xl mx-auto mb-6 border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              Search & Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setDateFilter("");
                setDepartmentFilter("");
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search GRNs
              </Label>
              <Input
                placeholder="GRN code, department, user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Department
              </Label>
              <Input
                placeholder="Department name..."
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Status Filter
              </Label>
              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50"
                >
                  Active
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-green-50"
                >
                  Completed
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-red-50"
                >
                  Pending
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRN TABLE */}
      <Card className="max-w-7xl mx-auto border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All GRN Records ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => fetchGRNs()}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.print()}
              >
                <Printer className="w-3 h-3 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-1">
                      GRN Code
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Created By</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold text-right">
                    Total Cost
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Total Selling
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Profit
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-gray-500">Loading GRN records...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">
                          No GRN records found
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Try adjusting your search filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((grn) => (
                    <GRNTableRow
                      key={grn.id}
                      grn={grn}
                      onView={setSelectedGRN}
                      onAdjust={handleAdjustQuantity}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ADJUSTMENT HISTORY */}
      {adjustmentHistory.length > 0 && (
        <Card className="max-w-7xl mx-auto mt-6 border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-500" />
              Recent Adjustments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {adjustmentHistory.slice(0, 5).map((history, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        history.adjustment_type === "add"
                          ? "bg-green-100 text-green-600"
                          : history.adjustment_type === "subtract"
                          ? "bg-red-100 text-red-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {history.adjustment_type === "add" ? (
                        <Plus className="w-4 h-4" />
                      ) : history.adjustment_type === "subtract" ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {history.product_code} - {history.grn_code}
                      </p>
                      <p className="text-sm text-gray-500">
                        {history.adjustment_type === "add"
                          ? "Added"
                          : history.adjustment_type === "subtract"
                          ? "Subtracted"
                          : "Set"}{" "}
                        {Math.abs(history.new_qty - history.original_qty)} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(history.adjusted_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {history.reason?.substring(0, 30)}...
                    </p>
                  </div>
                </div>
              ))}
              {adjustmentHistory.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-800"
                  onClick={() => {
                    /* Navigate to full history page */
                  }}
                >
                  View All Adjustments ({adjustmentHistory.length})
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRN DETAILS MODAL */}
      {selectedGRN && (
        <GRNDetailsModal
          grn={selectedGRN}
          onClose={() => setSelectedGRN(null)}
          onAdjust={handleAdjustQuantity}
        />
      )}

      {/* QUANTITY ADJUST MODAL */}
      {showAdjustModal && selectedItem && (
        <QuantityAdjustModal
          grnItem={selectedItem}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedItem(null);
          }}
          onSuccess={handleAdjustSuccess}
        />
      )}

      {/* BULK ADJUST MODAL */}
      {showBulkModal && (
        <BulkAdjustModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleBulkSuccess}
        />
      )}
    </div>
  );
}

// ==================== COMPONENTS ====================

// GRN Table Row Component
const GRNTableRow = ({ grn, onView, onAdjust }) => {
  const profitMargin =
    grn.total_cost > 0
      ? ((grn.total_profit / grn.total_cost) * 100).toFixed(2)
      : 0;

  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell>
        <div className="font-mono font-semibold text-blue-700">
          {grn.grn_code}
        </div>
      </TableCell>

      <TableCell>
        <div className="text-sm">
          {new Date(grn.grn_date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </TableCell>

      <TableCell>
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          {grn.department?.department_name || "N/A"}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <User2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm">
            {grn.created_by?.full_name || "Unknown"}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
          {grn.total_item || 0} items
        </Badge>
      </TableCell>

      <TableCell className="text-right font-medium">
        <div className="text-gray-700">
          LKR {Number(grn.total_cost || 0).toLocaleString()}
        </div>
      </TableCell>

      <TableCell className="text-right font-medium">
        <div className="text-green-700">
          LKR {Number(grn.total_selling_amount || 0).toLocaleString()}
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div>
          <div className="font-bold text-lg text-green-700">
            LKR {Number(grn.total_profit || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">{profitMargin}% margin</div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex justify-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>GRN Details - {grn.grn_code}</DialogTitle>
                <DialogDescription>
                  Department: {grn.department?.department_name} | Date:{" "}
                  {new Date(grn.grn_date).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <GRNDetailsContent grn={grn} onAdjust={onAdjust} />
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-orange-600 border-orange-300 hover:bg-orange-50"
            onClick={() => onView(grn)}
          >
            <Edit className="w-3 h-3 mr-1" />
            Adjust
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

// GRN Details Content Component
const GRNDetailsContent = ({ grn, onAdjust }) => {
  const items = grn.items || [];

  const calculateTotals = () => {
    return items.reduce(
      (acc, item) => ({
        stock: acc.stock + (item.stock_price || 0),
        mainBranch: acc.mainBranch + (item.main_branch_price || 0),
        actual: acc.actual + (item.actual_cost || 0),
        selling: acc.selling + (item.selling_price || 0),
        subtotal: acc.subtotal + (item.subtotal || 0),
        quantity: acc.quantity + (item.qty || 0),
        discountAmount:
          acc.discountAmount +
          ((item.stock_price || 0) *
            ((item.discount1 || 0) +
              (item.discount2 || 0) +
              (item.discount3 || 0) +
              (item.discount4 || 0))) /
            100,
      }),
      {
        stock: 0,
        mainBranch: 0,
        actual: 0,
        selling: 0,
        subtotal: 0,
        quantity: 0,
        discountAmount: 0,
      }
    );
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Cost</p>
                <p className="text-xl font-bold">
                  LKR {grn.total_cost?.toLocaleString()}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Total Selling</p>
                <p className="text-xl font-bold">
                  LKR {grn.total_selling_amount?.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Total Profit</p>
                <p className="text-xl font-bold">
                  LKR {grn.total_profit?.toLocaleString()}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <div>
        

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Stock Price</TableHead>
                <TableHead className="text-right">Actual Cost</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.product_code}</div>
                      <div className="text-sm text-gray-500">
                        {item.product_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    LKR {Number(item.stock_price || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-700">
                    LKR {Number(item.actual_cost || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium text-blue-700">
                    LKR {Number(item.selling_price || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-gray-100">
                      {item.qty || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-purple-700">
                    LKR {Number(item.subtotal || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      onClick={() => onAdjust(item)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">
                  LKR {totals.stock.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-green-700">
                  LKR {totals.actual.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-blue-700">
                  LKR {totals.selling.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{totals.quantity}</Badge>
                </TableCell>
                <TableCell className="text-right text-purple-700">
                  LKR {totals.subtotal.toLocaleString()}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Discount Summary */}
      {totals.discountAmount > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 text-lg">
              Discount Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-800">
                  Total Discount Applied
                </p>
                <p className="text-sm text-red-600">
                  {((totals.discountAmount / totals.stock) * 100).toFixed(2)}%
                  off total stock value
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-red-800">
                  -LKR {totals.discountAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Quantity Adjust Modal Component
const QuantityAdjustModal = ({ grnItem, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isReturn, setIsReturn] = useState(false);
  const [returnToStock, setReturnToStock] = useState(false);

  const currentQty = grnItem?.qty || 0;
  const productCode = grnItem?.product_code;
  const actualCost = grnItem?.actual_cost || 0;

  const calculateNewQuantity = () => {
    const adjQty = parseInt(quantity) || 0;

    switch (adjustmentType) {
      case "add":
        return currentQty + adjQty;
      case "subtract":
        return currentQty - adjQty;
      case "set":
        return adjQty;
      default:
        return currentQty;
    }
  };

  const calculateNewSubtotal = () => {
    const newQty = calculateNewQuantity();
    return newQty * actualCost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!quantity || parseInt(quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (adjustmentType === "subtract" && parseInt(quantity) > currentQty) {
      toast.error("Cannot subtract more than available quantity");
      return;
    }

    const payload = {
      grn_code: grnItem.grn_code,
      product_code: productCode,
      adjustment_qty: parseInt(quantity),
      adjustment_type: adjustmentType,
      reason: reason,
      is_return: isReturn,
      return_to_stock: isReturn ? returnToStock : false,
    };

    setLoading(true);
    try {
      const res = await api.post("/grns/adjust-quantity", payload);
      toast.success(res.data.message || "Quantity adjusted successfully");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to adjust quantity");
      console.error("Adjustment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const newQty = calculateNewQuantity();
  const newSubtotal = calculateNewSubtotal();
  const changeAmount = newQty - currentQty;
  const currentSubtotal = actualCost * currentQty;
  const subtotalChange = newSubtotal - currentSubtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-[95vw] max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Adjust Quantity
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {productCode} - {grnItem?.product_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
        >
          {/* Current Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Quantity</p>
              <p className="text-2xl font-bold text-gray-800">{currentQty}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Value</p>
              <p className="text-2xl font-bold text-blue-600">
                LKR {currentSubtotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={setAdjustmentType}
              className="grid grid-cols-3 gap-2"
            >
              <div>
                <RadioGroupItem value="add" id="add" className="peer sr-only" />
                <Label
                  htmlFor="add"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-400 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer"
                >
                  <Plus className="mb-2 h-6 w-6" />
                  <span>Add</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="subtract"
                  id="subtract"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="subtract"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-400 peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 cursor-pointer"
                >
                  <Minus className="mb-2 h-6 w-6" />
                  <span>Subtract</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="set" id="set" className="peer sr-only" />
                <Label
                  htmlFor="set"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-gray-400 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
                >
                  <RefreshCw className="mb-2 h-6 w-6" />
                  <span>Set To</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {adjustmentType === "add"
                ? "Quantity to Add"
                : adjustmentType === "subtract"
                ? "Quantity to Subtract"
                : "Set Quantity To"}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="text-lg font-semibold"
              required
            />
          </div>

          {/* Return Options */}
          <div className="space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-return"
                checked={isReturn}
                onCheckedChange={(checked) => {
                  setIsReturn(checked);
                  if (!checked) setReturnToStock(false);
                }}
              />
              <Label
                htmlFor="is-return"
                className="text-yellow-800 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  This is a return/refund
                </div>
              </Label>
            </div>

            {isReturn && (
              <div className="flex items-center space-x-2 ml-6">
                <Checkbox
                  id="return-to-stock"
                  checked={returnToStock}
                  onCheckedChange={setReturnToStock}
                />
                <Label
                  htmlFor="return-to-stock"
                  className="text-gray-700 cursor-pointer"
                >
                  Return to available stock
                </Label>
              </div>
            )}
          </div>

          {/* Preview */}
          {quantity && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">Preview</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">New Quantity</p>
                  <p
                    className={`text-xl font-bold ${
                      newQty > currentQty
                        ? "text-green-600"
                        : newQty < currentQty
                        ? "text-red-600"
                        : "text-gray-800"
                    }`}
                  >
                    {newQty}
                    {changeAmount !== 0 && (
                      <span className="text-sm ml-2">
                        ({changeAmount > 0 ? "+" : ""}
                        {changeAmount})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Value</p>
                  <p
                    className={`text-xl font-bold ${
                      subtotalChange > 0
                        ? "text-green-600"
                        : subtotalChange < 0
                        ? "text-red-600"
                        : "text-gray-800"
                    }`}
                  >
                    LKR {newSubtotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for adjustment</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adjustment..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white flex justify-end gap-3 p-4 border-t border-gray-200">

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`
                ${
                  adjustmentType === "add"
                    ? "bg-green-600 hover:bg-green-700"
                    : adjustmentType === "subtract"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              `}
            >
              {loading
                ? "Processing..."
                : adjustmentType === "add"
                ? "Add Quantity"
                : adjustmentType === "subtract"
                ? "Subtract Quantity"
                : "Set Quantity"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Bulk Adjust Modal Component
const BulkAdjustModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [adjustments, setAdjustments] = useState([]);
  const [bulkReason, setBulkReason] = useState("");
  const [file, setFile] = useState(null);

  // V-17: this handler performed NO validation whatsoever - the whole check was
  // `if (!file) return;` - and then handed arbitrary bytes of arbitrary size to
  // XLSX.read(). The accept=".xlsx,.xls,.csv" attribute on the input is only a
  // file-picker hint and is bypassed by drag-and-drop or by renaming a file.
  // Now size, extension, reported MIME type and magic bytes are all checked
  // before the parser sees anything.
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const check = await validateSpreadsheetFile(file);
    if (!check.ok) {
      toast.error(check.error);
      e.target.value = ""; // let the operator retry with the same filename
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // V-17: cap the row count before mapping, so a sheet claiming a
        // million rows cannot lock up the till.
        const rowCheck = validateRowCount(jsonData);
        if (!rowCheck.ok) {
          toast.error(rowCheck.error);
          return;
        }

        const parsedAdjustments = jsonData
          .map((row, index) => ({
            grn_code: row.grn_code || row.GRN_Code || row["GRN Code"],
            product_code:
              row.product_code || row.Product_Code || row["Product Code"],
            adjustment_qty: parseInt(
              row.adjustment_qty ||
                row.Adjustment_Qty ||
                row["Adjustment Qty"] ||
                0
            ),
            adjustment_type: (
              row.adjustment_type ||
              row.Adjustment_Type ||
              row["Adjustment Type"] ||
              "add"
            ).toLowerCase(),
            reason: row.reason || row.Reason || "",
          }))
          .filter((adj) => adj.grn_code && adj.product_code);

        setAdjustments(parsedAdjustments);
        toast.success(`Loaded ${parsedAdjustments.length} adjustments`);
      } catch (error) {
        toast.error("Failed to parse Excel file");
        console.error("Excel parse error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = [
      {
        "GRN Code": "GRN001",
        "Product Code": "PROD001",
        "Adjustment Qty": 10,
        "Adjustment Type": "add",
        Reason: "Stock replenishment",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "grn_adjustment_template.xlsx");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (adjustments.length === 0) {
      toast.error("No adjustments to process");
      return;
    }

    const payload = {
      adjustments,
      bulk_reason: bulkReason,
    };

    setLoading(true);
    try {
      const res = await api.post("/grns/bulk-adjust-quantity", payload);

      const result = res.data.data;
      toast.success(
        `Bulk adjustment completed: ${result.success_count} successful, ${result.failed_count} failed`
      );

      if (result.failed_count > 0) {
        const failedWs = XLSX.utils.json_to_sheet(result.failed);
        const failedWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(failedWb, failedWs, "Failed Adjustments");
        XLSX.writeFile(failedWb, "failed_adjustments.xlsx");
      }

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Bulk adjustment failed");
      console.error("Bulk adjustment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeAdjustment = (index) => {
    setAdjustments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Bulk Quantity Adjustment
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Adjust multiple GRN items at once
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Upload Excel File</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500"
                >
                  <span>Upload a file</span>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </Label>
                <p className="text-xs text-gray-500 mt-2">
                  Excel or CSV files only
                </p>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          {adjustments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Adjustments to Process ({adjustments.length})
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustments([])}
                  className="text-red-600 border-red-300"
                >
                  Clear All
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50">
                    <TableRow>
                      <TableHead>GRN Code</TableHead>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adj, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {adj.grn_code}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {adj.product_code}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              adj.adjustment_type === "add"
                                ? "bg-green-100 text-green-800"
                                : adj.adjustment_type === "subtract"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {adj.adjustment_type}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {adj.adjustment_qty}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                          {adj.reason || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdjustment(index)}
                            className="h-8 w-8 p-0 text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Bulk Reason */}
          <div className="space-y-2">
            <Label htmlFor="bulk-reason">Bulk Adjustment Reason</Label>
            <Textarea
              id="bulk-reason"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder="Enter reason for bulk adjustment..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || adjustments.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Process {adjustments.length} Adjustment
                  {adjustments.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// GRN Details Modal Component
const GRNDetailsModal = ({ grn, onClose, onAdjust }) => {
  const [activeTab, setActiveTab] = useState("items");

  const tabs = [
    { id: "items", label: "Items", icon: Package },
    { id: "summary", label: "Summary", icon: BarChart3 },
    { id: "history", label: "History", icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-[95%] max-w-7xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                GRN Details – {grn.grn_code}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Department: {grn.department?.department_name || "N/A"} | Date:{" "}
                {new Date(grn.grn_date).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="inline w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6">
          {activeTab === "items" && (
            <GRNItemsTab grn={grn} onAdjust={onAdjust} />
          )}

          {activeTab === "summary" && <GRNSummaryTab grn={grn} />}

          {activeTab === "history" && <GRNHistoryTab grn={grn} />}
        </div>
      </div>
    </div>
  );
};

// GRN Items Tab Component
const GRNItemsTab = ({ grn, onAdjust }) => {
  const items = grn.items || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">GRN Items</h3>
          <p className="text-gray-600">Total {items.length} items</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-green-600 text-green-700 hover:bg-green-50"
          onClick={() => {
            // Print functionality
          }}
        >
          <Printer className="w-4 h-4 mr-1" />
          Print
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Product Code</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Stock Price</TableHead>
              <TableHead className="text-right">Actual Cost</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-gray-50">
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-mono">{item.product_code}</TableCell>
                <TableCell>{item.product_name}</TableCell>
                <TableCell className="text-right">
                  LKR {Number(item.stock_price || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium text-green-700">
                  LKR {Number(item.actual_cost || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-medium text-blue-700">
                  LKR {Number(item.selling_price || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="bg-gray-100">
                    {item.qty}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-purple-700">
                  LKR {Number(item.subtotal || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => onAdjust(item)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// GRN Summary Tab Component
const GRNSummaryTab = ({ grn }) => {
  const items = grn.items || [];

  const calculateTotals = () => {
    return items.reduce(
      (acc, item) => ({
        stockValue: acc.stockValue + (item.stock_price || 0) * (item.qty || 0),
        actualCost: acc.actualCost + (item.actual_cost || 0) * (item.qty || 0),
        sellingValue:
          acc.sellingValue + (item.selling_price || 0) * (item.qty || 0),
        totalQty: acc.totalQty + (item.qty || 0),
        discountAmount:
          acc.discountAmount +
          ((item.stock_price || 0) *
            (item.qty || 0) *
            ((item.discount1 || 0) +
              (item.discount2 || 0) +
              (item.discount3 || 0) +
              (item.discount4 || 0))) /
            100,
      }),
      {
        stockValue: 0,
        actualCost: 0,
        sellingValue: 0,
        totalQty: 0,
        discountAmount: 0,
      }
    );
  };

  const totals = calculateTotals();
  const profit = totals.sellingValue - totals.actualCost;
  const profitMargin =
    totals.actualCost > 0 ? (profit / totals.actualCost) * 100 : 0;
  const discountPercentage =
    totals.stockValue > 0
      ? (totals.discountAmount / totals.stockValue) * 100
      : 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Financial Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stock Value Card */}
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  LKR {totals.stockValue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Original value</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discount Card */}
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">
              Total Discount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  -LKR {totals.discountAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {discountPercentage.toFixed(2)}% off
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Minus className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actual Cost Card */}
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">
              Actual Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  LKR {totals.actualCost.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">After discounts</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selling Value Card */}
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-600">
              Selling Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  LKR {totals.sellingValue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Customer price</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Card */}
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-600">
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  LKR {profit.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {profitMargin.toFixed(2)}% margin
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Plus className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantity Card */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Total Quantity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totals.totalQty}</p>
                <p className="text-sm text-gray-500">Items total</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Cost Price</p>
                <p className="text-xl font-bold">
                  LKR {totals.actualCost.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Selling Price</p>
                <p className="text-xl font-bold">
                  LKR {totals.sellingValue.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 mb-1">Profit</p>
                <p className="text-xl font-bold">
                  LKR {profit.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-orange-500"
                style={{
                  width: "100%",
                  background: `linear-gradient(to right, 
                    #3b82f6 ${
                      (totals.actualCost / totals.sellingValue) * 100
                    }%, 
                    #10b981 ${
                      (totals.actualCost / totals.sellingValue) * 100
                    }% ${
                    ((totals.actualCost + profit) / totals.sellingValue) * 100
                  }%, 
                    #f97316 ${
                      ((totals.actualCost + profit) / totals.sellingValue) * 100
                    }%)`,
                }}
              />
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Cost:{" "}
                {((totals.actualCost / totals.sellingValue) * 100).toFixed(1)}%
              </span>
              <span>
                Profit: {((profit / totals.sellingValue) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// GRN History Tab Component
const GRNHistoryTab = ({ grn }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/grns/${grn.grn_code}/adjustment-history`);
      setHistory(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No adjustment history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Adjustment History</h3>

      <div className="space-y-3">
        {history.map((record, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    record.adjustment_type === "add"
                      ? "bg-green-100 text-green-600"
                      : record.adjustment_type === "subtract"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {record.adjustment_type === "add" ? (
                    <Plus className="w-4 h-4" />
                  ) : record.adjustment_type === "subtract" ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {record.product_code} {record.name} -{" "}
                    {record.adjustment_type}{" "}
                    {Math.abs(record.new_qty - record.original_qty)} units
                  </p>
                  <p className="text-sm text-gray-500">{record.reason}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {new Date(record.adjusted_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(record.adjusted_at).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Before</p>
                <p className="font-medium">{record.original_qty} units</p>
                <p className="text-sm text-gray-500">
                  LKR{" "}
                  {(
                    record.original_qty * (record.actual_cost || 0)
                  ).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">After</p>
                <p className="font-medium">{record.new_qty} units</p>
                <p className="text-sm text-gray-500">
                  LKR{" "}
                  {(
                    record.new_qty * (record.actual_cost || 0)
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

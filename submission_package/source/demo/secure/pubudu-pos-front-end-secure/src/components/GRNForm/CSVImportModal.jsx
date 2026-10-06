import React, { useState, useRef } from "react";
import {
  X,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  FileText,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { validateSpreadsheetFile } from "@/lib/validateUpload";

// CSV columns expected in the import file
const TEMPLATE_HEADERS = [
  "product_code",
  "qty",
  "stock_price",
  "selling_price",
  "discount1",
  "discount2",
  "discount3",
  "discount4",
];

// ── CSV parser (handles quoted fields) ───────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += line[i];
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_")
  );
  const rows = lines.slice(1).map((line) => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });

  return { headers, rows };
}

// ── Main component ────────────────────────────────────────────────────────────
export function CSVImportModal({
  isOpen,
  onClose,
  products,
  onImport,
  calculateActualCost,
}) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null); // { rows, errors, totalRows }
  const [isDragging, setIsDragging] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const fileRef = useRef();

  if (!isOpen) return null;

  // ── Export template ─────────────────────────────────────────────────────────
  const exportTemplate = () => {
    const header = TEMPLATE_HEADERS.join(",");
    const examples = [
      "P001,10,500.00,750.00,5,2,0,0",
      "P002,5,1200.00,1800.00,10,0,0,0",
      "P003,20,300.00,450.00,0,0,0,0",
    ].join("\n");
    const csv = `${header}\n${examples}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grn_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

  // ── Process uploaded file ───────────────────────────────────────────────────
  // V-17: the accept=".csv" attribute on the input and the extension test in
  // handleDrop were the only checks - neither limits size, and both are
  // bypassed by renaming a file. A CSV is read with readAsText rather than by
  // SheetJS, so the parser CVEs do not apply here, but an unbounded read still
  // locks up the till, and the parsed cell values flow into the receipt
  // template (V-13).
  const processFile = async (f) => {
    if (!f) return;

    const check = await validateSpreadsheetFile(f, { allowedExtensions: ["csv"] });
    if (!check.ok) {
      toast.error(check.error);
      return;
    }

    setFile(f);
    setParsed(null);
    setShowAllErrors(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { rows } = parseCSV(e.target.result);
        if (rows.length === 0) {
          toast.error("CSV is empty or has no data rows");
          return;
        }

        const errors = [];
        const valid = [];

        rows.forEach((row, i) => {
          const rowNum = i + 2; // 1-indexed with header row offset

          // Required: product_code
          if (!row.product_code) {
            errors.push(`Row ${rowNum}: product_code is required`);
            return;
          }

          // Check product exists
          const matchedProduct = products.find(
            (p) => p.product_code === row.product_code.toString().trim()
          );
          if (!matchedProduct) {
            errors.push(
              `Row ${rowNum}: product_code "${row.product_code}" not found in system`
            );
            return;
          }

          // Required: stock_price
          if (!row.stock_price || isNaN(parseFloat(row.stock_price))) {
            errors.push(`Row ${rowNum}: stock_price must be a valid number`);
            return;
          }

          // Required: selling_price
          if (!row.selling_price || isNaN(parseFloat(row.selling_price))) {
            errors.push(`Row ${rowNum}: selling_price must be a valid number`);
            return;
          }

          const sp = parseFloat(row.stock_price) || 0;
          const d1 = parseFloat(row.discount1) || 0;
          const d2 = parseFloat(row.discount2) || 0;
          const d3 = parseFloat(row.discount3) || 0;
          const d4 = parseFloat(row.discount4) || 0;
          const actualCost = calculateActualCost(sp, d1, d2, d3, d4);

          valid.push({
            product_code: matchedProduct.product_code,
            product_name: matchedProduct.product_name,
            product_description: matchedProduct.description || "",
            qty: parseInt(row.qty) >= 0 ? parseInt(row.qty) : 1,
            stock_price: sp.toString(),
            selling_price: (parseFloat(row.selling_price) || 0).toString(),
            main_branch_price: actualCost.toFixed(2),
            discount1: d1.toString(),
            discount2: d2.toString(),
            discount3: d3.toString(),
            discount4: d4.toString(),
            actual_cost: actualCost.toFixed(2),
          });
        });

        setParsed({ rows: valid, errors, totalRows: rows.length });
      } catch (err) {
        toast.error("Failed to parse CSV: " + err.message);
      }
    };
    reader.readAsText(f);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.toLowerCase().endsWith(".csv")) {
      processFile(f);
    } else {
      toast.error("Please drop a .csv file");
    }
  };

  const handleConfirm = () => {
    if (!parsed?.rows?.length) return;
    onImport(parsed.rows);
    onClose();
    toast.success(`${parsed.rows.length} item(s) added to GRN`);
    setFile(null);
    setParsed(null);
  };

  const handleClose = () => {
    setFile(null);
    setParsed(null);
    setShowAllErrors(false);
    onClose();
  };

  const visibleErrors = showAllErrors
    ? parsed?.errors
    : parsed?.errors?.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0A6ED1]" />
            <h2 className="text-base font-semibold text-[#0A294F]">
              Bulk CSV Import
            </h2>
            {parsed?.rows?.length > 0 && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                {parsed.rows.length} ready
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ── Template download ── */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#0A294F]">
                Step 1 — Download Template
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Columns:{" "}
                <code className="bg-white px-1 py-0.5 rounded text-gray-700 text-[10px]">
                  {TEMPLATE_HEADERS.join(", ")}
                </code>
              </p>
            </div>
            <button
              onClick={exportTemplate}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0A6ED1] text-white text-xs font-medium rounded-lg hover:bg-[#085AA5] whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
          </div>

          {/* ── Drop zone ── */}
          <div>
            <p className="text-sm font-medium text-[#0A294F] mb-2">
              Step 2 — Upload filled CSV
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-[#0A6ED1] bg-blue-50"
                  : file
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-[#0A6ED1] hover:bg-gray-50"
              }`}
            >
              <Upload
                className={`w-8 h-8 mx-auto mb-2 ${
                  file ? "text-green-500" : "text-gray-400"
                }`}
              />
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name : "Drop CSV here or click to browse"}
              </p>
              <p className="text-xs text-gray-400 mt-1">Only .csv files</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* ── Errors ── */}
          {parsed?.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {parsed.errors.length} row(s) skipped due to errors
              </p>
              <div className="space-y-0.5 mt-1">
                {visibleErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">
                    {err}
                  </p>
                ))}
              </div>
              {parsed.errors.length > 5 && (
                <button
                  onClick={() => setShowAllErrors((v) => !v)}
                  className="text-xs text-red-500 flex items-center gap-1 mt-1 hover:underline"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showAllErrors ? "rotate-180" : ""}`}
                  />
                  {showAllErrors
                    ? "Show less"
                    : `Show ${parsed.errors.length - 5} more`}
                </button>
              )}
            </div>
          )}

          {/* ── Success summary ── */}
          {parsed && (
            <div
              className={`border rounded-lg px-4 py-3 flex items-center gap-2 ${
                parsed.rows.length > 0
                  ? "bg-green-50 border-green-200"
                  : "bg-yellow-50 border-yellow-200"
              }`}
            >
              <CheckCircle
                className={`w-4 h-4 flex-shrink-0 ${
                  parsed.rows.length > 0 ? "text-green-600" : "text-yellow-500"
                }`}
              />
              <p
                className={`text-sm ${
                  parsed.rows.length > 0 ? "text-green-800" : "text-yellow-800"
                }`}
              >
                {parsed.rows.length > 0 ? (
                  <>
                    <span className="font-semibold">{parsed.rows.length}</span>{" "}
                    valid row(s) ready to import
                    {parsed.errors.length > 0 &&
                      ` · ${parsed.errors.length} skipped`}
                    {parsed.rows.length > 100 && (
                      <span className="ml-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Will be saved in{" "}
                        {Math.ceil(parsed.rows.length / 100)} batch(es) of 100
                      </span>
                    )}
                  </>
                ) : (
                  "No valid rows found — check errors above"
                )}
              </p>
            </div>
          )}

          {/* ── Preview table ── */}
          {parsed?.rows?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Preview (first 10 rows)
              </p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        "#",
                        "Product Code",
                        "Product Name",
                        "Qty",
                        "Stock Price",
                        "Selling Price",
                        "Discount1",
                        "Actual Cost",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.rows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-1.5 font-medium text-gray-800">
                          {r.product_code}
                        </td>
                        <td className="px-3 py-1.5 text-gray-600 max-w-[120px] truncate">
                          {r.product_name}
                        </td>
                        <td className="px-3 py-1.5">{r.qty}</td>
                        <td className="px-3 py-1.5">{r.stock_price}</td>
                        <td className="px-3 py-1.5">{r.selling_price}</td>
                        <td className="px-3 py-1.5">
                          {r.discount1 || "0"}
                        </td>
                        <td className="px-3 py-1.5 text-green-700 font-medium">
                          {r.actual_cost}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > 10 && (
                  <p className="text-xs text-gray-400 text-center py-2 border-t">
                    ...and {parsed.rows.length - 10} more row(s)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {parsed?.rows?.length > 100
              ? `Large import: saved in batches of 100 to prevent data loss`
              : "Items will be added to the current GRN form"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!parsed?.rows?.length}
              className="px-4 py-2 text-sm bg-[#0A6ED1] text-white font-medium rounded-lg hover:bg-[#085AA5] disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Import{parsed?.rows?.length ? ` (${parsed.rows.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

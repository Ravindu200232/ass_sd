import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileSpreadsheet } from 'lucide-react';

/* -----------------------------------------------------------
   📦 Enhanced Import Dialog — Mobile Friendly + SAP Quartz
----------------------------------------------------------- */

export function ImportDialog({
  isOpen,
  onOpenChange,
  importData,
  importMapping,
  onUpdateMapping,
  importProgress,
  isImporting,
  onExecuteImport,
}) {
  const processedData = processImportData(importData, importMapping);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-4xl w-full
          max-h-[85vh]
          overflow-hidden
          flex flex-col
          rounded-xl
          border border-indigo-200
          bg-white/90
          backdrop-blur-xl
          shadow-xl
          p-0
        "
      >
        <DialogHeader className="p-4 border-b bg-indigo-50/40 rounded-t-xl">
          <DialogTitle className="flex items-center gap-2 text-indigo-900">
            <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            Import Products from Excel
          </DialogTitle>
        </DialogHeader>

        {/* Scroll Section */}
        <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
          <ColumnMapping
            importMapping={importMapping}
            onUpdateMapping={onUpdateMapping}
          />

          <DataPreview importData={importData} importMapping={importMapping} />

          {isImporting && <ImportProgress progress={importProgress} />}
        </div>

        {/* Footer */}
        <div
          className="
            sticky bottom-0
            bg-white/80 backdrop-blur-md
            border-t
            px-4 py-3
            flex justify-end gap-2
          "
        >
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={onExecuteImport} disabled={isImporting}>
            {isImporting
              ? 'Importing...'
              : `Import ${processedData.length} Products`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -----------------------------------------------------------
   🧩 Column Mapping — Mobile Friendly Grid
----------------------------------------------------------- */

function ColumnMapping({ importMapping, onUpdateMapping }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-indigo-900">
        Map Excel Columns to Product Fields
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.keys(importMapping).map((excelColumn) => (
          <div key={excelColumn} className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Excel Column: <span className="font-semibold">"{excelColumn}"</span>
            </Label>

            <Select
              value={importMapping[excelColumn] || ''}
              onValueChange={(value) => onUpdateMapping(excelColumn, value)}
            >
              <SelectTrigger className="rounded-lg border-gray-200">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="product_name">Product Name</SelectItem>
                <SelectItem value="product_code">Product Code (Optional)</SelectItem>
                <SelectItem value="brand_name">Brand</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="weight">Weight</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   👀 Data Preview — Responsive Table
----------------------------------------------------------- */

function DataPreview({ importData, importMapping }) {
  // Process data for preview
  const previewData = importData.slice(0, 5).map((row) => {
    const processedRow = {};
    
    Object.keys(importMapping).forEach((excelColumn) => {
      const mappedField = importMapping[excelColumn];
      
      // Get the value from the row based on the mapping
      if (mappedField && row[mappedField] !== undefined) {
        // First try to get from mapped field (this is the correct way)
        processedRow[excelColumn] = row[mappedField];
      } else if (row[excelColumn] !== undefined) {
        // Fallback to original column
        processedRow[excelColumn] = row[excelColumn];
      } else {
        processedRow[excelColumn] = '-';
      }
    });
    
    return processedRow;
  });

  return (
    <div>
      <h3 className="font-semibold text-indigo-900 mb-2">
        Preview (First 5 Rows)
      </h3>

      <div className="border rounded-md overflow-auto max-h-60 bg-white shadow-inner">
        <Table>
          <TableHeader>
            <TableRow>
              {Object.keys(importMapping).map((col) => (
                <TableHead key={col} className="whitespace-nowrap">
                  {importMapping[col]
                    ? `${col} → ${importMapping[col]}`
                    : col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {previewData.map((row, index) => (
              <TableRow key={index}>
                {Object.keys(importMapping).map((col) => (
                  <TableCell key={col} className="max-w-xs truncate">
                    {row[col] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   🚚 Import Progress Bar
----------------------------------------------------------- */

function ImportProgress({ progress }) {
  return (
    <div className="space-y-2">
      <Label className="text-slate-700">
        Importing... {progress.current} of {progress.total}
      </Label>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${(progress.current / progress.total) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

/* -----------------------------------------------------------
   🔄 Data Processor - FIXED VERSION
----------------------------------------------------------- */

function processImportData(importData, importMapping) {
  if (!Array.isArray(importData)) return [];

  return importData
    .map((item) => {
      if (!item) return {};

      const processed = {};

      Object.keys(importMapping).forEach((excelColumn) => {
        const mappedField = importMapping[excelColumn];
        
        if (mappedField) {
          // Get value based on the mapping
          // Try in this order:
          // 1. Direct value from mapped field key
          // 2. Value from original column name
          const value = item[mappedField] ?? item[excelColumn];
          
          if (value !== undefined && value !== null && value !== '') {
            processed[mappedField] = value;
          }
        }
      });

      return processed;
    })
    .filter((item) => item.product_name); // Only product_name is required now
}
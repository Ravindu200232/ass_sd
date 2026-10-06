import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCcw } from 'lucide-react';

export function PageHeader({ onDownloadPDF, onRefreshData, hasData }) {
  return (
    <div
      className="
        w-full 
        bg-gradient-to-r from-white via-[#F7FAFF] to-[#E5F0FF]
        border border-[#D5E3F4]
        rounded-xl 
        shadow-sm 
        p-5 
        flex flex-col md:flex-row 
        items-start md:items-center 
        justify-between 
        gap-4
      "
    >
      {/* LEFT SECTION */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0A294F]">
          Profit Report
        </h1>
        <p className="text-[#5A6B7A] text-sm">
          Comprehensive profit analysis combining sales (Invoices) & costs (GRNs)
        </p>

        {/* SAP Accent Bar */}
        <div className="h-1 w-20 bg-[#0A6ED1] rounded-full mt-2"></div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-3">
        {hasData && (
          <Button
            onClick={onDownloadPDF}
            className="
              bg-[#0A6ED1] 
              hover:bg-[#085AA5]
              text-white
              shadow-sm 
              hover:shadow-md
              transition-all 
              flex items-center gap-2
            "
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}

        <Button
          onClick={onRefreshData}
          variant="outline"
          className="
            border-[#0A6ED1]/40
            text-[#0A6ED1]
            hover:bg-[#E5F1FF]
            flex items-center gap-2
          "
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

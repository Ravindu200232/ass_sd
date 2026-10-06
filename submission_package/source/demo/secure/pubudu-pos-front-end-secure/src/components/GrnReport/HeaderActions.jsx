import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft } from 'lucide-react';

export function HeaderActions({ onBack, onDownload }) {
  return (
    <div className="flex justify-between items-center mb-6 no-print">
      <div>
        <h1 className="text-2xl font-bold">GRN Report</h1>
        <p className="text-gray-600">Goods Received Note</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
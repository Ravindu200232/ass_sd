import React from 'react';
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';

export function GRNTableHeader() {
  return (
    <TableHeader>
      <TableRow className="bg-gray-50">
        <tableHead className="w-[120px]">Item Code</tableHead>
        <TableHead className="w-[280px]">Product</TableHead>
        <TableHead className="w-[90px]">Stock Price</TableHead>
        <TableHead className="w-[100px]">Main Branch</TableHead>
        <TableHead className="w-[100px]">Selling Price</TableHead>
        <TableHead className="w-[60px]">D1%</TableHead>
        <TableHead className="w-[60px]">D2%</TableHead>
        <TableHead className="w-[60px]">D3%</TableHead>
        <TableHead className="w-[60px]">D4%</TableHead>
        <TableHead className="w-[100px] text-blue-600">Actual Cost</TableHead>
        <TableHead className="w-[70px]">Qty</TableHead>
        <TableHead className="w-[100px]">Total</TableHead>
        <TableHead className="w-[60px]">Action</TableHead>
      </TableRow>
    </TableHeader>
  );
}
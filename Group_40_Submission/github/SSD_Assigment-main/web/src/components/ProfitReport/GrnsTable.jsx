import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';

export function GrnsTable({ grns, getDepartmentName }) {
  if (grns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold">No GRNs found</h3>
        <p>No GRNs match your search criteria</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>GRN Code</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total Cost</TableHead>
          <TableHead>Total Selling</TableHead>
          <TableHead>Profit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {grns.map((grn) => (
          <TableRow key={grn.id}>
            <TableCell className="font-medium">{grn.grn_code}</TableCell>
            <TableCell>{new Date(grn.grn_date).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge variant="outline">{getDepartmentName(grn.department_id)}</Badge>
            </TableCell>
            <TableCell>{grn.total_item}</TableCell>
            <TableCell>LKR {grn.total_cost?.toLocaleString()}</TableCell>
            <TableCell>LKR {grn.total_selling_amount?.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={grn.total_profit > 0 ? 'default' : 'destructive'}>
                LKR {grn.total_profit?.toLocaleString()}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
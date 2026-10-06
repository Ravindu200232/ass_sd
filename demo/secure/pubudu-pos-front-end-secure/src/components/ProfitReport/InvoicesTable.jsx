import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

export function InvoicesTable({ invoices, getTypeBadge, getDepartmentName, getStatusBadge }) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold">No invoices found</h3>
        <p>No invoices match your search criteria</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice No</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Net Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.inv_no}</TableCell>
            <TableCell>{new Date(invoice.inv_date).toLocaleDateString()}</TableCell>
            <TableCell>
              {invoice.customer?.customer_name || (invoice.customer_code === 'CASH' ? 'Cash Sale' : invoice.customer_code)}
            </TableCell>
            <TableCell>{getTypeBadge(invoice.type)}</TableCell>
            <TableCell>
              <Badge variant="outline">{getDepartmentName(invoice.department_id)}</Badge>
            </TableCell>
            <TableCell>LKR {invoice.net_total?.toLocaleString()}</TableCell>
            <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Printer, DollarSign, CreditCard, FileText, XCircle } from 'lucide-react';

export const InvoiceTable = ({
  invoices,
  onViewDetails,
  onPrintReceipt,
  onCancelInvoice,
  isAdmin,
  getTypeBadge,
  getServiceDisplay,
  getPaymentBreakdown,
  getStatusBadge,
}) => {
  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>No invoices found with current filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No invoices found</h3>
            <p>No invoices match your search criteria</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>{invoices.length} invoices found with current filters</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Net Total</TableHead>
              <TableHead>Cash Paid</TableHead>
              <TableHead>Credit Paid</TableHead>
              <TableHead>Total Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const paymentBreakdown = getPaymentBreakdown(invoice);
              const serviceDisplay = getServiceDisplay(invoice);

              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.inv_no}</TableCell>
                  <TableCell>{new Date(invoice.inv_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {invoice.customer?.customer_name ||
                      (invoice.customer_code ? `Customer ${invoice.customer_code}` : "Cash Sale")}
                  </TableCell>
                  <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={serviceDisplay}>
                      {serviceDisplay}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      title={invoice.department?.department_address || ""}
                    >
                      {invoice.department?.department_name || "Unknown Department"}
                    </Badge>
                  </TableCell>
                  <TableCell>LKR {paymentBreakdown.netTotal.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      LKR {paymentBreakdown.cashPaid.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-blue-600" />
                      LKR {paymentBreakdown.creditPaid.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>LKR {paymentBreakdown.totalPaid.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(invoice.inv_no)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintReceipt(invoice)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {isAdmin && invoice.type !== "cancel" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancelInvoice(invoice)}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500"
                          title="Cancel Invoice"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.type === "cancel" && (
                        <span className="text-xs font-bold text-red-600 border border-red-300 rounded px-1.5 py-0.5 bg-red-50">
                          CANCELLED
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
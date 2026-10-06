import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Receipt, RefreshCw, FileText, CheckCircle2, Clock } from "lucide-react";

export function CreditInvoicesTab({ invoices, onRefresh, isLoading = false }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              Credit Invoices
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Invoices with credit allocations and payment progress
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <InvoiceList invoices={invoices} />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
      <p className="text-sm sm:text-base">No credit invoices found</p>
    </div>
  );
}

function InvoiceList({ invoices }) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {invoices.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
}

function InvoiceCard({ invoice }) {
  const creditAllocated = invoice.credit_allocated || 0;
  const creditPaid = invoice.credit_paid || 0;
  const paidPercentage = creditAllocated > 0 ? (creditPaid / creditAllocated) * 100 : 0;
  const remainingAmount = Math.max(0, creditAllocated - creditPaid);
  const invoiceDate = invoice.invoice_date || invoice.created_at;

  return (
    <div className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* INVOICE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-1">
            <span className="font-semibold text-sm sm:text-base truncate">
              {invoice.invoice_number}
            </span>
            <div className="flex-shrink-0">
              <InvoiceStatusBadge invoice={invoice} />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(invoiceDate).toLocaleDateString()}
          </div>
        </div>

        {/* INVOICE AMOUNTS */}
        <InvoiceAmounts
          invoice={invoice}
          creditAllocated={creditAllocated}
          creditPaid={creditPaid}
          remainingAmount={remainingAmount}
        />
      </div>

      {/* PROGRESS BAR */}
      {creditAllocated > 0 && (
        <ProgressSection paidPercentage={paidPercentage} />
      )}

      {/* STATUS MESSAGES */}
      <StatusMessages
        remainingAmount={remainingAmount}
        creditAllocated={creditAllocated}
      />
    </div>
  );
}

function InvoiceAmounts({ invoice, creditAllocated, creditPaid, remainingAmount }) {
  return (
    <div className="w-full sm:w-auto text-right">
      <div className="font-medium text-gray-900 text-sm sm:text-base">
        LKR {invoice.total_amount?.toLocaleString()}
      </div>
      {creditAllocated > 0 ? (
        <div className="text-xs text-gray-500 space-y-1 mt-1">
          <div className="flex justify-between sm:block">
            <span className="text-purple-600 sm:hidden">Credit:</span>
            <span className="text-purple-600">
              LKR {creditAllocated?.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between sm:block">
            <span className="text-green-600 sm:hidden">Paid:</span>
            <span className="text-green-600">
              LKR {creditPaid?.toLocaleString()}
            </span>
          </div>
          {remainingAmount > 0 && (
            <div className="flex justify-between sm:block">
              <span className="text-orange-600 sm:hidden">Due:</span>
              <span className="text-orange-600">
                LKR {remainingAmount?.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500">Full Amount</div>
      )}
    </div>
  );
}

function ProgressSection({ paidPercentage }) {
  return (
    <>
      <Progress value={paidPercentage} className="h-1.5 sm:h-2 mb-2" />
      <div className="flex justify-between text-xs text-gray-600">
        <span>Credit Payment Progress</span>
        <span>{paidPercentage.toFixed(1)}%</span>
      </div>
    </>
  );
}

function StatusMessages({ remainingAmount, creditAllocated }) {
  if (remainingAmount > 0) {
    return (
      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
        <span className="font-medium">Remaining Credit Balance:</span>{" "}
        LKR {remainingAmount?.toLocaleString()}
      </div>
    );
  }

  if (creditAllocated <= 0) {
    return (
      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
        <span className="font-medium">No Credit Allocation</span>
        <div className="text-gray-600">
          This invoice doesn't have credit allocated
        </div>
      </div>
    );
  }

  return null;
}

function InvoiceStatusBadge({ invoice }) {
  const creditAllocated = invoice.credit_allocated || 0;
  const creditPaid = invoice.credit_paid || 0;

  if (creditAllocated <= 0) {
    return <Badge variant="outline">No Credit</Badge>;
  }

  if (creditPaid >= creditAllocated) {
    return (
      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" /> Paid
      </Badge>
    );
  } else if (creditPaid > 0) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Partial
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" /> Unpaid
      </Badge>
    );
  }
}
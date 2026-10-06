import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

export function InvoiceStatusBadge({ invoice }) {
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
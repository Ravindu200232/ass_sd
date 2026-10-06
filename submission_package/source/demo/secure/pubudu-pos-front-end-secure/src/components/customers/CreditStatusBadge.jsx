import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export function CreditStatusBadge({ customer }) {
  if (!customer.credit_enabled) {
    return <Badge variant="outline">No Credit</Badge>;
  }

  const utilization =
    customer.credit_limit > 0
      ? (customer.credit_balance / customer.credit_limit) * 100
      : 0;

  if (utilization >= 90) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> High Usage
      </Badge>
    );
  } else if (utilization >= 70) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Medium Usage
      </Badge>
    );
  } else {
    return <Badge className="bg-green-100 text-green-800">Good</Badge>;
  }
}

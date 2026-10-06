import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { CreditStatusBadge } from "./CreditStatusBadge";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function CustomerTable({
  customers,
  departments, // kept for compatibility (not used now)
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}) {
  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No customers found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-blue-50">
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Credit Status</TableHead>
          <TableHead>Outstanding Balance</TableHead>
          <TableHead>Credit Limit</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {customers.map((customer) => (
          <CustomerTableRow
            key={customer.id}
            customer={customer}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function CustomerTableRow({ customer, onView, onEdit, onDelete, isLoading }) {
  const creditStatus = getCreditStatus(customer);

  // ✅ NEW: backend returns customer.department (from with('department'))
  const departmentName = customer?.department?.department_name || "-";

  return (
    <TableRow className="hover:bg-blue-50/50">
      <TableCell>
        <Badge className="bg-blue-700 text-white">
          {customer.customer_code}
        </Badge>
      </TableCell>

      <TableCell className="font-medium">{customer.customer_name}</TableCell>

      <TableCell>{departmentName}</TableCell>

      <TableCell>
        <CreditStatusBadge customer={customer} />
      </TableCell>

      <TableCell className={creditStatus.color}>
        LKR {Number(customer.credit_balance || 0).toLocaleString()}
      </TableCell>

      <TableCell>
        {customer.credit_enabled
          ? `LKR ${Number(customer.credit_limit || 0).toLocaleString()}`
          : "-"}
      </TableCell>

      <TableCell>{customer.phone_no_01}</TableCell>

      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(customer)}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(customer)}
            disabled={isLoading}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-red-50 border-red-200"
                disabled={isLoading}
                title="Delete customer"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Customer:{" "}
                  <span className="font-semibold">
                    {customer.customer_name} ({customer.customer_code})
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => onDelete(customer.id)}
                  disabled={isLoading}
                >
                  Yes, Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function getCreditStatus(customer) {
  if (!customer.credit_enabled) return { color: "text-gray-600" };

  const limit = Number(customer.credit_limit || 0);
  const bal = Number(customer.credit_balance || 0);
  const utilization = limit > 0 ? (bal / limit) * 100 : 0;

  if (utilization >= 90) return { color: "text-red-600" };
  if (utilization >= 70) return { color: "text-orange-600" };
  return { color: "text-green-600" };
}

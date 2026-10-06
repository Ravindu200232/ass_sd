import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { History, TrendingDown, Clock, Settings, RefreshCw } from "lucide-react";

export function PaymentHistoryTab({ payments, onRefresh, isLoading = false }) {
  const creditPayments = payments.filter(
    (payment) =>
      payment.payment_type === "credit_payment" ||
      payment.type === "payment" ||
      (!payment.invoice_id && payment.amount > 0)
  );

  const partialPayments = payments.filter(
    (payment) =>
      payment.invoice_id &&
      payment.credit_paid < payment.credit_allocated &&
      payment.credit_paid > 0
  );

  const adjustments = payments.filter(
    (payment) =>
      payment.payment_type === "adjustment" ||
      payment.adjustment_type
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <History className="h-4 w-4 sm:h-5 sm:w-5" />
          Payment History & Paid Invoices
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Complete history of paid invoices and credit transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <EmptyState onRefresh={onRefresh} isLoading={isLoading} />
        ) : (
          <div className="space-y-4">
            {/* CREDIT PAYMENTS SECTION */}
            <PaymentSection
              title="Credit Balance Payments"
              icon={<TrendingDown className="h-4 w-4 text-blue-600" />}
              items={creditPayments}
              badgeVariant="blue"
              renderItem={(payment) => (
                <CreditPaymentCard key={payment.id} payment={payment} />
              )}
            />

            {/* PARTIAL PAYMENTS & ADJUSTMENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PaymentSection
                title="Partial Payments"
                icon={<Clock className="h-4 w-4 text-orange-500" />}
                items={partialPayments}
                badgeVariant="orange"
                renderItem={(payment) => (
                  <PartialPaymentCard key={payment.id} payment={payment} />
                )}
              />

              <PaymentSection
                title="Adjustments"
                icon={<Settings className="h-4 w-4 text-purple-500" />}
                items={adjustments}
                badgeVariant="purple"
                renderItem={(payment) => (
                  <AdjustmentCard key={payment.id} payment={payment} />
                )}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ onRefresh, isLoading }) {
  return (
    <div className="text-center py-8 text-gray-500">
      <History className="h-12 w-12 mx-auto text-gray-300 mb-3" />
      <p className="text-sm sm:text-base">No payment history found</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="mt-2"
        disabled={isLoading}
      >
        <RefreshCw className="h-3 w-3 mr-2" />
        Retry Loading
      </Button>
    </div>
  );
}

function PaymentSection({ title, icon, items, badgeVariant, renderItem }) {
  const badgeColors = {
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 text-sm sm:text-base flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <Badge variant="outline" className={badgeColors[badgeVariant]}>
          {items.length} {items.length === 1 ? "Payment" : "Payments"}
        </Badge>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.map(renderItem)}
      </div>
    </div>
  );
}

function CreditPaymentCard({ payment }) {
  const paymentDate = payment.payment_date || payment.transaction_date || payment.created_at;
  const reference = payment.reference || `PMT-${payment.id}`;

  return (
    <div className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-blue-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-1">
            <Badge className="bg-blue-100 text-blue-800 text-xs w-fit">
              <TrendingDown className="h-3 w-3 mr-1" />
              CREDIT PAYMENT
            </Badge>
            <span className="font-mono text-xs sm:text-sm truncate">
              {reference}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(paymentDate).toLocaleDateString()}
          </div>
        </div>

        <div className="w-full sm:w-auto text-right">
          <div className="text-base sm:text-lg font-bold text-green-600">
            - LKR {payment.amount?.toLocaleString()}
          </div>
          {payment.new_balance !== undefined && (
            <div className="text-xs text-gray-500">
              Balance: LKR {payment.new_balance?.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {payment.notes && (
        <div className="mt-2 p-2 bg-white rounded text-xs border">
          <div className="text-gray-600">{payment.notes}</div>
        </div>
      )}
    </div>
  );
}

function PartialPaymentCard({ payment }) {
  const paidPercentage = payment.credit_allocated > 0
    ? (payment.credit_paid / payment.credit_allocated) * 100
    : 0;

  return (
    <div className="border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-orange-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-orange-100 text-orange-800 text-xs">
              PARTIAL
            </Badge>
            <span className="font-mono text-xs truncate">
              {payment.invoice_number || `INV-${payment.invoice_id}`}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Paid: LKR {payment.credit_paid?.toLocaleString()} / LKR{" "}
            {payment.credit_allocated?.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(paidPercentage)}%</span>
        </div>
        <Progress value={paidPercentage} className="h-2" />
      </div>
    </div>
  );
}

function AdjustmentCard({ payment }) {
  return (
    <div className="border border-purple-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-purple-50">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-purple-100 text-purple-800 text-xs">
              {payment.adjustment_type?.toUpperCase() || "ADJUSTMENT"}
            </Badge>
          </div>
          <div className="text-xs text-gray-600">
            {payment.reason || "Credit adjustment"}
          </div>
        </div>
        <div
          className={`text-sm font-bold ${
            payment.adjustment_type === "increase"
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {payment.adjustment_type === "increase" ? "+" : "-"} LKR{" "}
          {payment.amount?.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SummaryCards({ ledger }) {
  // Calculate totals excluding opening balance
  const transactionRows = ledger.filter(row => !row.isOpening);
  
  const totals = {
    totalStockIn: transactionRows.reduce((sum, row) => sum + (row.debit_qty || 0), 0),
    totalStockInValue: transactionRows.reduce((sum, row) => sum + (row.debit_amount || 0), 0),
    totalSales: transactionRows.reduce((sum, row) => sum + (row.credit_qty || 0), 0),
    totalSalesValue: transactionRows.reduce((sum, row) => sum + (row.credit_amount || 0), 0),
  };

  // Get final balance
  const finalBalance = ledger.length > 0 ? ledger[ledger.length - 1] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Stock In"
        primaryValue={totals.totalStockIn.toLocaleString()}
        secondaryValue={`Rs. ${totals.totalStockInValue.toLocaleString()}`}
        color="green"
      />
      <SummaryCard
        title="Total Sales"
        primaryValue={totals.totalSales.toLocaleString()}
        secondaryValue={`Rs. ${totals.totalSalesValue.toLocaleString()}`}
        color="red"
      />
      <SummaryCard
        title="Current Stock"
        primaryValue={finalBalance?.balance_qty?.toLocaleString() || "0"}
        color="blue"
      />
      <SummaryCard
        title="Stock Value"
        primaryValue={`Rs. ${finalBalance?.balance_amount?.toLocaleString() || "0"}`}
        color="purple"
      />
    </div>
  );
}

function SummaryCard({ title, primaryValue, secondaryValue, color }) {
  const colorClasses = {
    green: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-800",
      accent: "text-green-600",
    },
    red: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      accent: "text-red-600",
    },
    blue: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      accent: "text-blue-600",
    },
    purple: {
      bg: "bg-purple-50 border-purple-200",
      text: "text-purple-800",
      accent: "text-purple-600",
    },
  };

  const styles = colorClasses[color] || colorClasses.blue;

  return (
    <Card className={`${styles.bg} border ${styles.bg.split(' ')[1]} shadow-sm`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-semibold ${styles.text}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${styles.accent}`}>
          {primaryValue}
        </div>
        {secondaryValue && (
          <div className={`mt-1 text-sm font-medium ${styles.text}`}>
            {secondaryValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
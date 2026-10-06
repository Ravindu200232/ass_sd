import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, TrendingDown, Settings } from "lucide-react";

export function CreditOverviewTab({ customer, onPayCredit, onAdjustCredit }) {
  const creditUsedPercentage = customer?.credit_limit > 0
    ? (customer.credit_balance / customer.credit_limit) * 100
    : 0;
  
  const availableCredit = Math.max(0, (customer?.credit_limit || 0) - (customer?.credit_balance || 0));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
          Credit Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CREDIT STATUS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credit Limits Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">
              Credit Limits & Balances
            </h3>

            <div className="space-y-3">
              {/* Credit Limit */}
              <CreditItem
                label="Credit Limit"
                value={`LKR ${customer?.credit_limit?.toLocaleString() || "0"}`}
                color="blue"
              />

              {/* Outstanding Balance */}
              <CreditItem
                label="Outstanding Balance"
                value={`LKR ${customer?.credit_balance?.toLocaleString() || "0"}`}
                color="orange"
              />

              {/* Available Credit */}
              <CreditItem
                label="Available Credit"
                value={`LKR ${availableCredit.toLocaleString()}`}
                color="green"
              />
            </div>
          </div>

          {/* Credit Utilization Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">
              Credit Utilization
            </h3>

            <div className="space-y-3">
              {/* Credit Used Percentage */}
              <CreditItem
                label="Credit Used"
                value={customer?.credit_limit > 0 ? `${Math.round(creditUsedPercentage)}%` : "0%"}
                color="purple"
              />

              {/* Status Indicator */}
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Utilization Status
                  </span>
                  <UtilizationStatusBadge percentage={creditUsedPercentage} />
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(creditUsedPercentage)}`}
                    style={{ width: `${Math.min(100, creditUsedPercentage)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CREDIT SETTINGS ROW */}
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-3">
            Credit Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
              <span className="font-medium text-gray-700">
                Credit Enabled
              </span>
              <Badge
                variant={customer?.credit_enabled ? "default" : "outline"}
                className={customer?.credit_enabled ? "bg-green-100 text-green-800" : ""}
              >
                {customer?.credit_enabled ? "Yes" : "No"}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
              <span className="font-medium text-gray-700">
                Account Status
              </span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        {customer?.credit_enabled && (
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button
              onClick={onPayCredit}
              className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
              disabled={customer.credit_balance <= 0}
              size="sm"
            >
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Pay Credit Balance
            </Button>
            <Button
              onClick={onAdjustCredit}
              variant="outline"
              className="border-yellow-400 text-yellow-600 hover:bg-yellow-50 text-sm sm:text-base"
              size="sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Adjust Credit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreditItem({ label, value, color }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    orange: "bg-orange-50 border-orange-100 text-orange-700",
    green: "bg-green-50 border-green-100 text-green-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
  };

  return (
    <div className={`flex justify-between items-center p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-6 ${getColorDotClass(color)} rounded`}></div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">{value}</div>
      </div>
    </div>
  );
}

function getColorDotClass(color) {
  switch (color) {
    case "blue": return "bg-blue-500";
    case "orange": return "bg-orange-500";
    case "green": return "bg-green-500";
    case "purple": return "bg-purple-500";
    default: return "bg-gray-500";
  }
}

function UtilizationStatusBadge({ percentage }) {
  let status = "No Credit";
  let color = "text-gray-600";

  if (percentage > 0) {
    if (percentage >= 90) {
      status = "High Risk";
      color = "text-red-600";
    } else if (percentage >= 70) {
      status = "Medium Risk";
      color = "text-orange-600";
    } else {
      status = "Good Standing";
      color = "text-green-600";
    }
  }

  return <span className={`text-sm font-semibold ${color}`}>{status}</span>;
}

function getProgressBarColor(percentage) {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 70) return "bg-orange-500";
  if (percentage > 0) return "bg-green-500";
  return "bg-gray-400";
}
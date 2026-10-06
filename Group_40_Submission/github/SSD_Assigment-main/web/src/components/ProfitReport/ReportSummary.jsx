import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export function ReportSummary({ profitData, fromDate, toDate }) {
  if (!profitData) return null;

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Profit Report Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-blue-700">
              <div>
                <div className="font-semibold">Date Range:</div>
                <div>{new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="font-semibold">Total Transactions:</div>
                <div>{profitData.summary.total_invoices} invoices + {profitData.summary.total_grns} GRNs</div>
              </div>
              <div>
                <div className="font-semibold">Average Invoice Value:</div>
                <div>LKR {profitData.summary.avg_invoice.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-semibold">Report Generated:</div>
                <div>{new Date().toLocaleString()}</div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              Profit calculation: Revenue (Invoices) - Cost (GRNs) = {profitData.summary.total_profit >= 0 ? 'Profit' : 'Loss'} of LKR {Math.abs(profitData.summary.total_profit).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
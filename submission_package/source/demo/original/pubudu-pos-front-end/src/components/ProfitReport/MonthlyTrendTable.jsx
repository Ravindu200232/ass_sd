import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function MonthlyTrendTable({ monthlyTrend }) {
  if (!monthlyTrend || monthlyTrend.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Month</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Profit</TableHead>
          <TableHead>Margin</TableHead>
          <TableHead>Invoices</TableHead>
          <TableHead>GRNs</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {monthlyTrend.map((month, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{month.month}</TableCell>
            <TableCell>LKR {month.revenue.toLocaleString()}</TableCell>
            <TableCell>LKR {month.cost.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={month.profit > 0 ? 'default' : 'destructive'}>
                LKR {month.profit.toLocaleString()}
              </Badge>
            </TableCell>
            <TableCell>
              <span className={`${month.margin > 20 ? 'text-green-600' : month.margin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                {month.margin}%
              </span>
            </TableCell>
            <TableCell>{month.invoice_count}</TableCell>
            <TableCell>{month.grn_count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
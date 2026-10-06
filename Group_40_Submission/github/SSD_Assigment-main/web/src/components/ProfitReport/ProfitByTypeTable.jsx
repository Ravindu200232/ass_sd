import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function ProfitByTypeTable({ profitByType }) {
  if (!profitByType || profitByType.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service Type</TableHead>
          <TableHead>Invoices</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Profit</TableHead>
          <TableHead>Margin</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profitByType.map((type, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">
              <Badge 
                variant={
                  type.type === 'Tire ' ? 'default' : 
                  type.type === 'Tire + Service' ? 'destructive' : 
                  'secondary'
                }
              >
                {type.type}
              </Badge>
            </TableCell>
            <TableCell>{type.invoice_count}</TableCell>
            <TableCell>LKR {type.revenue.toLocaleString()}</TableCell>
            <TableCell>LKR {type.cost.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={type.profit > 0 ? 'default' : 'destructive'}>
                LKR {type.profit.toLocaleString()}
              </Badge>
            </TableCell>
            <TableCell>
              <MarginBar margin={type.margin} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MarginBar({ margin }) {
  return (
    <div className="flex items-center">
      <span className={`mr-2 ${margin > 20 ? 'text-green-600' : margin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
        {margin}%
      </span>
      <div className="w-20 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${margin > 20 ? 'bg-green-500' : margin > 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(margin, 100)}%` }}
        />
      </div>
    </div>
  );
}
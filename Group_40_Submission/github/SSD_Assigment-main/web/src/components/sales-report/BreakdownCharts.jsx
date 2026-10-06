import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Wrench } from 'lucide-react';

export const BreakdownCharts = ({ salesData, getTypeBadge }) => {
  if (!salesData || (!salesData.type_breakdown?.length && !salesData.service_breakdown?.length)) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {salesData.type_breakdown?.length > 0 && (
        <BreakdownTable
          title="Sales by Invoice Type"
          icon={Package}
          description="Revenue breakdown by invoice type"
          data={salesData.type_breakdown}
          totalRevenue={salesData.total_revenue}
          type="type"
          getBadge={getTypeBadge}
        />
      )}

      {salesData.service_breakdown?.length > 0 && (
        <BreakdownTable
          title="Sales by Service"
          icon={Wrench}
          description="Revenue breakdown by service type"
          data={salesData.service_breakdown}
          totalRevenue={salesData.total_revenue}
          type="service"
        />
      )}
    </div>
  );
};

const BreakdownTable = ({ title, icon: Icon, description, data, totalRevenue, type, getBadge }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{type === 'type' ? 'Type' : 'Service'}</TableHead>
            <TableHead>Invoices</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {type === 'type' ? (
                  getBadge(item.type)
                ) : (
                  <div className="max-w-[200px] truncate" title={item.service}>
                    {item.service || 'Not Specified'}
                  </div>
                )}
              </TableCell>
              <TableCell>{item.quantity || 0}</TableCell>
              <TableCell>LKR {item.revenue?.toLocaleString() || '0'}</TableCell>
              <TableCell>
                {totalRevenue ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, DollarSign, CreditCard } from 'lucide-react';

export const SummaryCards = ({ salesData, fromDate, toDate }) => {
  if (!salesData) return null;

  const cards = [
    {
      title: 'Total Revenue',
      value: `LKR ${salesData.total_revenue?.toLocaleString() || '0'}`,
      description: fromDate && toDate
        ? `${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`
        : 'All time',
      icon: BarChart3,
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Invoices',
      value: String(salesData.total_invoices || 0),
      description: 'Transactions',
      icon: FileText,
      iconColor: 'text-blue-600',
    },
    {
      title: 'Cash Collected',
      value: `LKR ${salesData.cash_collected?.toLocaleString() || '0'}`,
      description: 'Cash payments',
      icon: DollarSign,
      iconColor: 'text-green-600',
    },
    {
      title: 'Credit Given',
      value: `LKR ${salesData.credit_given?.toLocaleString() || '0'}`,
      description: 'Credit sales',
      icon: CreditCard,
      iconColor: 'text-blue-600',
    },
    {
      title: 'Avg. Invoice',
      value: `LKR ${
        salesData.total_invoices
          ? Math.round(salesData.total_revenue / salesData.total_invoices)?.toLocaleString()
          : '0'
      }`,
      description: 'Average per invoice',
      icon: BarChart3,
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
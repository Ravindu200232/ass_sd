import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingCart, TrendingUp, CreditCard } from 'lucide-react';

export function SummaryCards({ profitData }) {
  if (!profitData) return null;

  const cards = [
    {
      title: 'Total Revenue',
      value: profitData.summary.total_revenue,
      subText: `From ${profitData.summary.total_invoices} invoices`,
      icon: DollarSign,
      className: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-700'
    },
    {
      title: 'Total Cost',
      value: profitData.summary.total_cost,
      subText: `From ${profitData.summary.total_grns} GRNs`,
      icon: ShoppingCart,
      className: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-700'
    },
    {
      title: profitData.summary.total_profit >= 0 ? 'Total Profit' : 'Total Loss',
      value: Math.abs(profitData.summary.total_profit),
      subText: (
        <Badge variant={profitData.summary.profit_margin > 20 ? 'default' : profitData.summary.profit_margin > 10 ? 'secondary' : 'destructive'}>
          Margin: {profitData.summary.profit_margin}%
        </Badge>
      ),
      icon: TrendingUp,
      className: profitData.summary.total_profit >= 0 
        ? 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200' 
        : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200',
      iconColor: profitData.summary.total_profit >= 0 ? 'text-purple-600' : 'text-red-600',
      textColor: profitData.summary.total_profit >= 0 ? 'text-purple-700' : 'text-red-700'
    },
    {
      title: 'Cash Collected',
      value: profitData.summary.cash_collected,
      subText: 'Paid invoices',
      icon: DollarSign,
      className: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-700'
    },
    {
      title: 'Credit Given',
      value: profitData.summary.credit_given,
      subText: 'Unpaid invoices',
      icon: CreditCard,
      className: 'bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-200',
      iconColor: 'text-cyan-600',
      textColor: 'text-cyan-700'
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <Card key={index} className={card.className}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${card.textColor}`}>
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.textColor}`}>
              LKR {card.value.toLocaleString()}
            </div>
            <p className="text-xs mt-2">{card.subText}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
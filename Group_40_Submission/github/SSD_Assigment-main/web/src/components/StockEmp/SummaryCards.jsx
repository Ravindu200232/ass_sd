import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, Filter, Search } from "lucide-react";

export const SummaryCards = ({ filtered, totals, showLowStock }) => {
  const cards = [
    {
      title: "Total Products",
      value: filtered.length,
      icon: Package,
      color: "blue",
    },
    {
      title: "Total Items",
      value: totals.totalItems.toLocaleString(),
      icon: Package,
      color: "green",
    },
    {
      title: "Total Value",
      value: `LKR ${totals.totalValue.toLocaleString()}`,
      icon: Package,
      color: "purple",
    },
    {
      title: showLowStock ? "Low Stock Items" : "Filter Status",
      value: showLowStock ? `${filtered.length} items` : showLowStock ? "Active" : "Inactive",
      icon: showLowStock ? AlertTriangle : Search,
      color: showLowStock ? "red" : "orange",
      isLowStock: showLowStock,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`border ${
            card.color === 'blue' ? 'bg-blue-50 border-blue-200' :
            card.color === 'green' ? 'bg-green-50 border-green-200' :
            card.color === 'purple' ? 'bg-purple-50 border-purple-200' :
            card.isLowStock ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-200'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  card.color === 'blue' ? 'text-blue-700' :
                  card.color === 'green' ? 'text-green-700' :
                  card.color === 'purple' ? 'text-purple-700' :
                  card.isLowStock ? 'text-red-700' : 'text-orange-700'
                }`}>
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${
                  card.color === 'blue' ? 'text-blue-800' :
                  card.color === 'green' ? 'text-green-800' :
                  card.color === 'purple' ? 'text-purple-800' :
                  card.isLowStock ? 'text-red-700' : 'text-orange-800'
                }`}>
                  {card.value}
                </p>
              </div>
              <card.icon className={`h-8 w-8 ${
                card.color === 'blue' ? 'text-blue-600' :
                card.color === 'green' ? 'text-green-600' :
                card.color === 'purple' ? 'text-purple-600' :
                card.isLowStock ? 'text-red-600' : 'text-orange-600'
              }`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
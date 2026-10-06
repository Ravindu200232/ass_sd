// src/pages/PriceManagement/PriceStats.jsx

import React from "react";
import { Package, TrendingUp, Percent, DollarSign } from "lucide-react";

export default function PriceStats({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Products"
        value={stats.totalProducts}
        icon={Package}
        bg="bg-white"
        border="border-[#D5E3F4]"
        iconBg="bg-[#0A6ED1]"
      />
      <StatCard
        title="Total GRNs"
        value={stats.totalGrns}
        icon={TrendingUp}
        bg="bg-white"
        border="border-[#D5E3F4]"
        iconBg="bg-green-600"
      />
      <StatCard
        title="Avg Profit Margin"
        value={`${stats.avgProfit.toFixed(2)}%`}
        icon={Percent}
        bg="bg-[#FFF9E8]"
        border="border-[#F2D9A6]"
        iconBg="bg-orange-500"
      />
      <StatCard
        title="Total Inventory Value"
        value={`Rs.${stats.totalValue.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}`}
        icon={DollarSign}
        bg="bg-[#F5F0FF]"
        border="border-[#E0D5F4]"
        iconBg="bg-purple-600"
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, bg, border, iconBg }) {
  return (
    <div
      className={`
        ${bg} ${border}
        p-4 rounded-xl shadow-sm 
        flex items-center gap-4
        transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]
      `}
    >
      <div className={`${iconBg} p-3 rounded-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-[#5A6B7A] uppercase">
          {title}
        </p>
        <p className="text-xl md:text-2xl font-bold text-[#0A294F] mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}

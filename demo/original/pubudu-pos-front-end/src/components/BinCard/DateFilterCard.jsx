import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DateFilterCard({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}) {
  return (
    <Card
      className="
        border border-[#D5E3F4] 
        rounded-xl 
        shadow-sm 
        bg-gradient-to-br from-white via-[#F7FAFF] to-[#E7F1FF]
      "
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-[#0A294F] font-bold">
          Date Filter
        </CardTitle>

        {/* SAP Accent Line */}
        <div className="h-1 w-14 bg-[#0A6ED1] rounded-full mt-1"></div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateInput
          label="From Date"
          value={dateFrom}
          onChange={onDateFromChange}
        />

        <DateInput
          label="To Date"
          value={dateTo}
          onChange={onDateToChange}
        />
      </CardContent>
    </Card>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="font-medium text-[#0A294F] text-sm">
        {label}
      </label>

      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          rounded-lg 
          border-[#C9D9EE]
          focus:ring-2 focus:ring-[#0A6ED1]/40
          focus:border-[#0A6ED1]
          transition-all
        "
      />
    </div>
  );
}

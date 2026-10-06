import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export const StockDetailsPanel = ({ selected }) => {
  return (
    <Card
      className="
        mt-6 rounded-xl border border-[#D5E3F4] 
        shadow-sm bg-white/70 backdrop-blur-sm
      "
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center text-[#0A294F]">
          {/* LEFT */}
          <div className="flex flex-col">
            <span className="font-semibold tracking-tight">
              {selected.product_name} — Batches ({selected.batches.length})
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-xs bg-blue-100 text-blue-800 border-blue-300"
              >
                Department: {selected.department_name}
              </Badge>
              <span className="text-xs text-gray-500">
                Code: {selected.product_code}
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <Badge
            variant="secondary"
            className="bg-[#0A6ED1]/10 text-[#0A6ED1] border border-[#0A6ED1]/30 px-3 py-1 shadow-sm"
          >
            Total Stock: {selected.total_qty}
          </Badge>

        </CardTitle>

        {/* SAP Blue underline */}
        <div className="h-1 w-20 bg-[#0A6ED1] rounded-full mt-2"></div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-[#D5E3F4]">
          <table className="min-w-full text-sm">
            {/* HEADER - Added Department column */}
            <thead
              className="
                bg-gradient-to-r from-white via-[#F4F9FF] to-[#E7F1FF]
                border-b border-[#D3DFEE] text-[#0A294F]
                sticky top-0 z-10 backdrop-blur-md
              "
            >
              <tr>
                {[
                  "GRN Code",
                  "Department",
                  "Date",
                  "Stock Price",
                  "Main Branch Price",
                  "Selling Price",
                  "D1",
                  "D2",
                  "D3",
                  "D4",
                  "Actual Cost",
                  "Qty",
                  "Subtotal",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2 text-left font-semibold text-xs tracking-wide"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* BODY - Added Department column */}
            <tbody className="divide-y divide-[#E5ECF5]">
              {selected.batches.map((batch, index) => (
                <tr
                  key={index}
                  className="
                    hover:bg-[#EAF2FB] transition-colors 
                    text-[#0A294F]
                  "
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    {batch.grn_code}
                  </td>

                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {batch.department_name}
                    </Badge>
                  </td>

                  <td className="px-3 py-2">
                    {batch.date?.slice(0, 10) || "N/A"}
                  </td>

                  <td className="px-3 py-2 text-right font-mono">
                    LKR {Number(batch.stock_price || 0).toLocaleString()}
                  </td>

                  <td className="px-3 py-2 text-right font-mono">
                    LKR {Number(batch.main_branch_price || 0).toLocaleString()}
                  </td>

                  <td className="px-3 py-2 text-right font-mono font-semibold text-[#0A6ED1]">
                    LKR {Number(batch.selling_price || 0).toLocaleString()}
                  </td>

                  {/* Discounts */}
                  {[batch.discount1, batch.discount2, batch.discount3, batch.discount4].map(
                    (d, i) => (
                      <td
                        key={i}
                        className="px-3 py-2 text-right font-mono text-red-600"
                      >
                        {d ? `LKR ${Number(d).toLocaleString()}` : "-"}
                      </td>
                    )
                  )}

                  <td className="px-3 py-2 text-right font-mono text-green-600 font-semibold">
                    LKR {Number(batch.actual_cost || 0).toLocaleString()}
                  </td>

                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {batch.qty}
                  </td>

                  <td className="px-3 py-2 text-right font-mono font-semibold text-[#0A6ED1]">
                    LKR {Number(batch.subtotal || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
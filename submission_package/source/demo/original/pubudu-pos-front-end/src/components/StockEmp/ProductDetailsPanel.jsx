import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const ProductDetailsPanel = ({ selectedProduct, lowStockLimit }) => {
  if (!selectedProduct) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Click a row to view product details.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (selectedProduct.total_qty <= 5) return { variant: "destructive", text: "CRITICAL" };
    if (selectedProduct.total_qty <= lowStockLimit) return { variant: "secondary", text: "LOW STOCK" };
    return { variant: "outline", text: "NORMAL" };
  };

  const status = getStatusBadge();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Product Details</span>
          <Badge variant={status.variant}>{status.text}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div className="border-b pb-3">
            <div className="font-bold text-lg">{selectedProduct.product_name}</div>
            <div className="text-xs text-gray-500">{selectedProduct.product_code}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Brand:</span>
              <div className="font-semibold">{selectedProduct.brand}</div>
            </div>
            <div>
              <span className="text-gray-600">Category:</span>
              <div className="font-semibold">{selectedProduct.category || "N/A"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">Selling Price:</span>
              <div className="font-bold text-green-700 text-lg">
                LKR {Number(selectedProduct.selling_price || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Total Quantity:</span>
              <div className={`font-bold text-lg ${
                selectedProduct.total_qty <= 5 ? 'text-red-700' : 
                selectedProduct.total_qty <= lowStockLimit ? 'text-orange-700' : 
                'text-blue-700'
              }`}>
                {selectedProduct.total_qty.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <span className="text-gray-600">Total Value:</span>
            <div className="font-bold text-purple-700 text-xl">
              LKR {selectedProduct.total_value.toLocaleString()}
            </div>
          </div>

          {selectedProduct.grn_items && selectedProduct.grn_items.length > 0 && (
            <div className="border-t pt-3">
              <span className="text-gray-600 text-sm">Source GRNs:</span>
              <div className="text-xs text-gray-500 mt-1">
                From {selectedProduct.grn_items.length} GRN entries
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
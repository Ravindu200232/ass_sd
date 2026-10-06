import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartItem({
  item,
  index,
  getRequestBadge,
  updateQty,
  updateRequestedDiscount,
  removeFromCart
}) {
  const itemId = item.type === "product" ? item.product_code : item.service_id;
  
  // Simple function to get item type badge
  const getItemTypeBadge = (itemType) => {
    if (itemType === "service") {
      return <Badge className="bg-purple-500 text-xs">Service</Badge>;
    }
    return (
      <Badge variant="outline" className="text-xs">
        Product
      </Badge>
    );
  };

  return (
    <div
      key={`${item.type}-${itemId}-${index}`}
      className="border rounded-lg p-4 bg-white shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-semibold text-gray-900">
              {item.product_name}
            </div>
            {getItemTypeBadge(item.type)}
          </div>
          <div className="text-sm text-gray-500">
            Code: {item.product_code}
          </div>
          {item.description && item.description !== item.product_name && (
            <div className="text-xs text-gray-600 mt-1">
              {item.description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.type === "product" && getRequestBadge(item.product_code)}
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeFromCart(itemId, item.type)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium">Unit Price</Label>
          <div className="font-medium text-gray-900 mt-1">
            LKR {Number(item.selling_price).toLocaleString()}
          </div>
        </div>

        {item.type === "product" ? (
          <div>
            <Label className="text-sm font-medium">Quantity</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQty(itemId, item.qty - 1, "product")}
                disabled={item.qty <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="font-semibold w-8 text-center">
                {item.qty}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQty(itemId, item.qty + 1, "product")}
                disabled={item.qty >= item.available_qty}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Available: {item.available_qty}
            </div>
          </div>
        ) : (
          <div>
            <Label className="text-sm font-medium">Quantity</Label>
            <div className="font-medium text-gray-900 mt-1">
              1 (Service)
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Services have fixed quantity of 1
            </div>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium">Request Discount (LKR)</Label>
          <Input
            type="number"
            value={item.requested_discount}
            onChange={(e) =>
              updateRequestedDiscount(itemId, e.target.value, item.type)
            }
            placeholder="0.00"
            className="mt-1"
            disabled={item.applied_discount > 0}
          />
          <div className="text-xs text-gray-500 mt-1">
            {item.applied_discount > 0
              ? `✓ Approved: LKR ${item.applied_discount.toLocaleString()}`
              : "Enter amount for admin approval"}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-3 border-t">
        <div className="text-sm text-gray-600">
          {item.applied_discount > 0 ? (
            <span className="text-green-600 font-medium">
              ✓ Approved discount applied
            </span>
          ) : item.requested_discount > 0 ? (
            <span className="text-orange-600">
              Requested: LKR {(item.requested_discount || 0).toLocaleString()}
            </span>
          ) : (
            "No discount requested"
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Item Total</div>
          <div className="font-semibold text-lg text-gray-900">
            LKR{" "}
            {(
              (item.selling_price -
                (item.applied_discount || item.requested_discount || 0)) *
              item.qty
            ).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
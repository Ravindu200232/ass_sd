import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Printer, Receipt } from "lucide-react";
import CartItem from "./CartItem";

export default function CartSection({
  cart,
  netTotal,
  pollingActive,
  paymentStatus,
  canUseCredit,
  getRequestBadge,
  getItemTypeBadge,
  updateQty,
  updateRequestedDiscount,
  removeFromCart,
  saveDraftLocal,
  handleManualPrint,
  saveDraftAndCreateRequestsOnServer,
  handleCreateInvoice
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {cart.length} items
              </Badge>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Total: LKR {netTotal.toLocaleString()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {cart.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <div className="text-lg font-medium">Your cart is empty</div>
            <div className="text-sm">
              Add products or services to get started
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {cart.map((item, index) => (
                <CartItem
                  key={`${item.type}-${item.product_code || item.service_id}-${index}`}
                  item={item}
                  index={index}
                  getRequestBadge={getRequestBadge}
                  getItemTypeBadge={getItemTypeBadge}
                  updateQty={updateQty}
                  updateRequestedDiscount={updateRequestedDiscount}
                  removeFromCart={removeFromCart}
                />
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => saveDraftLocal()}>
                Save Local Draft
              </Button>

              <Button
                variant="outline"
                onClick={handleManualPrint}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>

              <Button
                variant="secondary"
                onClick={() => saveDraftAndCreateRequestsOnServer()}
                disabled={
                  pollingActive ||
                  (paymentStatus === "credit" && !canUseCredit)
                }
              >
                {pollingActive ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Tracking Requests...
                  </>
                ) : (
                  "Save Draft & Request Discounts"
                )}
              </Button>

              <Button
                onClick={handleCreateInvoice}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={
                  pollingActive ||
                  (paymentStatus === "credit" && !canUseCredit)
                }
              >
                <Receipt className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
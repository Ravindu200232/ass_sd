import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

export default function ProductsTab({
  searchTerm,
  setSearchTerm,
  filteredProducts,
  showSearchSuggestions,
  setShowSearchSuggestions,
  addToCart,
  productsRaw,
  cart
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle>Products</CardTitle>
            <div className="text-sm text-muted-foreground">
              Search and add products to cart
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative">
          <div className="flex items-center bg-white border-2 border-gray-300 rounded-lg px-3 py-2 focus-within:border-blue-500 transition-colors">
            <Search className="h-5 w-5 text-gray-400 mr-2" />
            <Input
              placeholder="Search products by name or code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchSuggestions(e.target.value.length > 0);
              }}
              onFocus={() =>
                setShowSearchSuggestions(searchTerm.length > 0)
              }
              className="border-0 shadow-none text-lg py-2 h-auto"
            />
          </div>

          {showSearchSuggestions && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredProducts.map((p) => (
                <div
                  key={p.product_code}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => addToCart(p)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {p.product_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Code: {p.product_code} • Brand: {p.brand_name || "N/A"}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Category: {p.category} • Group: {p.group} • Size: {p.size}
                    </div>
                    {p.pattern && (
                      <div className="text-xs text-gray-400">
                        Pattern: {p.pattern}
                      </div>
                    )}
                    {p.full_description && (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {p.full_description.substring(0, 60)}...
                      </div>
                    )}
                    <div className="text-xs text-gray-600 mt-1">
                      Stock: {p.total_qty} • Price: LKR{" "}
                      {p.selling_price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="font-semibold text-green-600 whitespace-nowrap">
                      LKR {p.selling_price.toLocaleString()}
                    </div>
                    <Button size="sm" className="mt-1">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSearchSuggestions && searchTerm && filteredProducts.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
              No products found matching "{searchTerm}"
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {productsRaw.length}
            </div>
            <div className="text-xs text-blue-500">Total Products</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {cart.length}
            </div>
            <div className="text-xs text-green-500">In Cart</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {productsRaw.filter((p) => p.total_qty > 0).length}
            </div>
            <div className="text-xs text-orange-500">In Stock</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
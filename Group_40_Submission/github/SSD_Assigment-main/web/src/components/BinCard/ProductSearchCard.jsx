import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ProductSearchCard({
  productSearch,
  setProductSearch,
  filteredProducts,
  onProductSelect,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Product</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Search product (name, code, size, brand)..."
          className="mb-3"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
        />
        {productSearch && (
          <ProductList
            products={filteredProducts}
            onProductSelect={onProductSelect}
            setProductSearch={setProductSearch}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ProductList({ products, onProductSelect, setProductSearch }) {
  if (products.length === 0) {
    return <p className="p-2 text-gray-500 border rounded">No products found...</p>;
  }

  return (
    <div className="border rounded shadow max-h-60 overflow-auto">
      {products.map((product) => (
        <ProductListItem
          key={product.product_code || product.id}
          product={product}
          onProductSelect={onProductSelect}
          setProductSearch={setProductSearch}
        />
      ))}
    </div>
  );
}

function ProductListItem({ product, onProductSelect, setProductSearch }) {
  const handleClick = () => {
    onProductSelect(product);
    setProductSearch(`${product.product_name} (${product.product_code})`);
  };

  return (
    <div
      className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-900">
            {product.product_name}
          </div>
          <div className="text-sm text-gray-600">
            Code: {product.product_code} | Size: {product.size || "N/A"} | Brand: {product.brand || "N/A"}
          </div>
        </div>
        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Select
        </div>
      </div>
      {product.description && (
        <div className="text-xs text-gray-500 mt-1 truncate">
          {product.description}
        </div>
      )}
    </div>
  );
}
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function TabNavigation({ activeTab, setActiveTab }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "products"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "services"
                ? "border-b-2 border-purple-500 text-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("services")}
          >
            Services
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
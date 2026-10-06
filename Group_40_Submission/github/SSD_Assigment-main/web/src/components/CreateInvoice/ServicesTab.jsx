import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus } from "lucide-react";

const PREDEFINED_SERVICES = [
  {
    id: 1,
    name: "Wheel Alignment",
    price: 2500,
    type: "service",
    description: "Full wheel alignment service",
  },
  {
    id: 2,
    name: "Wheel Balancing",
    price: 1500,
    type: "service",
    description: "Wheel balancing for all wheels",
  },
  {
    id: 3,
    name: "Tyre Rotation",
    price: 800,
    type: "service",
    description: "Tyre rotation service",
  },
  {
    id: 4,
    name: "Tyre Fitting",
    price: 500,
    type: "service",
    description: "Tyre fitting and mounting",
  },
  {
    id: 5,
    name: "Valve Replacement",
    price: 200,
    type: "service",
    description: "Tyre valve replacement",
  },
  {
    id: 6,
    name: "Nitrogen Fill",
    price: 300,
    type: "service",
    description: "Nitrogen gas filling",
  },
  {
    id: 7,
    name: "Puncture Repair",
    price: 400,
    type: "service",
    description: "Tubeless puncture repair",
  },
  {
    id: 8,
    name: "Brake Service",
    price: 3500,
    type: "service",
    description: "Complete brake system service",
  },
];

export default function ServicesTab({
  addServiceToCart,
  setIsServiceDialogOpen
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-purple-500" />
              Services
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Add services to the invoice
            </div>
          </div>
          <Button
            onClick={() => setIsServiceDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            + Custom Service
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PREDEFINED_SERVICES.map((service) => (
            <div
              key={service.id}
              className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {service.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {service.description}
                  </div>
                  <div className="text-sm font-semibold text-green-600 mt-1">
                    LKR {service.price.toLocaleString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => addServiceToCart(service)}
                  className="ml-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
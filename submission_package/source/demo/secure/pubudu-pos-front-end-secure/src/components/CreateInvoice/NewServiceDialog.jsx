import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";

export default function NewServiceDialog({
  isOpen,
  onClose,
  newService,
  setNewService,
  onSave,
  fetchServices,
}) {
  const categories = [
    "alignment",
    "balancing",
    "repair",
    "fitting",
    "maintenance",
    "installation",
    "custom",
  ];

  const handleSave = async () => {
    if (!newService.name || !newService.price) {
      toast.error("Service name and price are required");
      return;
    }

    try {
      const res = await api.post("/services", {
        name: newService.name,
        price: Number(newService.price),
        description: newService.description || "",
        category: newService.category || "custom",
        status: true,
      });

      const createdService = res.data?.data;
      if (createdService) {
        // Refresh services list
        if (fetchServices) {
          await fetchServices();
        }
        
        // Add to cart
        if (onSave) {
          onSave(createdService);
        }
        
        // Reset form
        setNewService({
          name: "",
          price: 0,
          description: "",
          category: "",
          type: "service",
        });
        
        // Close dialog
        onClose();
        
        toast.success("Service created and added to cart");
      } else {
        toast.error("Failed to create service");
      }
    } catch (err) {
      console.error("Error creating service:", err);
      toast.error(err.response?.data?.message || "Failed to create service");
    }
  };

  const handleCancel = () => {
    setNewService({
      name: "",
      price: 0,
      description: "",
      category: "",
      type: "service",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Quick Add Service
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Service Name *</Label>
            <Input
              placeholder="Enter service name"
              value={newService.name}
              onChange={(e) =>
                setNewService((p) => ({ ...p, name: e.target.value }))
              }
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (LKR) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newService.price}
                onChange={(e) =>
                  setNewService((p) => ({
                    ...p,
                    price: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
            
            <div>
              <Label>Category</Label>
              <Select
                value={newService.category}
                onValueChange={(value) =>
                  setNewService((p) => ({ ...p, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Enter service description"
              rows={3}
              value={newService.description}
              onChange={(e) =>
                setNewService((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Add Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
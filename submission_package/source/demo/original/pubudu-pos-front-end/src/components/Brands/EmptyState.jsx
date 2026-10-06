import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Star } from "lucide-react";

export default function EmptyState({ onAddClick }) {
  return (
    <div className="text-center py-16">
      <Star className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 className="text-lg font-semibold mb-2">No Brands Found</h3>
      <p className="text-muted-foreground mb-6">
        Add your first brand to get started
      </p>
      <Button
        onClick={onAddClick}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add First Brand
      </Button>
    </div>
  );
}
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wrench, Plus } from 'lucide-react';

export function EmptyState({ onAddClick }) {
  return (
    <div className="text-center py-16">
      <Wrench className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 className="text-lg font-semibold mb-2">No Labour Services Found</h3>
      <p className="text-muted-foreground mb-6">Add your first labour service to begin</p>
      <Button 
        onClick={onAddClick}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add First Labour
      </Button>
    </div>
  );
}
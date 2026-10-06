import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function PageHeader({ onAddClick }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Labour Services
        </h1>
        <p className="text-muted-foreground">Manage labour services and types</p>
      </div>

      <Button 
        onClick={onAddClick}
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-xl transition-all rounded-lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Labour
      </Button>
    </div>
  );
}
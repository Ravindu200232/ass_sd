import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function EmptyState({ onBack }) {
  return (
    <div className="p-6 text-center">
      <p className="text-gray-600 mb-4">No GRN data found</p>
      <Button onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to GRN Management
      </Button>
    </div>
  );
}
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';

export function EmptyState({ searchTerm, onAddEmployee }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-semibold">No employees found</h3>
      <p>
        {searchTerm
          ? "No employees match your search criteria"
          : "No employees have been registered yet"}
      </p>
      {!searchTerm && (
        <Button className="mt-4" onClick={onAddEmployee}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add First Employee
        </Button>
      )}
    </div>
  );
}
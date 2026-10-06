import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

export function AdminEmptyState({ isAdmin }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <Clock className="h-20 w-20 opacity-50" />
          {isAdmin && (
            <RefreshCw className="h-6 w-6 absolute -top-1 -right-1 text-blue-500 animate-spin" />
          )}
        </div>
      </div>
      <p className="text-lg font-medium mb-2">No pending requests</p>
      <p className="text-sm max-w-md mx-auto">
        {isAdmin 
          ? "New discount requests will appear here automatically. The system checks for new requests every 30 seconds."
          : "You don't have any pending discount requests."
        }
      </p>
    </div>
  );
}

export function UserEmptyState({ status }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Clock className="h-12 w-12 mx-auto opacity-50 mb-3" />
      <p>No {status} requests found</p>
    </div>
  );
}
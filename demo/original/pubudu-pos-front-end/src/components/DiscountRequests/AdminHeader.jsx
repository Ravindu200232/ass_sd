import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Bell } from 'lucide-react';

export function AdminHeader({ refreshing, pendingCount }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2">
          Pending Requests
          {refreshing && (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </CardTitle>
        <CardDescription>
          Real-time discount requests - Automatically updates every 30 seconds
        </CardDescription>
      </div>
      {pendingCount > 0 && (
        <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">
          {pendingCount} pending
        </Badge>
      )}
    </div>
  );
}
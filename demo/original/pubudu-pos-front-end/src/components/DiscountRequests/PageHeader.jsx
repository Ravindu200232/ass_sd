import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bell } from 'lucide-react';

export function PageHeader({ isAdmin, refreshing, pendingCount }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Discount Requests</h1>
        <p className="text-muted-foreground">
          {isAdmin ? (
            <span className="flex items-center gap-2">
              <span>Live discount request tracking</span>
              {refreshing && (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              )}
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                Auto-updates every 30s
              </Badge>
            </span>
          ) : (
            'Request and track discounts'
          )}
        </p>
      </div>
      {isAdmin && pendingCount > 0 && (
        <Badge variant="secondary" className="px-3 py-2 text-sm">
          <Bell className="h-4 w-4 mr-1" />
          {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}
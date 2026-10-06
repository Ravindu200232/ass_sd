import React from 'react';
import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }) {
  const variants = { 
    pending: 'secondary', 
    approved: 'default', 
    rejected: 'destructive', 
    cancelled: 'destructive' 
  };
  
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
}
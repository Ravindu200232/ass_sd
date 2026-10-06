import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';

export function GRNHeader() {
  return (
    <CardHeader>
      <CardTitle>Stock GRN Entry</CardTitle>
      <p className="text-sm text-gray-600">
        Flow: Stock Price → Discounts (D1-D4) → Actual Cost (Auto-calculated)
      </p>
    </CardHeader>
  );
}
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SummarySection({ 
  totalCost, 
  totalSelling, 
  profit, 
  onSubmit,
  isSubmitting = false
}) {
  return (
    <>
      <Card className="p-4 bg-gray-50">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Total Cost (Actual):</span>
          <strong>LKR {totalCost.toLocaleString()}</strong>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-medium">Total Selling:</span>
          <strong>LKR {totalSelling.toLocaleString()}</strong>
        </div>
        <div className="flex justify-between text-green-600 font-bold text-lg mt-2 pt-2 border-t">
          <span>Profit:</span>
          <span>LKR {profit.toLocaleString()}</span>
        </div>
      </Card>

      <Button 
        className="w-full mt-4" 
        size="lg" 
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Processing...' : 'Submit GRN & Download PDF'}
      </Button>
    </>
  );
}
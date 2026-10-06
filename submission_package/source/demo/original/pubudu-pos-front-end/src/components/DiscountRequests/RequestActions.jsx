import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export function RequestActions({ 
  requestId, 
  note, 
  onNoteChange, 
  onApprove, 
  onReject 
}) {
  return (
    <div className="space-y-2 min-w-[200px]">
      <Textarea
        placeholder="Add admin note (optional)..."
        value={note || ''}
        onChange={(e) => onNoteChange(requestId, e.target.value)}
        className="text-sm"
        rows={2}
      />
      <div className="flex space-x-2">
        <Button 
          size="sm" 
          onClick={() => onApprove(requestId)}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={() => onReject(requestId)}
          className="flex-1"
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </div>
    </div>
  );
}
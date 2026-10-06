import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RequestActions } from './RequestActions';

export function AdminTableRow({ 
  request, 
  note, 
  onNoteChange, 
  onApprove, 
  onReject 
}) {
  return (
    <TableRow key={request.id} className="hover:bg-gray-50/50">
      <TableCell className="font-mono text-sm">#{request.id}</TableCell>
      <TableCell className="font-medium">{request.inv_no}</TableCell>
      <TableCell>
        <div className="font-medium">{request.product?.product_name}</div>
        <div className="text-xs text-muted-foreground">{request.product_code}</div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{request.requestedByUser?.full_name || request.requested_by}</div>
        {request.requestedByUser?.email && (
          <div className="text-xs text-muted-foreground">{request.requestedByUser.email}</div>
        )}
      </TableCell>
      <TableCell className="font-medium">
        LKR {Number(request.original_price || 0).toLocaleString()}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          LKR {Number(request.requested_discount || 0).toLocaleString()}
        </Badge>
      </TableCell>
      <TableCell className="font-medium text-green-600">
        LKR {Number(request.final_price || 0).toLocaleString()}
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="truncate" title={request.reason}>
          {request.reason}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {request.created_at ? new Date(request.created_at).toLocaleTimeString() : '-'}
        <br />
        <span className="text-xs">
          {request.created_at ? new Date(request.created_at).toLocaleDateString() : ''}
        </span>
      </TableCell>
      <TableCell>
        <RequestActions
          requestId={request.id}
          note={note}
          onNoteChange={onNoteChange}
          onApprove={onApprove}
          onReject={onReject}
        />
      </TableCell>
    </TableRow>
  );
}
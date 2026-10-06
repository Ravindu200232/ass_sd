import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';

export function UserTableRow({ request }) {
  return (
    <TableRow key={request.id}>
      <TableCell className="font-mono text-sm">#{request.id}</TableCell>
      <TableCell className="font-medium">{request.inv_no}</TableCell>
      <TableCell>
        <div className="font-medium">{request.product?.product_name}</div>
        <div className="text-xs text-muted-foreground">{request.product_code}</div>
      </TableCell>
      <TableCell>LKR {Number(request.original_price || 0).toLocaleString()}</TableCell>
      <TableCell>
        <Badge variant="outline">
          LKR {Number(request.requested_discount || 0).toLocaleString()}
        </Badge>
      </TableCell>
      <TableCell className="font-medium text-green-600">
        LKR {Number(request.final_price || 0).toLocaleString()}
      </TableCell>
      <TableCell className="max-w-sm">
        <div className="truncate" title={request.reason}>
          {request.reason}
        </div>
      </TableCell>
      <TableCell><StatusBadge status={request.status} /></TableCell>
      <TableCell className="max-w-sm">
        <div className="truncate" title={request.admin_note}>
          {request.admin_note || '-'}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {request.updated_at ? new Date(request.updated_at).toLocaleTimeString() : '-'}
        <br />
        <span className="text-xs">
          {request.updated_at ? new Date(request.updated_at).toLocaleDateString() : ''}
        </span>
      </TableCell>
    </TableRow>
  );
}
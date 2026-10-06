import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

export function LabourTable({ 
  labours, 
  filteredLabours, 
  searchTerm, 
  onEdit, 
  onDelete 
}) {
  return (
    <>
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredLabours.length} of {labours.length} labour services
      </div>

      <Table>
        <TableHeader className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm">
          <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <TableHead>Labour Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredLabours.map((labour) => (
            <LabourTableRow 
              key={labour.id}
              labour={labour}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}

          {filteredLabours.length === 0 && searchTerm && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No labour services found matching "{searchTerm}"
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}

function LabourTableRow({ labour, onEdit, onDelete }) {
  return (
    <TableRow className="hover:bg-indigo-50 transition cursor-pointer">
      <TableCell className="font-medium">{labour.labour_name}</TableCell>
      <TableCell>
        <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-1 rounded-lg shadow-sm">
          {labour.type}
        </Badge>
      </TableCell>
      <TableCell>
        {new Date(labour.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(labour)}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded-md"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(labour.id)}
            className="border-red-300 text-red-700 hover:bg-red-100 rounded-md"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
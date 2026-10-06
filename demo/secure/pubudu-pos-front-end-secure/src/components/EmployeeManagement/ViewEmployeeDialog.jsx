import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function ViewEmployeeDialog({ 
  isOpen, 
  onClose, 
  employee, 
  getDepartmentName, 
  getRoleBadgeVariant, 
  getRoleDisplayName 
}) {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>
            View employee information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Full Name</Label>
              <div className="font-medium">{employee.full_name}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Username</Label>
              <div className="font-medium font-mono">{employee.username}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">NIC Number</Label>
              <div className="font-medium">{employee.nic_no}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Role</Label>
              <div>
                <Badge variant={getRoleBadgeVariant(employee.role)}>
                  {getRoleDisplayName(employee.role)}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Phone 01</Label>
              <div className="font-medium">{employee.phone_no_01}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Phone 02</Label>
              <div className="font-medium">{employee.phone_no_02 || "N/A"}</div>
            </div>
            <div className="col-span-2">
              <Label className="text-sm text-muted-foreground">Department</Label>
              <div className="font-medium">{getDepartmentName(employee.department_id)}</div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
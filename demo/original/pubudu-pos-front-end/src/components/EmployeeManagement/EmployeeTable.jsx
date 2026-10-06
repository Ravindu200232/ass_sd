import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  IdCard,
  Phone,
  Building,
  Shield,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

export function EmployeeTable({
  employees,
  onView,
  onEdit,
  onDelete,
  getDepartmentName,
  getRoleBadgeVariant,
  getRoleDisplayName
}) {
  return (
    <div
      className="
        rounded-xl 
        border border-[#D5E3F4]
        overflow-hidden 
        shadow-sm
      "
    >
      <Table>
        {/* TABLE HEADER */}
        <TableHeader>
          <TableRow
            className="
              bg-gradient-to-r 
              from-[#EAF2FB] 
              via-[#E3EEFF] 
              to-[#D9E8FF]
              border-b border-[#C3D4E6]
              text-[#0A294F]
            "
          >
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Username</TableHead>
            <TableHead className="font-semibold">NIC</TableHead>
            <TableHead className="font-semibold">Phone</TableHead>
            <TableHead className="font-semibold">Department</TableHead>
            <TableHead className="font-semibold">Role</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>

        {/* TABLE BODY */}
        <TableBody>
          {employees.map((employee) => (
            <TableRow
              key={employee.id}
              className="
                hover:bg-[#EFF6FF] 
                transition-all 
                border-b border-[#E5EDF7]
              "
            >
              {/* NAME */}
              <TableCell className="font-medium text-[#0A294F]">
                {employee.full_name}
              </TableCell>

              {/* USERNAME */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-[#5A6B7A]" />
                  <span className="font-mono text-[#0A294F]">
                    {employee.username}
                  </span>
                </div>
              </TableCell>

              {/* NIC */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-[#5A6B7A]" />
                  <span className="text-[#0A294F]">{employee.nic_no}</span>
                </div>
              </TableCell>

              {/* PHONES */}
              <TableCell>
                <div className="flex flex-col text-[#0A294F]">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-[#5A6B7A]" />
                    <span>{employee.phone_no_01}</span>
                  </div>

                  {employee.phone_no_02 && (
                    <div className="flex items-center gap-1 text-xs text-[#6B7A99]">
                      <Phone className="h-3 w-3" />
                      <span>{employee.phone_no_02}</span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* DEPARTMENT */}
              <TableCell>
                <div className="flex items-center gap-2 text-[#0A294F]">
                  <Building className="h-4 w-4 text-[#5A6B7A]" />
                  <span>{getDepartmentName(employee.department_id)}</span>
                </div>
              </TableCell>

              {/* ROLE */}
              <TableCell>
                <Badge
                  variant={getRoleBadgeVariant(employee.role)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs shadow-sm"
                >
                  <Shield className="h-3 w-3" />
                  {getRoleDisplayName(employee.role)}
                </Badge>
              </TableCell>

              {/* ACTIONS */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* VIEW */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(employee)}
                    className="text-[#0A6ED1] hover:bg-[#E7F1FF]"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* EDIT */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(employee)}
                    className="text-[#085AA5] hover:bg-[#E7F1FF]"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* DELETE */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(employee)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

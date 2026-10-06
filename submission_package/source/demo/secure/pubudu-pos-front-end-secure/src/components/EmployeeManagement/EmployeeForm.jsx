import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EmployeeForm({ formData, departments, onChange, onSelectChange, isEdit = false }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={onChange}
          placeholder="John Doe"
        />
      </div>

      {/* NIC Number */}
      <div className="space-y-2">
        <Label htmlFor="nic_no">NIC Number *</Label>
        <Input
          id="nic_no"
          name="nic_no"
          value={formData.nic_no}
          onChange={onChange}
          placeholder="199587654321"
        />
      </div>

      {/* Phone Number 01 */}
      <div className="space-y-2">
        <Label htmlFor="phone_no_01">Phone Number 01 *</Label>
        <Input
          id="phone_no_01"
          name="phone_no_01"
          value={formData.phone_no_01}
          onChange={onChange}
          placeholder="0779876543"
        />
      </div>

      {/* Phone Number 02 */}
      <div className="space-y-2">
        <Label htmlFor="phone_no_02">Phone Number 02</Label>
        <Input
          id="phone_no_02"
          name="phone_no_02"
          value={formData.phone_no_02}
          onChange={onChange}
          placeholder="0119876543"
        />
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={onChange}
          placeholder="cashier01"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">{isEdit ? "Password" : "Password *"}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={onChange}
          placeholder={isEdit ? "Leave blank to keep current" : "••••••••"}
        />
        <p className="text-xs text-muted-foreground">
          {isEdit ? "Minimum 6 characters if changing" : "Minimum 6 characters"}
        </p>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => onSelectChange("role", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">Employee</SelectItem>
            {!isEdit && <SelectItem value="manager">Manager</SelectItem>}
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label htmlFor="department_id">Department *</Label>
        <Select
          value={formData.department_id}
          onValueChange={(value) => onSelectChange("department_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id.toString()}>
                {dept.department_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
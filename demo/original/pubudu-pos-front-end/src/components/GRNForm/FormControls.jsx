import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

export function FormControls({
  grnDate,
  onDateChange,
  departmentId,
  onDepartmentChange,
  departments,
  onAddItem,
  onSaveDraft,
  onLoadDraft,
  onImportCSV,
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>GRN Date</Label>
          <Input
            type="date"
            value={grnDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        <div>
          <Label>Department</Label>
          <Select value={departmentId} onValueChange={onDepartmentChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
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

      <div className="flex gap-2 flex-wrap">
        <Button onClick={onAddItem}>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
        <Button
          variant="outline"
          onClick={onImportCSV}
          className="border-[#0A6ED1] text-[#0A6ED1] hover:bg-[#E5F0FF]"
        >
          <Upload className="h-4 w-4 mr-2" /> Import CSV
        </Button>
        <Button variant="secondary" onClick={onSaveDraft}>Save Draft</Button>
        <Button variant="outline" onClick={onLoadDraft}>Load Draft</Button>
      </div>
    </>
  );
}
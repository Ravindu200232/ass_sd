import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

export function LabourFormDialog({ 
  isOpen, 
  onOpenChange,
  editingLabour,
  formData,
  onFormChange,
  onSelectChange,
  onSubmit,
  onClearForm
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) onClearForm();
    }}>
      <DialogTrigger asChild>
        <span className="hidden"></span>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-xl shadow-xl border border-indigo-200 bg-white/90 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle>{editingLabour ? 'Edit Labour Service' : 'Add New Labour Service'}</DialogTitle>
          <DialogDescription>
            {editingLabour ? 'Update labour service details' : 'Create a new labour service'}
          </DialogDescription>
        </DialogHeader>

        <LabourForm
          formData={formData}
          onFormChange={onFormChange}
          onSelectChange={onSelectChange}
          onSubmit={onSubmit}
          editingLabour={editingLabour}
        />
      </DialogContent>
    </Dialog>
  );
}

function LabourForm({ formData, onFormChange, onSelectChange, onSubmit, editingLabour }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Labour Name *</Label>
        <Input
          value={formData.labour_name}
          onChange={(e) => onFormChange('labour_name', e.target.value)}
          placeholder="Enter labour service name"
          required
          className="rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={formData.type} onValueChange={(value) => onSelectChange('type', value)}>
          <SelectTrigger className="rounded-lg border-gray-300">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Service">Service</SelectItem>
            <SelectItem value="Installation">Installation</SelectItem>
            <SelectItem value="Repair">Repair</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit"
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-xl transition-all rounded-lg"
      >
        {editingLabour ? 'Update Labour' : 'Create Labour'}
      </Button>
    </form>
  );
}
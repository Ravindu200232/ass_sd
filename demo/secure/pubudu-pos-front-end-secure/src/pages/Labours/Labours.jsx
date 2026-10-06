import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

// Import components
import { LoadingSpinner } from '../../components/Labours/Loading';
import { EmptyState } from '../../components/Labours/EmptyState';
import { PageHeader } from '../../components/Labours/PageHeader';
import { SearchBar } from '../../components/Labours/SearchBar';
import { LabourFormDialog } from '../../components/Labours/LabourFormDialog';
import { LabourTable } from '../../components/Labours/LabourTable';

export default function Labours() {
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLabour, setEditingLabour] = useState(null);
  const [formData, setFormData] = useState({
    labour_name: '',
    type: 'Service'
  });

  // Fetch labours
  useEffect(() => {
    fetchLabours();
  }, []);

  const fetchLabours = useCallback(async () => {
    try {
      const response = await api.get('/labours');
      setLabours(response.data.data || []);
    } catch (error) {
      console.error('Error fetching labours:', error);
      toast.error('Error fetching labours');
    } finally {
      setLoading(false);
    }
  }, []);

  // Form handlers
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.labour_name.trim()) {
      toast.error('Labour name is required');
      return;
    }

    try {
      if (editingLabour) {
        await api.put(`/labours/${editingLabour.id}`, formData);
        toast.success('Labour updated successfully');
      } else {
        await api.post('/labours', formData);
        toast.success('Labour created successfully');
      }
      
      setIsDialogOpen(false);
      setEditingLabour(null);
      setFormData({ labour_name: '', type: 'Service' });
      fetchLabours();
    } catch (error) {
      console.error('Error saving labour:', error);
      toast.error(`Error ${editingLabour ? 'updating' : 'creating'} labour`);
    }
  }, [formData, editingLabour, fetchLabours]);

  const handleEdit = useCallback((labour) => {
    setEditingLabour(labour);
    setFormData({ labour_name: labour.labour_name, type: labour.type });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (labourId) => {
    if (!window.confirm('Are you sure you want to delete this labour service?')) return;

    try {
      await api.delete(`/labours/${labourId}`);
      toast.success('Labour deleted successfully');
      fetchLabours();
    } catch (error) {
      console.error('Error deleting labour:', error);
      toast.error('Error deleting labour');
    }
  }, [fetchLabours]);

  const clearForm = useCallback(() => {
    setFormData({ labour_name: '', type: 'Service' });
    setEditingLabour(null);
  }, []);

  // Filter labours
  const filteredLabours = labours.filter(labour =>
    (labour.labour_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (labour.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-2 md:p-4">
      {/* HEADER */}
      <PageHeader onAddClick={() => setIsDialogOpen(true)} />

      {/* FORM DIALOG */}
      <LabourFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingLabour={editingLabour}
        formData={formData}
        onFormChange={handleFormChange}
        onSelectChange={handleSelectChange}
        onSubmit={handleSubmit}
        onClearForm={clearForm}
      />

      {/* MAIN CARD */}
      <Card className="shadow-md rounded-xl">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold">All Labour Services</CardTitle>
          <CardDescription>Manage your labour services</CardDescription>
          
          {/* SEARCH BAR */}
          <SearchBar 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
        </CardHeader>

        <CardContent>
          {labours.length === 0 ? (
            <EmptyState onAddClick={() => setIsDialogOpen(true)} />
          ) : (
            <LabourTable
              labours={labours}
              filteredLabours={filteredLabours}
              searchTerm={searchTerm}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
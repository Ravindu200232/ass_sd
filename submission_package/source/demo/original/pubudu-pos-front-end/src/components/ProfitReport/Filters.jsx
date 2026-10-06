import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

export function DateFilter({ fromDate, toDate, onFromDateChange, onToDateChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div>
        <Label>From Date</Label>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label>To Date</Label>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="mt-1"
        />
      </div>
    </div>
  );
}

export function DepartmentFilter({ departmentFilter, onDepartmentFilterChange, departments }) {
  return (
    <div>
      <Label>Department</Label>
      <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map(dept => (
            <SelectItem key={dept.id} value={String(dept.id)}>
              {dept.department_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TypeFilter({ typeFilter, onTypeFilterChange, types }) {
  return (
    <div>
      <Label>Invoice Type</Label>
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {types.map(type => (
            <SelectItem key={type} value={type}>
              {type === 'tire' ? 'Tire ' : 
               type === 'tire and other' ? 'Tire + Service' : 
               'Other Service'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PaymentStatusFilter({ paymentStatusFilter, onPaymentStatusFilterChange }) {
  return (
    <div>
      <Label>Payment Status</Label>
      <Select value={paymentStatusFilter} onValueChange={onPaymentStatusFilterChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="credit">Credit</SelectItem>
          <SelectItem value="card">Card</SelectItem>
          <SelectItem value="cash">Cash</SelectItem>
          <SelectItem value="bankslip">Bank Slip</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function SearchFilter({ searchTerm, onSearchChange, searchType, onSearchTypeChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ${searchType}...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1"
          />
        </div>
        <Select value={searchType} onValueChange={onSearchTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Search by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="invoice">Invoice/Customer</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="department">Department</SelectItem>
            <SelectItem value="type">Invoice Type</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
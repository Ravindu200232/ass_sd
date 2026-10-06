import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Lock, Unlock } from 'lucide-react';

export const FiltersSection = ({
  filters,
  onFilterChange,
  departments,
  currentUser,
  isDepartmentLocked,
  searchTypes,
  types,
  services,
}) => {
  const {
    fromDate,
    toDate,
    statusFilter,
    departmentFilter,
    typeFilter,
    serviceFilter,
    searchTerm,
    searchType,
  } = filters;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters & Search</CardTitle>
        <CardDescription>
          Filter invoices by date range, status, department, type, service, or search criteria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <Label>From Date</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => onFilterChange('fromDate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>To Date</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => onFilterChange('toDate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Payment Status</Label>
            <Select value={statusFilter} onValueChange={(value) => onFilterChange('statusFilter', value)}>
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
          <div>
            <Label>Department</Label>
            <div className="relative">
              <Select
                value={departmentFilter}
                onValueChange={(value) => {
                  if (!isDepartmentLocked) {
                    onFilterChange('departmentFilter', value);
                  }
                }}
                disabled={isDepartmentLocked}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.department_name}
                      {currentUser.department_id === dept.id && ' (Your Department)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isDepartmentLocked && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            {isDepartmentLocked && (
              <div className="text-xs text-gray-500 mt-1 flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                Department filter is locked based on your employee role
              </div>
            )}
            {!isDepartmentLocked && currentUser.role === 'admin' && (
              <div className="text-xs text-blue-500 mt-1 flex items-center">
                <Unlock className="h-3 w-3 mr-1" />
                You can filter by any department as an admin
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <Label>Invoice Type</Label>
            <Select value={typeFilter} onValueChange={(value) => onFilterChange('typeFilter', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'tire'
                      ? 'Tire'
                      : type === 'other'
                      ? 'Service'
                      : type === 'tire and other'
                      ? 'Tire + Service'
                      : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Service</Label>
            <Select value={serviceFilter} onValueChange={(value) => onFilterChange('serviceFilter', value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search by ${searchType}...`}
                value={searchTerm}
                onChange={(e) => onFilterChange('searchTerm', e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={searchType} onValueChange={(value) => onFilterChange('searchType', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent>
                {searchTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {searchTerm && (
            <div className="text-sm text-muted-foreground">
              Searching in {searchType}: "{searchTerm}"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Label = ({ children, className, ...props }) => (
  <label
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  >
    {children}
  </label>
);
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export function SearchBar({ searchTerm, onSearchChange, resultCount }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, NIC, username, or phone..."
                value={searchTerm}
                onChange={onSearchChange}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Badge variant="outline" className="mr-2">
              {resultCount} {resultCount === 1 ? "employee" : "employees"}
            </Badge>
            found
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
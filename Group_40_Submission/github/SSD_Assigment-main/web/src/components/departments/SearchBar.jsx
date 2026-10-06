import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="flex items-center gap-2 p-2 max-w-sm bg-white/60 border rounded-lg shadow-sm">
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="border-0 bg-transparent focus:ring-0"
      />
    </div>
  );
}
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg shadow-sm border bg-white/60 max-w-sm">
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search categories..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-0 bg-transparent focus:ring-0"
      />
    </div>
  );
}
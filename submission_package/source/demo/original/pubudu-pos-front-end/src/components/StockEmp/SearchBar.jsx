import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const SearchBar = ({ globalSearch, setGlobalSearch, setPage }) => {
  return (
    <div className="flex items-center gap-2 bg-white border rounded px-2 py-1">
      <Search className="text-slate-400" />
      <Input
        placeholder="Search items..."
        value={globalSearch}
        onChange={(e) => {
          setGlobalSearch(e.target.value);
          setPage(1);
        }}
        className="border-0 shadow-none h-8 w-72"
      />
    </div>
  );
};
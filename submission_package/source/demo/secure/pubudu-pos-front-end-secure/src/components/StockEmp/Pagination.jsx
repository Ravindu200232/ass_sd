import React from "react";
import { Button } from "@/components/ui/button";

export const Pagination = ({ page, totalPages, setPage }) => {
  return (
    <div className="px-4 py-3 border-t bg-gray-50 flex justify-between">
      <span className="text-sm text-gray-600">
        Page <b>{page}</b> of <b>{totalPages}</b>
      </span>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          disabled={page === 1} 
          onClick={() => setPage(1)}
        >
          {"<<"}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          disabled={page === 1} 
          onClick={() => setPage(page - 1)}
        >
          Prev
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          disabled={page === totalPages} 
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          disabled={page === totalPages} 
          onClick={() => setPage(totalPages)}
        >
          {">>"}
        </Button>
      </div>
    </div>
  );
};
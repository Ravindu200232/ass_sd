import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SavedDraftsCard({ drafts, applyDraft, removeDraft }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Saved Drafts</CardTitle>
      </CardHeader>
      <CardContent>
        {drafts.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No drafts saved locally
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {d.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {d.cart?.length || 0} items
                  </div>
                  {d.invoiceNo && (
                    <div className="text-xs text-blue-600 mt-1">
                      Inv: {d.invoiceNo}
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyDraft(d)}
                  >
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeDraft(d.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
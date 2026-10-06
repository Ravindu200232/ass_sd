import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DraftsDialog({
  isDraftsOpen,
  setIsDraftsOpen,
  drafts,
  applyDraft,
  removeDraft
}) {
  return (
    <Dialog open={isDraftsOpen} onOpenChange={setIsDraftsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Saved Drafts</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {drafts.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No drafts saved locally
            </div>
          ) : (
            drafts.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border rounded p-3"
              >
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleString()} •{" "}
                    {d.cart?.length || 0} items • Inv: {d.invoiceNo || "N/A"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => applyDraft(d)}>Load</Button>
                  <Button variant="outline" onClick={() => removeDraft(d.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDraftsOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
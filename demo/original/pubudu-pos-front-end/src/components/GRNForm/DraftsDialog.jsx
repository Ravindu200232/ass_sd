import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function DraftsDialog({ 
  isOpen, 
  onClose, 
  draftList, 
  onApplyDraft, 
  onDeleteDraft, 
  onClearDrafts 
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved Drafts</DialogTitle>
        </DialogHeader>

        {draftList.length === 0 ? (
          <p className="text-center py-4">No drafts found</p>
        ) : (
          <div className="space-y-2">
            {draftList.map((draft) => (
              <DraftItem 
                key={draft.id}
                draft={draft}
                onApply={() => onApplyDraft(draft)}
                onDelete={() => onDeleteDraft(draft.id)}
              />
            ))}
            <Button variant="outline" onClick={onClearDrafts} className="w-full mt-4">
              Clear All Drafts
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DraftItem({ draft, onApply, onDelete }) {
  return (
    <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">Draft - {new Date(draft.id).toLocaleString()}</div>
          <div className="text-sm text-gray-600">
            {draft.items.length} items • Dept: {draft.department_id || 'N/A'}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onApply}>Load</Button>
          <Button variant="outline" onClick={onDelete}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
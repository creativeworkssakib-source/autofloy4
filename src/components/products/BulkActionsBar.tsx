import { useState } from "react";
import { Trash2, Edit, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BulkActionsBarProps {
  selectedCount: number;
  categories: string[];
  onBulkDelete: () => Promise<void>;
  onBulkUpdate: (updates: { category?: string; is_active?: boolean }) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  categories,
  onBulkDelete,
  onBulkUpdate,
  onClearSelection,
}: BulkActionsBarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await onBulkDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkCategory && !bulkStatus) return;
    
    setIsUpdating(true);
    try {
      const updates: { category?: string; is_active?: boolean } = {};
      if (bulkCategory) updates.category = bulkCategory;
      if (bulkStatus) updates.is_active = bulkStatus === "active";
      await onBulkUpdate(updates);
      setBulkCategory("");
      setBulkStatus("");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>

        <div className="h-4 w-px bg-border" />

        <Select value={bulkCategory} onValueChange={setBulkCategory}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Set category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bulkStatus} onValueChange={setBulkStatus}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Set status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkUpdate}
          disabled={(!bulkCategory && !bulkStatus) || isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Edit className="h-4 w-4 mr-1" />
              Apply
            </>
          )}
        </Button>

        <div className="h-4 w-px bg-border" />

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} products?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected products from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

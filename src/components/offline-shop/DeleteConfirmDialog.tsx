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
import { useLanguage } from "@/contexts/LanguageContext";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string; // e.g., "products", "sales", "customers"
  itemCount?: number;
  isSoftDelete?: boolean; // true = moves to trash (7 days), false = permanent delete
  isLoading?: boolean;
  customDescription?: string; // Optional custom description override
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  itemCount = 1,
  isSoftDelete = true,
  isLoading = false,
  customDescription,
}: DeleteConfirmDialogProps) => {
  const { language } = useLanguage();

  const getDescription = () => {
    if (customDescription) return customDescription;
    
    if (isSoftDelete) {
      return language === "bn"
        ? `সিলেক্ট করা ${title} ৭ দিনের জন্য ট্র্যাশে যাবে।`
        : `Selected ${title.toLowerCase()} will be moved to Trash for 7 days.`;
    }
    return language === "bn"
      ? `এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। সিলেক্ট করা ${title} স্থায়ীভাবে মুছে যাবে।`
      : `This action cannot be undone. Selected ${title.toLowerCase()} will be permanently deleted.`;
  };

  const getTitle = () => {
    if (language === "bn") {
      return itemCount > 1
        ? `${itemCount}টি ${title} মুছে ফেলবেন?`
        : `সিলেক্ট করা ${title} মুছে ফেলবেন?`;
    }
    return itemCount > 1
      ? `Delete ${itemCount} ${title}?`
      : `Delete selected ${title.toLowerCase()}?`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {language === "bn" ? "বাতিল" : "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading 
              ? (language === "bn" ? "ডিলিট হচ্ছে..." : "Deleting...") 
              : (language === "bn" ? "ডিলিট" : "Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

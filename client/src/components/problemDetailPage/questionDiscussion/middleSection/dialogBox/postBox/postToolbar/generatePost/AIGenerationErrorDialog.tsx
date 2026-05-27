import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type AIGenerationErrorDialogProps = {
  isOpen: boolean;
  error: string;
  onClose: () => void;
  onRetry: () => void;
};

const AIGenerationErrorDialog: React.FC<AIGenerationErrorDialogProps> = ({
  isOpen,
  error,
  onClose,
  onRetry,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="text-center">
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle className="text-center">
            Generation failed
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {error}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col items-center sm:flex-col sm:space-x-0 gap-2 space-y-5">
          <AlertDialogAction
            onClick={onRetry}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-none"
          >
            Retry
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose} className="w-full mt-0 shadow-none">
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AIGenerationErrorDialog;

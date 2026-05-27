import React from "react";
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

type AIGenerateConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
};

const AIGenerateConfirmDialog: React.FC<AIGenerateConfirmDialogProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="text-center">
        <AlertDialogHeader className="text-center">
          <AlertDialogTitle className="text-center">
            Replace your current content?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            The AI-generated post will replace everything you have written. All
            changes you made will be lost and cannot be recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="space-x-5">
          <AlertDialogCancel onClick={onClose} className="shadow-none">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onProceed}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-none"
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AIGenerateConfirmDialog;

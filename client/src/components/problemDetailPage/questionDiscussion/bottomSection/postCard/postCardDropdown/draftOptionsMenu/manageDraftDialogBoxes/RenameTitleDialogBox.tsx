import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/helperDialogs";
import { Button } from "@/components/ui/button";

type RenameTitleDialogBoxProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
  title: string;
  actionButton: string;
};

const RenameTitleDialogBox: React.FC<RenameTitleDialogBoxProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
  title,
  actionButton,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center justify-center">
          <DialogTitle className="text-3xl">Unsaved Changes</DialogTitle>
          <DialogDescription className="py-3 text-lg">
            {title}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-center gap-2 sm:justify-center">
          <Button variant="destructive" onClick={onConfirmCancel}>
            {actionButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default RenameTitleDialogBox;

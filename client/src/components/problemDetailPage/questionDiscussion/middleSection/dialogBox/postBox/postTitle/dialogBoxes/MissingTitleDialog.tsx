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

type MissingTitleDialogProps = { isOpen: boolean; onClose: () => void };

const MissingTitleDialog: React.FC<MissingTitleDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center justify-center">
          <DialogTitle className="text-3xl">Title Required</DialogTitle>
          <DialogDescription className="py-3 text-lg">
            Add a title to continue saving or publishing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-center gap-2 sm:justify-center">
          <Button
            variant="destructive"
            onClick={onClose}
            className="w-full flex items-center justify-center"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default MissingTitleDialog;

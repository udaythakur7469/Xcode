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

type PostOrDeleteDraftDialogBoxProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
  title: string;
  noButton: string;
  yesButton: string;
};

const PostOrDeleteDraftDialogBox: React.FC<PostOrDeleteDraftDialogBoxProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
  title,
  noButton,
  yesButton,
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
          <Button className="bg-green-800 text-white" onClick={onClose}>
            {noButton}
          </Button>
          <Button variant="destructive" onClick={onConfirmCancel}>
            {yesButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default PostOrDeleteDraftDialogBox;

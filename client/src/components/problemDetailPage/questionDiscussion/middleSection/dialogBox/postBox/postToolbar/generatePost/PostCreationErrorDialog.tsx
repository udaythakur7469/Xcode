import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PostCreationErrorDialogProps = {
  isOpen: boolean;
  error: string;
  onClose: () => void;
};

const PostCreationErrorDialog: React.FC<PostCreationErrorDialogProps> = ({
  isOpen,
  error,
  onClose,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="text-center">
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle className="text-center">
            Something went wrong
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {error}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col items-center sm:flex-col sm:space-x-0">
          <AlertDialogAction onClick={onClose} className="w-full">
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PostCreationErrorDialog;

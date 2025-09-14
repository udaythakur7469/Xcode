import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string; 
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  children,
  title,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-2xl">
        <DialogTitle className="flex justify-center text-xl">
          {title}
        </DialogTitle>{" "}
        {/* Required for accessibility */}
        {children}
      </DialogContent>
    </Dialog>
  );
};

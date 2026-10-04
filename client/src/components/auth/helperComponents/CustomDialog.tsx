import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  // While true, the dialog can't be dismissed via outside click, Escape,
  // or onOpenChange - used to keep Login/Signup open through their
  // success-message window, same reason LogoutDialog does this itself.
  preventClose?: boolean;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  children,
  title,
  preventClose = false,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open || preventClose) return;
        onClose();
      }}
    >
      <DialogContent
        className="backdrop-blur-2xl"
        onInteractOutside={(event) => {
          if (preventClose) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (preventClose) event.preventDefault();
        }}
      >
        <DialogTitle className="flex justify-center text-xl">
          {title}
        </DialogTitle>{" "}
        {/* Required for accessibility */}
        {children}
      </DialogContent>
    </Dialog>
  );
};

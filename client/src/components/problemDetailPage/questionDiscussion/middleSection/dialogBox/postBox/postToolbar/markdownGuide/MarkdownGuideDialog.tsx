"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import MarkdownGuideBox from "./MarkdownGuideBox";

type MarkdownGuideDialogProps = { isOpen: boolean; onClose: () => void };

const MarkdownGuideDialog: React.FC<MarkdownGuideDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[100vw]">
        <VisuallyHidden.Root>
          <DialogTitle>Markdown guide</DialogTitle>
        </VisuallyHidden.Root>
        <div>
          <MarkdownGuideBox />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default MarkdownGuideDialog;

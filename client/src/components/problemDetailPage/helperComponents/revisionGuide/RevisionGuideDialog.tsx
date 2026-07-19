"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import RevisionGuideBox from "./RevisionGuideBox";

type RevisionGuideDialogProps = { isOpen: boolean; onClose: () => void };

const RevisionGuideDialog: React.FC<RevisionGuideDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[100vw] p-0">
        <VisuallyHidden.Root>
          <DialogTitle>Revision system guide</DialogTitle>
        </VisuallyHidden.Root>
        <div>
          <RevisionGuideBox />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default RevisionGuideDialog;

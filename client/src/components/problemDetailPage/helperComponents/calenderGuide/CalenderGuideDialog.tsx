"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import CalendarGuideBox from "./CalenderGuideBox";

type CalendarGuideDialogProps = { isOpen: boolean; onClose: () => void };

const CalendarGuideDialog: React.FC<CalendarGuideDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[100vw] p-0">
        <VisuallyHidden.Root>
          <DialogTitle>Calendar & analytics panel guide</DialogTitle>
        </VisuallyHidden.Root>
        <div>
          <CalendarGuideBox />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default CalendarGuideDialog;

"use client";

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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { History } from "lucide-react";

type ResetCodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: () => void;
};

const ResetCodeDialog = ({
  open,
  onOpenChange,
  onReset,
}: ResetCodeDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <HoverCard>
        <HoverCardTrigger asChild>
          <History
            className="text-yellow-500 cursor-pointer"
            onClick={() => onOpenChange(true)}
          />
        </HoverCardTrigger>

        <HoverCardContent className="mr-5 p-1">Reset code</HoverCardContent>
      </HoverCard>

      <AlertDialogContent>
        <AlertDialogHeader className="text-center items-center">
          <AlertDialogTitle>Reset to starter code?</AlertDialogTitle>

          <AlertDialogDescription className="text-center">
            Your current code will be lost and replaced with the starter
            template. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter
          className="w-full sm:justify-center sm:space-x-0"
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>

          <AlertDialogAction
            onClick={onReset}
            className="bg-red-600 text-white hover:bg-red-700 !shadow-none focus:!shadow-none"
            style={{ boxShadow: "none" }}
          >
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResetCodeDialog;

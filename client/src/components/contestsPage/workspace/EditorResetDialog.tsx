"use client";

import React from "react";
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

type EditorResetDialogProps = {
  open: boolean;
  onOpen: () => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function EditorResetDialog({ open, onOpen, onOpenChange, onConfirm }: EditorResetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <HoverCard>
        <HoverCardTrigger asChild>
          <History className="w-4 h-4 text-yellow-500 cursor-pointer" onClick={onOpen} />
        </HoverCardTrigger>
        <HoverCardContent className="text-xs p-2 w-auto">Reset code</HoverCardContent>
      </HoverCard>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset to starter code?</AlertDialogTitle>
          <AlertDialogDescription>
            Your current code will be lost and replaced with the starter template. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

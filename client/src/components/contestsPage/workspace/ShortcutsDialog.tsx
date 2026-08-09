"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SHORTCUT_GROUPS = [
  { label: "Code Execution", items: [
    ["Run code", "Ctrl+'"], ["Submit code", "Ctrl+Enter"], ["Reset code (confirm required)", "Ctrl+Backspace"],
  ]},
  { label: "Panel Layout", items: [
    ["Maximize left panel", "Ctrl+→"], ["Maximize right panel", "Ctrl+←"],
    ["Maximize bottom panel", "Ctrl+↑"], ["Minimize bottom panel", "Ctrl+↓"], ["Reset panel layout", "Ctrl+Space"],
  ]},
  { label: "Bottom Panel Tabs", items: [
    ["Switch to Test Cases", "Shift+1"], ["Switch to Results", "Shift+2"],
  ]},
];

type ShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
};

export default function ShortcutsDialog({ open, onOpenChange, onClose }: ShortcutsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Keyboard Shortcuts</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto text-sm">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">{group.label}</div>
              <div className="flex flex-col gap-1.5">
                {group.items.map(([name, keys]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span>{name}</span>
                    <kbd className="text-[10px] border rounded px-1.5 py-0.5 bg-secondary">{keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import React, { useState } from "react";
import { Grid2x2, History } from "lucide-react";

type WorkspaceLayoutMenuProps = {
  onResetLayout: () => void;
};

export default function WorkspaceLayoutMenu({ onResetLayout }: WorkspaceLayoutMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div
        className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-secondary"
        onClick={() => setOpen((v) => !v)}
        title="Layout"
      >
        <Grid2x2 className="w-4 h-4" />
      </div>
      {open && (
        <div className="absolute right-0 top-9 w-52 rounded-md border shadow-lg py-1 bg-card text-foreground z-50">
          <div
            className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center gap-2"
            onClick={() => {
              onResetLayout();
              setOpen(false);
            }}
          >
            <History className="h-3.5 w-3.5" /> Reset panel layout
            <kbd className="ml-auto text-[10px] border rounded px-1">Ctrl+Space</kbd>
          </div>
        </div>
      )}
    </div>
  );
}

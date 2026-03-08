"use client";

// ─────────────────────────────────────────────────────────────
// StickyNoteDialog
// Place at: src/components/stickyNotes/StickyNoteDialog.tsx
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useState } from "react";
import { Check, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { NoteColor, SaveStatus, StickyNote } from "@/types/stickyNotes";
import { NOTE_COLOR_MAP, NOTE_COLORS } from "./ColorConfig";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import StickyNotesFloatingDialog from "./StickyNotesFloatingDialog";
import { useStickyNoteStore } from "@/features/stickyNotesStore";

interface StickyNoteDialogProps {
  note: StickyNote;
  isAuthenticated: boolean;
}

const StickyNoteDialog: React.FC<StickyNoteDialogProps> = ({
  note,
  isAuthenticated,
}) => {
  const { closeNote, updateNote, deleteNote, bringToFront, saveStatus } =
    useStickyNoteStore();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentSaveStatus: SaveStatus = saveStatus[note.id] ?? "idle";
  const c = NOTE_COLOR_MAP[note.color] ?? NOTE_COLOR_MAP["yellow"];

  // ── Helpers ───────────────────────────────────────────────

  const deriveTitle = useCallback((content: string): string => {
    const firstLine = content.split("\n")[0].trim();
    return firstLine.slice(0, 50) || "Untitled Note";
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    updateNote(
      note.id,
      { content: newContent, title: deriveTitle(newContent) },
      isAuthenticated,
    );
  };

  const handleColorChange = (color: NoteColor) => {
    updateNote(note.id, { color }, isAuthenticated);
  };

  const handleFocus = () => bringToFront(note.id);
  const handleClose = () => closeNote(note.id);

  const handlePositionChange = (x: number, y: number) =>
    updateNote(note.id, { x, y }, isAuthenticated);

  const handleSizeChange = (width: number, height: number) =>
    updateNote(note.id, { width, height }, isAuthenticated);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteNote(note.id, isAuthenticated);
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };

  // ── Save indicator ────────────────────────────────────────

  const SaveIndicator = () => {
    const style = { color: c.text, opacity: 0.7 } as React.CSSProperties;
    if (currentSaveStatus === "saving") {
      return (
        <span
          className="flex items-center gap-1 text-[10px] select-none"
          style={style}
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </span>
      );
    }
    if (currentSaveStatus === "saved") {
      return (
        <span
          className="flex items-center gap-1 text-[10px] select-none"
          style={style}
        >
          <Check className="h-3 w-3" />
          Saved
        </span>
      );
    }
    if (currentSaveStatus === "error") {
      return (
        <span
          className="text-[10px] font-semibold select-none"
          style={{ color: "#ef4444" }}
        >
          Save failed
        </span>
      );
    }
    return null;
  };

  // ── Header actions ────────────────────────────────────────
  // NOTE: The DropdownMenu here is fine because Shadcn DropdownMenu
  // uses a Radix Portal that appends to <body> — it renders outside the
  // note's stacking context so z-index is not an issue.

  const headerActions = (
    <div className="flex items-center gap-1">
      <SaveIndicator />

      {/* Color picker */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-opacity hover:opacity-70"
            style={{ color: c.text }}
            title="Change color"
            // stopPropagation prevents header drag from firing when clicking the trigger
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span
              className="h-3.5 w-3.5 rounded-full inline-block"
              style={{
                backgroundColor: c.swatch,
                boxShadow: `0 0 0 1.5px ${c.text}50`,
              }}
            />
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>

        {/*
          Force the dropdown content to a very high z-index so it
          always floats above all open sticky notes.
          The 'container' prop is intentionally omitted so Radix
          portals to <body> — avoiding any stacking context issues.
        */}
        <DropdownMenuContent
          align="end"
          className="w-40"
          style={{ zIndex: 99999 }}
        >
          {NOTE_COLORS.map((color) => {
            const cfg = NOTE_COLOR_MAP[color];
            return (
              <DropdownMenuItem
                key={color}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => handleColorChange(color)}
              >
                <span
                  className="h-4 w-4 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: cfg.swatch,
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                  }}
                />
                <span className="text-sm">{cfg.label}</span>
                {note.color === color && <Check className="h-3 w-3 ml-auto" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete */}
      <button
        className="rounded p-0.5 transition-opacity hover:opacity-60"
        style={{ color: c.text }}
        onClick={() => setIsDeleteDialogOpen(true)}
        onMouseDown={(e) => e.stopPropagation()}
        title="Delete note"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <>
      <StickyNotesFloatingDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        title={note.title || "Untitled Note"}
        defaultSize={{ width: note.width, height: note.height }}
        defaultPosition={{ x: note.x, y: note.y }}
        zIndex={note.zIndex}
        onFocus={handleFocus}
        onPositionChange={handlePositionChange}
        onSizeChange={handleSizeChange}
        headerActions={headerActions}
        bgColor={c.bg}
        headerBgColor={c.header}
        textColor={c.text}
      >
        <style>{`
          #sn-ta-${note.id}::placeholder { color: ${c.text}; opacity: 0.4; }
        `}</style>
        <textarea
          id={`sn-ta-${note.id}`}
          className="w-full h-full resize-none bg-transparent outline-none text-sm leading-relaxed font-medium"
          style={{ color: c.text }}
          placeholder="Start typing your note…"
          value={note.content}
          onChange={handleContentChange}
          onFocus={handleFocus}
          spellCheck={true}
        />
      </StickyNotesFloatingDialog>

      {/*
        Delete confirmation dialog.
        Rendered via a fixed overlay at z-index 999999 so it always
        sits above all open sticky notes regardless of their zIndex.
        We build this manually (no Shadcn Dialog) to avoid portal
        z-index conflicts.
      */}
      {isDeleteDialogOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 999999 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
          />

          {/* Dialog box */}
          <div className="relative bg-background border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold mb-1">Delete Note</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to delete &quot;
              {note.title || "Untitled Note"}&quot;? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StickyNoteDialog;

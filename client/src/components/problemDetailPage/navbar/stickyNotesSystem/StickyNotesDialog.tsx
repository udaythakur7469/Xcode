"use client";

// ─────────────────────────────────────────────────────────────
// StickyNoteDialog
// Place at: src/components/stickyNotes/StickyNoteDialog.tsx
// ─────────────────────────────────────────────────────────────

import React, { useCallback, useState, useRef, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/delete-dialog";
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(note.title || "Untitled Note");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditingTitle) setTitleDraft(note.title || "Untitled Note");
  }, [note.title, isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const commitTitleEdit = () => {
    const trimmed = titleDraft.trim() || "Untitled Note";
    setTitleDraft(trimmed);
    setIsEditingTitle(false);
    if (trimmed !== note.title)
      updateNote(note.id, { title: trimmed }, isAuthenticated);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTitleEdit();
    }
    if (e.key === "Escape") {
      setTitleDraft(note.title || "Untitled Note");
      setIsEditingTitle(false);
    }
  };

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
        title={
          isEditingTitle ? (
            <input
              ref={titleInputRef}
              className="flex-1 bg-transparent outline-none text-sm font-semibold truncate min-w-0 border-current"
              style={{ color: c.text }}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitleEdit}
              onKeyDown={handleTitleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              maxLength={80}
            />
          ) : (
            <span
              className="flex-1 text-sm font-semibold truncate min-w-0 cursor-text hover:opacity-70 transition-opacity"
              style={{ color: c.text }}
              title="Click to rename"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {titleDraft}
            </span>
          )
        }
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent style={{ zIndex: 999999 }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-row justify-center">
              Delete Note
            </AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col justify-center">
              <span className="flex flex-row justify-center">
                Are you sure you want to delete &quot;{" "}
                {note.title || "Untitled Note"}&quot;? This cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center space-x-4">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-none"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StickyNoteDialog;

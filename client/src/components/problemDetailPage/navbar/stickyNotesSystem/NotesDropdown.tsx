"use client";

// ─────────────────────────────────────────────────────────────
// NotesDropdown Component
// Opens below the StickyNote icon button in the navbar
// Shows pinned "New Note" option + scrollable list of saved notes
// Place this file at: src/components/stickyNotes/NotesDropdown.tsx
// ─────────────────────────────────────────────────────────────

import React from "react";
import { Plus } from "lucide-react";
import { StickyNote } from "@/types/stickyNotes";
import NoteListItem from "./NotesListItem";

interface NotesDropdownProps {
  notes: StickyNote[];
  onNewNote: () => void;
  onOpenNote: (note: StickyNote) => void;
}

const NotesDropdown: React.FC<NotesDropdownProps> = ({
  notes,
  onNewNote,
  onOpenNote,
}) => {
  const sortedNotes = [...notes].sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.lastModified ?? 0);
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.lastModified ?? 0);
    return bTime - aTime;
  });

  return (
    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-[9999] w-64 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
      {/* ── Pinned "New Note" option ── */}
      <div className="border-b border-border">
        <button
          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-sm font-medium text-foreground"
          onClick={onNewNote}
        >
          <Plus className="h-4 w-4 text-yellow-400 flex-shrink-0" />
          New Note
        </button>
      </div>

      {/* ── Scrollable saved notes list ── */}
      {sortedNotes.length > 0 ? (
        <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
          {sortedNotes.map((note) => (
            <NoteListItem key={note.id} note={note} onClick={onOpenNote} />
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          No saved notes yet
        </div>
      )}
    </div>
  );
};

export default NotesDropdown;
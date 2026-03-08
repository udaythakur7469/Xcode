"use client";

// ─────────────────────────────────────────────────────────────
// NoteListItem Component
// Reusable item rendered inside the NotesDropdown for each saved note
// Place this file at: src/components/stickyNotes/NoteListItem.tsx
// ─────────────────────────────────────────────────────────────

import React from "react";
import { NOTE_COLOR_MAP } from "./ColorConfig";
import { StickyNote } from "@/types/stickyNotes";

interface NoteListItemProps {
  note: StickyNote;
  onClick: (note: StickyNote) => void;
}

const NoteListItem: React.FC<NoteListItemProps> = ({ note, onClick }) => {
  const colorConfig = NOTE_COLOR_MAP[note.color] ?? NOTE_COLOR_MAP["yellow"];

  const displayTitle = note.title?.trim() || "Untitled Note";
  const displayContent = note.content?.trim()
    ? note.content.trim().slice(0, 60) + (note.content.trim().length > 60 ? "…" : "")
    : "No content yet";

  const formattedDate = note.updatedAt
    ? new Date(note.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <button
      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md hover:bg-secondary/60 transition-colors text-left group"
      onClick={() => onClick(note)}
    >
      {/* Color dot */}
      <span
        className="mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10"
        style={{ backgroundColor: colorConfig.dot }}
      />

      {/* Text content */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground truncate leading-tight">
          {displayTitle}
        </span>
        <span className="text-xs text-muted-foreground truncate mt-0.5 leading-tight">
          {displayContent}
        </span>
      </div>

      {/* Date */}
      {formattedDate && (
        <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          {formattedDate}
        </span>
      )}
    </button>
  );
};

export default NoteListItem;
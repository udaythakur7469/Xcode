"use client";

// ─────────────────────────────────────────────────────────────
// NotesButton (Parent Component)
// Drop-in replacement for the StickyNote icon button in ProblemNavbar
// Manages the dropdown and all open note instances
// Place this file at: src/components/stickyNotes/NotesButton.tsx
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import { StickyNote as StickyNoteIcon } from "lucide-react";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useUserStore } from "@/features/userStore";
import NotesDropdown from "./NotesDropdown";
import { flushAllPendingSaves, useStickyNoteStore } from "@/features/stickyNotesStore";
import { StickyNote } from "@/types/stickyNotes";
import StickyNoteDialog from "./StickyNotesDialog";

const MAX_OPEN_NOTES = 10;

const NotesButton: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const { isUserAuthenticated } = useUserStore();

  const {
    notes,
    openNoteIds,
    initializeStore,
    createNote,
    openNote,
    migrateGuestNotes,
    isInitialized,
  } = useStickyNoteStore();

  // ── Initialize store on mount ─────────────────────────────
  useEffect(() => {
    initializeStore(isUserAuthenticated);
  }, [isUserAuthenticated, initializeStore]);

  // ── Guest → Auth migration on login ──────────────────────
  useEffect(() => {
    if (isUserAuthenticated && isInitialized) {
      migrateGuestNotes().then((count) => {
        if (count > 0) {
          toast.success(
            `${count} guest note${count > 1 ? "s" : ""} saved to your account`,
          );
        }
      });
    }
  }, [isUserAuthenticated, isInitialized, migrateGuestNotes]);

  // ── Force flush pending saves on tab close ────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushAllPendingSaves();
      }
    };

    const handleBeforeUnload = () => {
      flushAllPendingSaves();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // ── Close dropdown on outside click ──────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Limit check helper ────────────────────────────────────
  const checkLimitAndWarn = (): boolean => {
    if (openNoteIds.length >= MAX_OPEN_NOTES) {
      toast.error(
        "You can only have 10 notes open at once. Please close one first.",
      );
      return true;
    }
    return false;
  };

  // ── Handlers ──────────────────────────────────────────────

  const handleButtonClick = () => {
    if (checkLimitAndWarn()) return;

    if (notes.length === 0) {
      // No existing notes — create immediately
      createNote(isUserAuthenticated);
    } else {
      // Has existing notes — toggle dropdown
      setDropdownOpen((prev) => !prev);
    }
  };

  const handleNewNote = () => {
    setDropdownOpen(false);
    if (checkLimitAndWarn()) return;
    createNote(isUserAuthenticated);
  };

  const handleOpenNote = (note: StickyNote) => {
    setDropdownOpen(false);
    if (checkLimitAndWarn()) return;
    openNote(note.id);
  };

  // ── Open notes (the visible floating ones) ────────────────
  const openNotes = notes.filter((n) => openNoteIds.includes(n.id));

  const openCount = openNoteIds.length;

  return (
    <>
      {/* ── Navbar button with badge ── */}
      <div className="relative" ref={buttonRef}>
        <HoverCard>
          <HoverCardTrigger asChild>
            <div
              className="flex justify-center items-center rounded-md px-2 bg-secondary h-8 cursor-pointer relative select-none"
              onClick={handleButtonClick}
            >
              <StickyNoteIcon className="h-5 w-5 text-yellow-400" />

              {/* Open notes counter badge */}
              {openCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-0.5 rounded-full bg-yellow-400 text-black text-[9px] font-bold flex items-center justify-center leading-none">
                  {openCount}/{MAX_OPEN_NOTES}
                </span>
              )}
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="mr-5 p-1 text-xs">
            Sticky Notes{" "}
            {openCount > 0 ? `(${openCount}/${MAX_OPEN_NOTES} open)` : ""}
          </HoverCardContent>
        </HoverCard>

        {/* ── Dropdown ── */}
        {dropdownOpen && (
          <div ref={dropdownRef}>
            <NotesDropdown
              notes={notes}
              onNewNote={handleNewNote}
              onOpenNote={handleOpenNote}
            />
          </div>
        )}
      </div>

      {/* ── Render all open floating sticky note dialogs ── */}
      {openNotes.map((note) => (
        <StickyNoteDialog
          key={note.id}
          note={note}
          isAuthenticated={isUserAuthenticated}
        />
      ))}
    </>
  );
};

export default NotesButton;

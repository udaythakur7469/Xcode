// ─────────────────────────────────────────────────────────────
// localStorage Utilities for Sticky Notes
// Place this file at: src/features/stickyNotes/localStorageUtils.ts
// ─────────────────────────────────────────────────────────────

import type {
  StickyNote,
  StickyNoteLocalStorage,
  NoteColor,
} from "../types/stickyNotes";

// ── Key Helpers ──────────────────────────────────────────────

// Key for a single note's data
const noteKey = (id: string) => `stickyNote:${id}`;

// Key for the list of all note IDs (used by guest users primarily)
const INDEX_KEY = "stickyNotes:index";

// ── Single Note Operations ───────────────────────────────────

export const saveNoteToLocalStorage = (note: StickyNote): void => {
  try {
    const payload: StickyNoteLocalStorage = {
      id: note.id,
      title: note.title,
      content: note.content,
      color: note.color as NoteColor,
      x: note.x,
      y: note.y,
      width: note.width,
      height: note.height,
      zIndex: note.zIndex,
      lastModified: Date.now(),
    };
    localStorage.setItem(noteKey(note.id), JSON.stringify(payload));

    // Also ensure the id is in the index
    addNoteIdToIndex(note.id);
  } catch (error) {
    console.error("Failed to save note to localStorage:", error);
  }
};

export const getNoteFromLocalStorage = (
  id: string,
): StickyNoteLocalStorage | null => {
  try {
    const raw = localStorage.getItem(noteKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as StickyNoteLocalStorage;
  } catch {
    return null;
  }
};

export const deleteNoteFromLocalStorage = (id: string): void => {
  try {
    localStorage.removeItem(noteKey(id));
    removeNoteIdFromIndex(id);
  } catch (error) {
    console.error("Failed to delete note from localStorage:", error);
  }
};

export const updateNoteInLocalStorage = (
  id: string,
  updates: Partial<StickyNoteLocalStorage>,
): void => {
  try {
    const existing = getNoteFromLocalStorage(id);
    if (!existing) return;
    const updated: StickyNoteLocalStorage = {
      ...existing,
      ...updates,
      lastModified: Date.now(),
    };
    localStorage.setItem(noteKey(id), JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to update note in localStorage:", error);
  }
};

// ── Index Operations (tracks all note IDs) ───────────────────

export const getNoteIdsFromIndex = (): string[] => {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
};

export const addNoteIdToIndex = (id: string): void => {
  try {
    const ids = getNoteIdsFromIndex();
    if (!ids.includes(id)) {
      localStorage.setItem(INDEX_KEY, JSON.stringify([...ids, id]));
    }
  } catch (error) {
    console.error("Failed to add note id to index:", error);
  }
};

export const removeNoteIdFromIndex = (id: string): void => {
  try {
    const ids = getNoteIdsFromIndex();
    localStorage.setItem(
      INDEX_KEY,
      JSON.stringify(ids.filter((existingId) => existingId !== id)),
    );
  } catch (error) {
    console.error("Failed to remove note id from index:", error);
  }
};

// ── Bulk Operations ───────────────────────────────────────────

// Get all notes stored in localStorage (used for guest users & migration)
export const getAllNotesFromLocalStorage = (): StickyNoteLocalStorage[] => {
  try {
    const ids = getNoteIdsFromIndex();
    const notes: StickyNoteLocalStorage[] = [];
    for (const id of ids) {
      const note = getNoteFromLocalStorage(id);
      if (note) notes.push(note);
    }
    return notes;
  } catch {
    return [];
  }
};

// Save all notes from an array to localStorage (used on initial DB fetch)
export const saveAllNotesToLocalStorage = (notes: StickyNote[]): void => {
  try {
    for (const note of notes) {
      saveNoteToLocalStorage(note);
    }
  } catch (error) {
    console.error("Failed to save all notes to localStorage:", error);
  }
};

// Clear all sticky note data from localStorage (used after guest migration)
export const clearAllStickyNotesFromLocalStorage = (): void => {
  try {
    const ids = getNoteIdsFromIndex();
    for (const id of ids) {
      localStorage.removeItem(noteKey(id));
    }
    localStorage.removeItem(INDEX_KEY);
  } catch (error) {
    console.error("Failed to clear sticky notes from localStorage:", error);
  }
};

// ── Consistency Helpers ───────────────────────────────────────

/**
 * Merges DB notes with localStorage notes, preferring the most recently modified version.
 * Returns a unified array of notes ready to be set in Zustand state.
 */
export const mergeDbWithLocalStorage = (
  dbNotes: StickyNote[],
): StickyNote[] => {
  return dbNotes.map((dbNote) => {
    const localNote = getNoteFromLocalStorage(dbNote.id);

    if (!localNote) {
      // No local copy — use DB version and cache it
      saveNoteToLocalStorage(dbNote);
      return dbNote;
    }

    const dbTime = dbNote.updatedAt ? new Date(dbNote.updatedAt).getTime() : 0;
    const localTime = localNote.lastModified ?? 0;

    if (localTime > dbTime) {
      // Local is newer — keep local values but merge with DB shell
      return {
        ...dbNote,
        title: localNote.title,
        content: localNote.content,
        color: localNote.color,
        x: localNote.x,
        y: localNote.y,
        width: localNote.width,
        height: localNote.height,
        zIndex: localNote.zIndex,
        lastModified: localTime,
      };
    }

    // DB is newer — update localStorage with DB values
    saveNoteToLocalStorage(dbNote);
    return dbNote;
  });
};

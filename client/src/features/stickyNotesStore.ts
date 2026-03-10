// ─────────────────────────────────────────────────────────────
// Sticky Notes Zustand Store
// Place this file at: src/features/stickyNotes/stickyNoteStore.ts
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import {
  NoteColor,
  SaveStatus,
  StickyNote,
  StickyNoteStore,
} from "@/types/stickyNotes";
import {
  clearAllStickyNotesFromLocalStorage,
  deleteNoteFromLocalStorage,
  getAllNotesFromLocalStorage,
  mergeDbWithLocalStorage,
  saveAllNotesToLocalStorage,
  saveNoteToLocalStorage,
  updateNoteInLocalStorage,
} from "@/services/stickyNotesService";
import { NOTE_COLORS } from "@/components/problemDetailPage/navbar/stickyNotesSystem/ColorConfig";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Debounce utility ────────────────────────────────────────
// Holds pending debounce timers keyed by note id
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

const debounceDbSave = (
  noteId: string,
  saveFn: () => Promise<void>,
  delay: number = 1000,
) => {
  if (debounceTimers[noteId]) {
    clearTimeout(debounceTimers[noteId]);
  }
  debounceTimers[noteId] = setTimeout(async () => {
    await saveFn();
    delete debounceTimers[noteId];
  }, delay);
};

// Force flush all pending debounced saves immediately
// Called on beforeunload / visibilitychange
export const flushAllPendingSaves = () => {
  Object.keys(debounceTimers).forEach((id) => {
    clearTimeout(debounceTimers[id]);
    delete debounceTimers[id];
  });
};

// ── Color shuffle bag ────────────────────────────────────────
// Ensures all colors appear once per cycle before any repeats.
let colorBag: NoteColor[] = [];
let lastPickedColor: NoteColor | null = null;

function pickNextColor(): NoteColor {
  if (colorBag.length === 0) {
    do {
      colorBag = [...NOTE_COLORS].sort(() => Math.random() - 0.5);
    } while (colorBag[colorBag.length - 1] === lastPickedColor);
  }
  lastPickedColor = colorBag.pop()!;
  return lastPickedColor;
}

// ── Store ────────────────────────────────────────────────────
export const useStickyNoteStore = create<StickyNoteStore>()((set, get) => ({
  notes: [],
  openNoteIds: [],
  highestZIndex: 1,
  saveStatus: {},
  isInitialized: false,

  // ── setNotes ────────────────────────────────────────────
  setNotes: (notes: StickyNote[]) => set({ notes }),

  // ── setSaveStatus ───────────────────────────────────────
  setSaveStatus: (id: string, status: SaveStatus) =>
    set((state) => ({
      saveStatus: { ...state.saveStatus, [id]: status },
    })),

  // ── initializeStore ─────────────────────────────────────
  // Called once on mount — loads notes from localStorage first,
  // then fetches from DB (if authenticated) and merges
  initializeStore: async (isAuthenticated: boolean) => {
    try {
      if (isAuthenticated) {
        // Load localStorage immediately for fast render
        const localNotes = getAllNotesFromLocalStorage();
        if (localNotes.length > 0) {
          const mapped: StickyNote[] = localNotes.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            color: n.color,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            zIndex: n.zIndex,
            lastModified: n.lastModified,
          }));
          set({ notes: mapped });
        }

        // Fetch from DB and merge
        const response = await axios.get(`${API_URL}/stickyNotes`, {
          withCredentials: true,
        });

        const dbNotes: StickyNote[] = response.data.notes;
        const mergedNotes = mergeDbWithLocalStorage(dbNotes);

        const maxZ = mergedNotes.reduce(
          (max, n) => Math.max(max, n.zIndex ?? 1),
          1,
        );

        set({
          notes: mergedNotes,
          highestZIndex: maxZ,
          isInitialized: true,
        });
      } else {
        // Guest user — load entirely from localStorage
        const localNotes = getAllNotesFromLocalStorage();
        const mapped: StickyNote[] = localNotes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          color: n.color,
          x: n.x,
          y: n.y,
          width: n.width,
          height: n.height,
          zIndex: n.zIndex,
          lastModified: n.lastModified,
        }));

        const maxZ = mapped.reduce((max, n) => Math.max(max, n.zIndex ?? 1), 1);

        set({
          notes: mapped,
          highestZIndex: maxZ,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error("Failed to initialize sticky note store:", error);
      set({ isInitialized: true });
    }
  },

  // ── openNote ────────────────────────────────────────────
  openNote: (noteId: string) => {
    const { openNoteIds, highestZIndex, notes } = get();

    // Enforce 10-note open limit (caller handles the toast)
    if (openNoteIds.length >= 10) return;

    // Already open — just bring to front
    if (openNoteIds.includes(noteId)) {
      get().bringToFront(noteId);
      return;
    }

    const newZ = highestZIndex + 1;

    set((state) => ({
      openNoteIds: [...state.openNoteIds, noteId],
      highestZIndex: newZ,
      notes: state.notes.map((n) =>
        n.id === noteId ? { ...n, zIndex: newZ } : n,
      ),
    }));

    // Persist updated zIndex
    updateNoteInLocalStorage(noteId, { zIndex: newZ });
  },

  // ── closeNote ───────────────────────────────────────────
  closeNote: (noteId: string) => {
    set((state) => ({
      openNoteIds: state.openNoteIds.filter((id) => id !== noteId),
    }));
  },

  // ── randomPosition ──────────────────────────────────────────
  // Picks a random (x, y) that:
  //   • keeps the note fully inside the visible viewport
  //   • does not completely overlap any currently open note
  //     (centres must be at least 50% of note width/height apart)
  // Falls back to a pure random position after 20 attempts so it
  // never blocks note creation.
  // Called only at creation time — after that notes can be dragged anywhere.
  _randomPosition: (noteW: number, noteH: number): { x: number; y: number } => {
    const { notes, openNoteIds } = get();
    const openNotes = notes.filter((n) => openNoteIds.includes(n.id));

    // Safe viewport area: leave a 20px margin on every edge
    const margin = 20;
    const vw =
      typeof document !== "undefined"
        ? document.documentElement.clientWidth
        : 1280;
    const vh =
      typeof document !== "undefined"
        ? document.documentElement.clientHeight
        : 800;

    const minX = margin;
    const minY = margin;
    const maxX = Math.max(minX, vw - noteW - margin);
    const maxY = Math.max(minY, vh - noteH - margin);

    // Minimum distance between centres to avoid complete overlap
    // (50% of the note dimension = centres must differ by at least half the size)
    const minDx = noteW * 0.5;
    const minDy = noteH * 0.5;

    for (let attempt = 0; attempt < 20; attempt++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);

      const cx = x + noteW / 2;
      const cy = y + noteH / 2;

      const tooClose = openNotes.some((n) => {
        const ncx = n.x + (n.width ?? noteW) / 2;
        const ncy = n.y + (n.height ?? noteH) / 2;
        return Math.abs(cx - ncx) < minDx && Math.abs(cy - ncy) < minDy;
      });

      if (!tooClose) return { x, y };
    }

    // Fallback: just random within safe area
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    };
  },

  // ── createNote ──────────────────────────────────────────
  createNote: async (isAuthenticated: boolean) => {
    const { highestZIndex, openNoteIds } = get();

    if (openNoteIds.length >= 10) return; // Caller handles toast

    const newZ = highestZIndex + 1;

    if (isAuthenticated) {
      const randomColor = pickNextColor();
      const { x: randX, y: randY } = get()._randomPosition(420, 300);

      // Build optimistic note with a temp id — opens the UI instantly
      const tempId = uuidv4();
      const optimisticNote: StickyNote = {
        id: tempId,
        title: "Untitled Note",
        content: "",
        color: randomColor,
        x: randX,
        y: randY,
        width: 420,
        height: 300,
        zIndex: newZ,
        lastModified: Date.now(),
      };

      saveNoteToLocalStorage(optimisticNote);

      set((state) => ({
        notes: [optimisticNote, ...state.notes],
        openNoteIds: [...state.openNoteIds, tempId],
        highestZIndex: newZ,
        saveStatus: { ...state.saveStatus, [tempId]: "saving" },
      }));

      // Sync to DB in the background
      try {
        const response = await axios.post(
          `${API_URL}/stickyNotes`,
          {},
          { withCredentials: true },
        );

        const realNote: StickyNote = {
          ...response.data.note,
          zIndex: newZ,
          color: randomColor,
          width: 420,
          height: 300,
          x: randX,
          y: randY,
        };

        await axios.put(
          `${API_URL}/stickyNotes/${realNote.id}`,
          {
            zIndex: newZ,
            color: randomColor,
            width: 420,
            height: 300,
            x: randX,
            y: randY,
          },
          { withCredentials: true },
        );

        deleteNoteFromLocalStorage(tempId);
        saveNoteToLocalStorage(realNote);

        // Swap temp id for real DB id everywhere
        set((state) => ({
          notes: state.notes.map((n) => (n.id === tempId ? realNote : n)),
          openNoteIds: state.openNoteIds.map((id) =>
            id === tempId ? realNote.id : id,
          ),
          saveStatus: {
            ...Object.fromEntries(
              Object.entries(state.saveStatus).filter(
                ([key]) => key !== tempId,
              ),
            ),
            [realNote.id]: "saved",
          },
        }));
      } catch (error) {
        console.error("Failed to create sticky note:", error);
        // Rollback — remove the optimistic note
        deleteNoteFromLocalStorage(tempId);
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== tempId),
          openNoteIds: state.openNoteIds.filter((id) => id !== tempId),
          saveStatus: Object.fromEntries(
            Object.entries(state.saveStatus).filter(([key]) => key !== tempId),
          ),
        }));
      }
    } else {
      // Guest: create locally
      const newNote: StickyNote = {
        id: uuidv4(),
        title: "Untitled Note",
        content: "",
        color: pickNextColor(),
        ...get()._randomPosition(420, 300),
        width: 420,
        height: 300,
        zIndex: newZ,
        lastModified: Date.now(),
      };

      saveNoteToLocalStorage(newNote);

      set((state) => ({
        notes: [newNote, ...state.notes],
        openNoteIds: [...state.openNoteIds, newNote.id],
        highestZIndex: newZ,
        saveStatus: { ...state.saveStatus, [newNote.id]: "saved" },
      }));
    }
  },

  // ── bringToFront ────────────────────────────────────────
  bringToFront: (id: string) => {
    const { highestZIndex } = get();
    const newZ = highestZIndex + 1;

    set((state) => ({
      highestZIndex: newZ,
      notes: state.notes.map((n) => (n.id === id ? { ...n, zIndex: newZ } : n)),
    }));

    // Persist to localStorage immediately
    updateNoteInLocalStorage(id, { zIndex: newZ });
  },

  // ── updateNote ──────────────────────────────────────────
  // Updates a note's fields in Zustand + localStorage immediately,
  // then debounces the DB write
  updateNote: (
    id: string,
    data: Partial<StickyNote>,
    isAuthenticated: boolean,
  ) => {
    // 1. Update Zustand state immediately
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
      saveStatus: { ...state.saveStatus, [id]: "saving" },
    }));

    // 2. Update localStorage immediately
    const localUpdates: Partial<any> = {};
    if (data.title !== undefined) localUpdates.title = data.title;
    if (data.content !== undefined) localUpdates.content = data.content;
    if (data.color !== undefined) localUpdates.color = data.color;
    if (data.x !== undefined) localUpdates.x = data.x;
    if (data.y !== undefined) localUpdates.y = data.y;
    if (data.width !== undefined) localUpdates.width = data.width;
    if (data.height !== undefined) localUpdates.height = data.height;
    if (data.zIndex !== undefined) localUpdates.zIndex = data.zIndex;

    updateNoteInLocalStorage(id, localUpdates);

    // 3. Debounce DB save (only for authenticated users)
    if (isAuthenticated) {
      debounceDbSave(
        id,
        async () => {
          try {
            // Get the latest note data from state to send the most up-to-date version
            const latestNote = get().notes.find((n) => n.id === id);
            if (!latestNote) return;

            await axios.put(
              `${API_URL}/stickyNotes/${id}`,
              {
                title: latestNote.title,
                content: latestNote.content,
                color: latestNote.color,
                x: latestNote.x,
                y: latestNote.y,
                width: latestNote.width,
                height: latestNote.height,
                zIndex: latestNote.zIndex,
              },
              { withCredentials: true },
            );

            set((state) => ({
              saveStatus: { ...state.saveStatus, [id]: "saved" },
            }));
          } catch (error) {
            console.error("Failed to save note to DB:", error);
            set((state) => ({
              saveStatus: { ...state.saveStatus, [id]: "error" },
            }));
          }
        },
        1000,
      );
    } else {
      // For guests, immediately mark as saved after localStorage write
      set((state) => ({
        saveStatus: { ...state.saveStatus, [id]: "saved" },
      }));
    }
  },

  // ── deleteNote ──────────────────────────────────────────
  deleteNote: async (id: string, isAuthenticated: boolean) => {
    // Cancel any pending debounced save for this note
    if (debounceTimers[id]) {
      clearTimeout(debounceTimers[id]);
      delete debounceTimers[id];
    }

    // Remove from Zustand state and open list
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      openNoteIds: state.openNoteIds.filter((nId) => nId !== id),
      saveStatus: Object.fromEntries(
        Object.entries(state.saveStatus).filter(([key]) => key !== id),
      ),
    }));

    // Remove from localStorage
    deleteNoteFromLocalStorage(id);

    // Delete from DB if authenticated
    if (isAuthenticated) {
      try {
        await axios.delete(`${API_URL}/stickyNotes/${id}`, {
          withCredentials: true,
        });
      } catch (error) {
        console.error("Failed to delete note from DB:", error);
      }
    }
  },

  // ── migrateGuestNotes ───────────────────────────────────
  // Called automatically on login — migrates localStorage guest notes to DB
  migrateGuestNotes: async (): Promise<number> => {
    const localNotes = getAllNotesFromLocalStorage();

    if (localNotes.length === 0) return 0;

    try {
      // Fetch existing DB notes to avoid duplicates
      const response = await axios.get(`${API_URL}/stickyNotes`, {
        withCredentials: true,
      });
      const dbNotes: StickyNote[] = response.data.notes;
      const dbIds = new Set(dbNotes.map((n) => n.id));

      // Only migrate notes that don't already exist in DB
      const notesToMigrate = localNotes.filter((n) => !dbIds.has(n.id));

      if (notesToMigrate.length === 0) return 0;

      const bulkResponse = await axios.post(
        `${API_URL}/stickyNotes/bulk`,
        { notes: notesToMigrate },
        { withCredentials: true },
      );

      const migratedNotes: StickyNote[] = bulkResponse.data.notes;

      // Update Zustand state with merged notes
      const allNotes = [...dbNotes, ...migratedNotes];
      const merged = mergeDbWithLocalStorage(allNotes);

      const maxZ = merged.reduce((max, n) => Math.max(max, n.zIndex ?? 1), 1);

      set({ notes: merged, highestZIndex: maxZ });

      // Clear old guest localStorage entries
      clearAllStickyNotesFromLocalStorage();

      // Re-save migrated notes with their new DB IDs
      saveAllNotesToLocalStorage(merged);

      return migratedNotes.length;
    } catch (error) {
      console.error("Failed to migrate guest notes:", error);
      return 0;
    }
  },
}));

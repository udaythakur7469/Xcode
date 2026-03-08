// ─────────────────────────────────────────────────────────────
// Sticky Notes Zustand Store
// Place this file at: src/features/stickyNotes/stickyNoteStore.ts
// ─────────────────────────────────────────────────────────────

import { create } from "zustand";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { SaveStatus, StickyNote, StickyNoteStore } from "@/types/stickyNotes";
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

  // ── createNote ──────────────────────────────────────────
  createNote: async (isAuthenticated: boolean) => {
    const { highestZIndex, openNoteIds } = get();

    if (openNoteIds.length >= 10) return; // Caller handles toast

    const newZ = highestZIndex + 1;

    if (isAuthenticated) {
      try {
        const response = await axios.post(
          `${API_URL}/stickyNotes`,
          {},
          { withCredentials: true },
        );

        const randomColor =
          NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];

        const newNote: StickyNote = {
          ...response.data.note,
          zIndex: newZ,
          color: randomColor,
        };

        // Immediately update zIndex + random color in DB
        await axios.put(
          `${API_URL}/stickyNotes/${newNote.id}`,
          { zIndex: newZ, color: randomColor },
          { withCredentials: true },
        );

        saveNoteToLocalStorage(newNote);

        set((state) => ({
          notes: [newNote, ...state.notes],
          openNoteIds: [...state.openNoteIds, newNote.id],
          highestZIndex: newZ,
          saveStatus: { ...state.saveStatus, [newNote.id]: "saved" },
        }));
      } catch (error) {
        console.error("Failed to create sticky note:", error);
      }
    } else {
      // Guest: create locally
      const newNote: StickyNote = {
        id: uuidv4(),
        title: "Untitled Note",
        content: "",
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        x: 100 + Math.random() * 50,
        y: 100 + Math.random() * 50,
        width: 320,
        height: 240,
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

// ─────────────────────────────────────────────────────────────
// Sticky Notes Types
// Place this file at: src/types/stickyNote.ts
// ─────────────────────────────────────────────────────────────

export type NoteColor =
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "white"
  | "purple";

export interface StickyNote {
  id: string;
  userId?: number;
  title: string;
  content: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt?: string;
  updatedAt?: string;
  // Local-only field: tracks last modification time for consistency checks
  lastModified?: number;
}

// The shape stored in localStorage per note
export interface StickyNoteLocalStorage {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  lastModified: number; // Unix timestamp in ms — used to resolve DB vs localStorage conflicts
}

// Guest note (no userId, lives only in localStorage)
export type GuestStickyNote = Omit<
  StickyNote,
  "userId" | "createdAt" | "updatedAt"
> & {
  lastModified: number;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface StickyNoteStore {
  // All persisted notes (from DB for auth users, from localStorage for guests)
  notes: StickyNote[];

  // IDs of notes currently open/visible on screen
  openNoteIds: string[];

  // The highest z-index currently assigned to any open note
  highestZIndex: number;

  // Per-note save status indicator
  saveStatus: Record<string, SaveStatus>;

  // Whether the store has been initialized (prevents flicker on mount)
  isInitialized: boolean;

  // Actions
  initializeStore: (isAuthenticated: boolean) => Promise<void>;
  openNote: (noteId: string) => void;
  closeNote: (noteId: string) => void;
  createNote: (isAuthenticated: boolean) => Promise<void>;
  updateNote: (
    id: string,
    data: Partial<StickyNote>,
    isAuthenticated: boolean,
  ) => void;
  deleteNote: (id: string, isAuthenticated: boolean) => Promise<void>;
  bringToFront: (id: string) => void;
  setSaveStatus: (id: string, status: SaveStatus) => void;
  migrateGuestNotes: () => Promise<number>;
  setNotes: (notes: StickyNote[]) => void;
}

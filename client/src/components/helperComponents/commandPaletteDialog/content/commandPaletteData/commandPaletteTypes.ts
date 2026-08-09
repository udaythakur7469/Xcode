import type { LucideIcon } from "lucide-react";

/**
 * Every row the command palette can render — a static nav link, an auth
 * action, a quick action, a live problem search result, or a recently
 * viewed problem — is normalized into this one shape so CommandPaletteItem
 * only ever has to render one type of object.
 */
export type CommandPaletteEntryKind =
  | "navigation"
  | "auth"
  | "quick"
  | "problem"
  | "recent";

export interface CommandPaletteEntry {
  /** Stable key, unique within the palette for the current render. */
  id: string;
  title: string;
  /** Secondary line — a route, a short description, or problem tags. */
  subtitle: string;
  icon: LucideIcon;
  kind: CommandPaletteEntryKind;
  onSelect: () => void;
  /** Only present for kind "problem" / "recent". */
  difficulty?: "easy" | "medium" | "hard";
}

export interface CommandPaletteGroup {
  label: string;
  items: CommandPaletteEntry[];
}

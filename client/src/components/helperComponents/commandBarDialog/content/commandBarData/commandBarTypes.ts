import type { LucideIcon } from "lucide-react";

/**
 * Every row the command Bar can render — a static nav link, an auth
 * action, a quick action, a live problem search result, or a recently
 * viewed problem — is normalized into this one shape so CommandBarItem
 * only ever has to render one type of object.
 */
export type CommandBarEntryKind =
  | "navigation"
  | "auth"
  | "quick"
  | "problem"
  | "recent";

export interface CommandBarEntry {
  /** Stable key, unique within the Bar for the current render. */
  id: string;
  title: string;
  /** Secondary line — a route, a short description, or problem tags. */
  subtitle: string;
  icon: LucideIcon;
  kind: CommandBarEntryKind;
  onSelect: () => void;
  /** Only present for kind "problem" / "recent". */
  difficulty?: "easy" | "medium" | "hard";
}

export interface CommandBarGroup {
  label: string;
  items: CommandBarEntry[];
}

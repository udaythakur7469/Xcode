// ─────────────────────────────────────────────────────────────
// Color Config for Sticky Notes
// Place this file at: src/components/stickyNotes/colorConfig.ts
//
// Uses hex values directly (via inline style) instead of Tailwind
// classes so we get full control over vibrant backgrounds with
// guaranteed high-contrast text on top of each color.
// ─────────────────────────────────────────────────────────────

import { NoteColor } from "@/types/stickyNotes";

export interface ColorConfig {
  label: string;
  bg: string; // Hex — main note body background
  header: string; // Hex — slightly darker header strip
  text: string; // Hex — high-contrast text color for this bg
  border: string; // Hex — subtle border matching the theme
  dot: string; // Hex — color dot shown in NoteListItem
  swatch: string; // Hex — color swatch shown in color picker
}

export const NOTE_COLOR_MAP: Record<NoteColor, ColorConfig> = {
  yellow: {
    label: "Yellow",
    bg: "#F5E6A3", // warm parchment yellow — easy on eyes
    header: "#D4B83A",
    text: "#1C1810",
    border: "#C4A820",
    dot: "#F5E6A3",
    swatch: "#F5E6A3",
  },
  green: {
    label: "Green",
    bg: "#B8E6C8", // sage green — soft, readable
    header: "#4A9E6B",
    text: "#0A2E18",
    border: "#3A8A5A",
    dot: "#B8E6C8",
    swatch: "#B8E6C8",
  },
  blue: {
    label: "Blue",
    bg: "#B8D4F0", // dusty blue — calm, legible
    header: "#3A6EA8",
    text: "#0A1628",
    border: "#2A5A90",
    dot: "#B8D4F0",
    swatch: "#B8D4F0",
  },
  pink: {
    label: "Pink",
    bg: "#F2C4D8", // muted rose — soft, not garish
    header: "#C4607A",
    text: "#2A0A14",
    border: "#B04A66",
    dot: "#F2C4D8",
    swatch: "#F2C4D8",
  },
  white: {
    label: "White",
    bg: "#F0EEE8", // warm off-white — less harsh than pure white
    header: "#D8D4CC",
    text: "#1C1C1E",
    border: "#C8C4BC",
    dot: "#E8E4DC",
    swatch: "#F0EEE8",
  },
  purple: {
    label: "Purple",
    bg: "#D4B8F0", // lavender — rich but not blinding
    header: "#7A4AB8",
    text: "#1A0A30",
    border: "#6A3AA8",
    dot: "#D4B8F0",
    swatch: "#D4B8F0",
  },
  red: {
    label: "Red",
    bg: "#F2B8B8", // dusty red — warm, not alarming
    header: "#B84A4A",
    text: "#2A0808",
    border: "#A03A3A",
    dot: "#F2B8B8",
    swatch: "#F2B8B8",
  },
  orange: {
    label: "Orange",
    bg: "#F5D4A8", // warm peach — easy on eyes
    header: "#C47A28",
    text: "#2A1408",
    border: "#B46A18",
    dot: "#F5D4A8",
    swatch: "#F5D4A8",
  },
  teal: {
    label: "Teal",
    bg: "#A8E0D8", // muted teal — fresh, professional
    header: "#2A8A7E",
    text: "#042A26",
    border: "#1A7A6E",
    dot: "#A8E0D8",
    swatch: "#A8E0D8",
  },
  indigo: {
    label: "Indigo",
    bg: "#C0C8F0", // soft periwinkle — pairs well with dark UI
    header: "#4A52B8",
    text: "#0A0E30",
    border: "#3A42A8",
    dot: "#C0C8F0",
    swatch: "#C0C8F0",
  },
};

export const NOTE_COLORS: NoteColor[] = [
  "yellow",
  "green",
  "blue",
  "pink",
  "white",
  "purple",
  "red",
  "orange",
  "teal",
  "indigo",
];

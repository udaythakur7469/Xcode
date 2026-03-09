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
    bg: "#FDE047", // yellow-300 — bright, unmistakably yellow
    header: "#EAB308", // yellow-500 — noticeably darker header strip
    text: "#1C1917", // stone-900 — near-black, maximum contrast on yellow
    border: "#CA8A04", // yellow-600
    dot: "#FDE047",
    swatch: "#FDE047",
  },
  green: {
    label: "Green",
    bg: "#4ADE80", // green-400 — vivid, fresh green
    header: "#16A34A", // green-600
    text: "#052E16", // green-950 — very dark green, crisp on bright bg
    border: "#15803D", // green-700
    dot: "#4ADE80",
    swatch: "#4ADE80",
  },
  blue: {
    label: "Blue",
    bg: "#60A5FA", // blue-400 — clear, vibrant blue
    header: "#2563EB", // blue-600
    text: "#EFF6FF", // blue-50 — near-white, excellent on dark blue header
    border: "#1D4ED8", // blue-700
    dot: "#60A5FA",
    swatch: "#60A5FA",
  },
  pink: {
    label: "Pink",
    bg: "#F472B6", // pink-400 — punchy, saturated pink
    header: "#DB2777", // pink-600
    text: "#1C1917", // stone-900 — dark on bright pink body
    border: "#BE185D", // pink-700
    dot: "#F472B6",
    swatch: "#F472B6",
  },
  white: {
    label: "White",
    bg: "#F8FAFC", // slate-50 — clean off-white
    header: "#E2E8F0", // slate-200
    text: "#0F172A", // slate-900 — crisp black text
    border: "#CBD5E1", // slate-300
    dot: "#E2E8F0",
    swatch: "#F8FAFC",
  },
  purple: {
    label: "Purple",
    bg: "#C084FC", // purple-400 — rich, vivid purple
    header: "#9333EA", // purple-600
    text: "#1C1917", // stone-900 — dark on bright purple
    border: "#7E22CE", // purple-700
    dot: "#C084FC",
    swatch: "#C084FC",
  },
  red: {
    label: "Red",
    bg: "#F87171", // red-400 — vivid, warm red
    header: "#DC2626", // red-600
    text: "#1C1917", // stone-900 — dark on bright red
    border: "#B91C1C", // red-700
    dot: "#F87171",
    swatch: "#F87171",
  },
  orange: {
    label: "Orange",
    bg: "#FB923C",
    header: "#EA580C",
    text: "#1C1917",
    border: "#C2410C",
    dot: "#FB923C",
    swatch: "#FB923C",
  },
  teal: {
    label: "Teal",
    bg: "#2DD4BF",
    header: "#0D9488",
    text: "#042F2E",
    border: "#0F766E",
    dot: "#2DD4BF",
    swatch: "#2DD4BF",
  },
  indigo: {
    label: "Indigo",
    bg: "#818CF8",
    header: "#4F46E5",
    text: "#1E1B4B",
    border: "#4338CA",
    dot: "#818CF8",
    swatch: "#818CF8",
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

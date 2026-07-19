"use client";

import {
  Play,
  CloudUpload,
  RotateCcw,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  LayoutGrid,
  FileText,
  BookOpen,
  BarChart3,
  MessagesSquare,
  ListChecks,
  ClipboardList,
  XCircle,
  Sparkles,
  Maximize2,
  Minimize2,
  Ban,
  Command,
  Bot,
  StickyNote,
  TimerReset,
  Play as PlayIcon,
  Square,
  PanelRightOpen,
  PanelRightClose,
  Lightbulb,
  Keyboard,
  type LucideIcon,
} from "lucide-react";

export type ShortcutCategoryId =
  | "execution"
  | "layout"
  | "navigation"
  | "ai"
  | "productivity"
  | "help";

export type ShortcutCategory = {
  id: ShortcutCategoryId;
  label: string;
  icon: LucideIcon;
};

export type Shortcut = {
  id: string;
  name: string;
  keys: string[];
  category: ShortcutCategoryId;
  icon: LucideIcon;
  // Extra context shown under the shortcut name, for shortcuts whose
  // behavior isn't fully captured by the name + keys alone (e.g. the
  // tab-switching shortcuts, whose target tab shifts depending on
  // whether the Results tab is currently open).
  note?: string;
};

export const shortcutCategories: ShortcutCategory[] = [
  { id: "execution", label: "Code Execution", icon: Play },
  { id: "layout", label: "Panel Layout", icon: LayoutGrid },
  { id: "navigation", label: "Tabs & Navigation", icon: FileText },
  { id: "ai", label: "AI & Analysis", icon: Sparkles },
  { id: "productivity", label: "Productivity", icon: Command },
  { id: "help", label: "Sidebar & Help", icon: Lightbulb },
];

export const shortcuts: Shortcut[] = [
  // ── Code Execution ─────────────────────────────────────────────────
  {
    id: "run-code",
    name: "Run code",
    keys: ["Ctrl", "'"],
    category: "execution",
    icon: Play,
  },
  {
    id: "submit-code",
    name: "Submit code",
    keys: ["Ctrl", "Enter"],
    category: "execution",
    icon: CloudUpload,
  },
  {
    id: "reset-code",
    name: "Reset code",
    keys: ["Ctrl", "Backspace"],
    category: "execution",
    icon: RotateCcw,
  },

  // ── Panel Layout ───────────────────────────────────────────────────
  {
    id: "maximize-left-panel",
    name: "Maximize left panel",
    keys: ["Ctrl", "🡲"],
    category: "layout",
    icon: PanelLeft,
    note: "Expands the question panel, collapsing the code panel",
  },
  {
    id: "maximize-right-panel",
    name: "Maximize right panel",
    keys: ["Ctrl", "🡰"],
    category: "layout",
    icon: PanelRight,
    note: "Expands the code panel, collapsing the question panel",
  },
  {
    id: "maximize-bottom-panel",
    name: "Maximize bottom panel",
    keys: ["Ctrl", "🡱"],
    category: "layout",
    icon: PanelBottom,
    note: "Expands the Test Cases / Results panel",
  },
  {
    id: "minimize-bottom-panel",
    name: "Minimize bottom panel",
    keys: ["Ctrl", "🡳"],
    category: "layout",
    icon: PanelTop,
  },
  {
    id: "reset-panel-layout",
    name: "Reset panel layout",
    keys: ["Ctrl", "Spacebar"],
    category: "layout",
    icon: LayoutGrid,
    note: "Restores every panel to its default size",
  },

  // ── Tabs & Navigation ──────────────────────────────────────────────
  {
    id: "switch-tab-1",
    name: "Switch to Description tab",
    keys: ["Alt", "1"],
    category: "navigation",
    icon: FileText,
  },
  {
    id: "switch-tab-2",
    name: "Switch to Editorial tab",
    keys: ["Alt", "2"],
    category: "navigation",
    icon: BookOpen,
  },
  {
    id: "switch-tab-3",
    name: "Switch to Results tab, or Submissions if Results is closed",
    keys: ["Alt", "3"],
    category: "navigation",
    icon: BarChart3,
    note: "Tab order shifts to make room for Results once it's open",
  },
  {
    id: "switch-tab-4",
    name: "Switch to Submissions tab, or Discussion if Results is closed",
    keys: ["Alt", "4"],
    category: "navigation",
    icon: ClipboardList,
  },
  {
    id: "switch-tab-5",
    name: "Switch to Discussion tab",
    keys: ["Alt", "5"],
    category: "navigation",
    icon: MessagesSquare,
    note: "Only reachable while the Results tab is open",
  },
  {
    id: "switch-testcases-tab",
    name: "Switch to Test Cases tab",
    keys: ["Shift", "1"],
    category: "navigation",
    icon: ListChecks,
    note: "In the bottom panel",
  },
  {
    id: "switch-results-tab",
    name: "Switch to Results tab",
    keys: ["Shift", "2"],
    category: "navigation",
    icon: BarChart3,
    note: "In the bottom panel",
  },
  {
    id: "close-results-tab",
    name: "Close results tab",
    keys: ["Alt", "W"],
    category: "navigation",
    icon: XCircle,
  },

  // ── AI & Analysis ──────────────────────────────────────────────────
  {
    id: "open-ai-chat",
    name: "Open AI chat",
    keys: ["Ctrl", "Q"],
    category: "ai",
    icon: Bot,
  },
  {
    id: "toggle-ai-analysis",
    name: "Toggle AI Analysis panel",
    keys: ["Shift", "A"],
    category: "ai",
    icon: Sparkles,
    note: "Only while the Results tab is open",
  },
  {
    id: "fullscreen-ai-comments",
    name: "Fullscreen the AI Analysis / Comments panel",
    keys: ["Ctrl", "Shift", "🡰"],
    category: "ai",
    icon: Maximize2,
    note: "Applies to whichever of the two is currently open",
  },
  {
    id: "exit-fullscreen-ai-comments",
    name: "Exit fullscreen, keep panel open",
    keys: ["Ctrl", "Shift", "🡲"],
    category: "ai",
    icon: Minimize2,
  },
  {
    id: "close-ai-comments",
    name: "Close the AI Analysis / Comments panel",
    keys: ["Ctrl", "Shift", "Spacebar"],
    category: "ai",
    icon: Ban,
  },

  // ── Productivity ───────────────────────────────────────────────────
  {
    id: "open-command-bar",
    name: "Open command bar",
    keys: ["Ctrl", "K"],
    category: "productivity",
    icon: Command,
  },
  {
    id: "open-sticky-notes",
    name: "Open sticky notes",
    keys: ["Alt", "S"],
    category: "productivity",
    icon: StickyNote,
  },
  {
    id: "start-timer",
    name: "Start timer",
    keys: ["Alt", "T"],
    category: "productivity",
    icon: PlayIcon,
  },
  {
    id: "play-pause-timer",
    name: "Play / Pause timer",
    keys: ["Shift", "Spacebar"],
    category: "productivity",
    icon: PlayIcon,
    note: "Once the timer is showing",
  },
  {
    id: "reset-timer",
    name: "Reset timer",
    keys: ["Shift", "Backspace"],
    category: "productivity",
    icon: TimerReset,
    note: "Once the timer is showing",
  },
  {
    id: "close-timer",
    name: "Close timer",
    keys: ["Alt", "Shift", "W"],
    category: "productivity",
    icon: Square,
  },

  // ── Sidebar & Help ─────────────────────────────────────────────────
  {
    id: "open-problem-sidebar",
    name: "Open problem sidebar",
    keys: ["Alt", "🡲"],
    category: "help",
    icon: PanelRightOpen,
  },
  {
    id: "close-problem-sidebar",
    name: "Close problem sidebar",
    keys: ["Alt", "🡰"],
    category: "help",
    icon: PanelRightClose,
  },
  {
    id: "open-hints-dialog",
    name: "Open hints dialog",
    keys: ["Alt", "H"],
    category: "help",
    icon: Lightbulb,
  },
  {
    id: "open-shortcuts-dialog",
    name: "Open shortcuts dialog",
    keys: ["Alt", "/"],
    category: "help",
    icon: Keyboard,
  },
];

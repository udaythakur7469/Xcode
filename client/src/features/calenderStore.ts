import { create } from "zustand";
import axios from "@/lib/axiosInstance";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CalendarMode = "single" | "range";

export interface DayActivity {
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  /** Number of problems solved on this date */
  solvedCount: number;
  /** Whether the user solved the Problem of the Day on this date */
  hasPotdSolved: boolean;
  /** Whether a spaced-repetition revision is scheduled for this date */
  hasRevisionDue: boolean;
}

export interface ActivityMap {
  [date: string]: DayActivity;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DayStat {
  totalSolved: number;
  totalAttempted: number;
  /** minutes */
  codingTime: number;
  potdCompleted: boolean;
  revisionsdue: number;
  difficulty: { easy: number; medium: number; hard: number };
  solvedProblems: SolvedProblemItem[];
  revisionProblems: RevisionItem[];
}

export interface RangeStat {
  totalSolved: number;
  totalAttempted: number;
  dailyAverage: number;
  mostActiveDay: string | null;
  difficulty: { easy: number; medium: number; hard: number };
  topicDistribution: { topic: string; count: number }[];
  solvedProblems: SolvedProblemItem[];
}

export interface SolvedProblemItem {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  date: string;
}

export interface RevisionItem {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  dueDate: string;
}

export interface PotdProblem {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  description: string;
}

export interface RevisionQueueItem {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  dueDate: string;
  isOverdue: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarState {
  // ── UI State ────────────────────────────────────────────────────────────────
  calendarMode: CalendarMode;
  /** Used in "single" mode — ISO string or null */
  selectedDate: string | null;
  /** Used in "range" mode */
  selectedRange: DateRange;
  /** Controls whether the analytics panel is mounted/visible */
  isAnalyticsPanelOpen: boolean;

  // ── Activity Data ────────────────────────────────────────────────────────────
  activityMap: ActivityMap;
  isLoadingActivity: boolean;
  activityError: string | null;

  // ── Analytics Panel Content ──────────────────────────────────────────────────
  dayStat: DayStat | null;
  rangeStat: RangeStat | null;
  isLoadingStats: boolean;
  statsError: string | null;

  // ── POTD ─────────────────────────────────────────────────────────────────────
  potd: PotdProblem | null;
  isLoadingPotd: boolean;

  // ── Revision Queue ────────────────────────────────────────────────────────────
  revisionQueue: RevisionQueueItem[];
  isLoadingRevision: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────────
  setCalendarMode: (mode: CalendarMode) => void;
  selectDate: (date: string | null) => void;
  selectRange: (range: DateRange) => void;
  clearSelection: () => void;
  closeAnalyticsPanel: () => void;

  fetchActivityData: () => Promise<void>;
  fetchDayStats: (date: string) => Promise<void>;
  fetchRangeStats: (from: string, to: string) => Promise<void>;
  fetchPotd: () => Promise<void>;
  fetchRevisionQueue: () => Promise<void>;
}

export const useCalendarStore = create<CalendarState>()((set, get) => ({
  // ── Initial State ─────────────────────────────────────────────────────────
  calendarMode: "single",
  selectedDate: null,
  selectedRange: { from: undefined, to: undefined },
  isAnalyticsPanelOpen: false,

  activityMap: {},
  isLoadingActivity: false,
  activityError: null,

  dayStat: null,
  rangeStat: null,
  isLoadingStats: false,
  statsError: null,

  potd: null,
  isLoadingPotd: false,

  revisionQueue: [],
  isLoadingRevision: false,

  // ── UI Actions ─────────────────────────────────────────────────────────────

  setCalendarMode: (mode) => {
    set({
      calendarMode: mode,
      selectedDate: null,
      selectedRange: { from: undefined, to: undefined },
      isAnalyticsPanelOpen: false,
      dayStat: null,
      rangeStat: null,
    });
  },

  selectDate: (date) => {
    if (!date) {
      set({ selectedDate: null, isAnalyticsPanelOpen: false, dayStat: null });
      return;
    }
    set({ selectedDate: date, isAnalyticsPanelOpen: true });
    get().fetchDayStats(date);
  },

  selectRange: (range) => {
    set({ selectedRange: range });
    // Only open panel and fetch when both ends are set
    if (range.from && range.to) {
      const from = toIso(range.from);
      const to = toIso(range.to);
      set({ isAnalyticsPanelOpen: true });
      get().fetchRangeStats(from, to);
    }
  },

  clearSelection: () => {
    set({
      selectedDate: null,
      selectedRange: { from: undefined, to: undefined },
      isAnalyticsPanelOpen: false,
      dayStat: null,
      rangeStat: null,
    });
  },

  closeAnalyticsPanel: () => {
    set({
      isAnalyticsPanelOpen: false,
      selectedDate: null,
      selectedRange: { from: undefined, to: undefined },
      dayStat: null,
      rangeStat: null,
    });
  },

  // ── API Calls ──────────────────────────────────────────────────────────────

  fetchActivityData: async () => {
    set({ isLoadingActivity: true, activityError: null });
    try {
      const res = await axios.get(`${API_URL}/calendar/activity`);
      // Expected shape: DayActivity[]
      const map: ActivityMap = {};
      (res.data as DayActivity[]).forEach((d) => {
        map[d.date] = d;
      });
      set({ activityMap: map, isLoadingActivity: false });
    } catch (err: any) {
      set({
        activityError: err.response?.data?.message || "Failed to load activity",
        isLoadingActivity: false,
      });
    }
  },

  fetchDayStats: async (date) => {
    set({
      isLoadingStats: true,
      statsError: null,
      dayStat: null,
      rangeStat: null,
    });
    try {
      const res = await axios.get(`${API_URL}/calendar/dayStats`, {
        params: { date },
      });
      set({ dayStat: res.data as DayStat, isLoadingStats: false });
    } catch (err: any) {
      set({
        statsError: err.response?.data?.message || "Failed to load day stats",
        isLoadingStats: false,
      });
    }
  },

  fetchRangeStats: async (from, to) => {
    set({
      isLoadingStats: true,
      statsError: null,
      dayStat: null,
      rangeStat: null,
    });
    try {
      const res = await axios.get(`${API_URL}/calendar/rangeStats`, {
        params: { from, to },
      });
      set({ rangeStat: res.data as RangeStat, isLoadingStats: false });
    } catch (err: any) {
      set({
        statsError: err.response?.data?.message || "Failed to load range stats",
        isLoadingStats: false,
      });
    }
  },

  fetchPotd: async () => {
    set({ isLoadingPotd: true });
    try {
      const res = await axios.get(`${API_URL}/calendar/potd`);
      set({ potd: res.data as PotdProblem, isLoadingPotd: false });
    } catch {
      set({ isLoadingPotd: false });
    }
  },

  fetchRevisionQueue: async () => {
    set({ isLoadingRevision: true });
    try {
      const res = await axios.get(`${API_URL}/calendar/revisionQueue`);
      set({
        revisionQueue: res.data as RevisionQueueItem[],
        isLoadingRevision: false,
      });
    } catch {
      set({ isLoadingRevision: false });
    }
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a Date to "YYYY-MM-DD" without timezone shift */
export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Convert "YYYY-MM-DD" to a display string like "May 15" */
export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Convert "YYYY-MM-DD" to a display string like "May 15, 2026" */
export function formatDisplayDateFull(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

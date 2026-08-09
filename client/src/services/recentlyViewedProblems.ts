// ─── localStorage persistence for recently viewed problems ─────────────────
// Mirrors the plain-function pattern already used in submissionStore.ts for
// getLastActiveProblemTitle/setLastActiveProblemTitle — a tiny read/write
// pair around browser storage rather than a full zustand store, since this
// data has no server round-trip and no loading/error state to manage.

const RECENTLY_VIEWED_KEY = "xcode_recently_viewed_problems";
const MAX_RECENTLY_VIEWED = 3;

export interface RecentlyViewedProblem {
  title: string;
  difficulty: "easy" | "medium" | "hard";
}

export function getRecentlyViewedProblems(): RecentlyViewedProblem[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    // localStorage unavailable (SSR / privacy mode) — ignore
    return [];
  }
}

export function addRecentlyViewedProblem(problem: RecentlyViewedProblem) {
  try {
    const current = getRecentlyViewedProblems().filter(
      (entry) => entry.title !== problem.title,
    );
    const next = [problem, ...current].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — ignore, this is a non-critical enhancement
  }
}

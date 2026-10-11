import axios from "@/lib/axiosInstance";
import { isCancel } from "axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useUserStore } from "@/features/userStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────────────────────────────────────────────
// Store behind the problem-detail page's Problem List sidebar.
//
// Deliberately separate from `problemStore`: that store is shared by the
// /problems page, the command bar and the analytics panel, so reusing it
// would let a filter or search typed in the sidebar leak into those
// screens (and vice versa). This one is only touched by the sidebar.
//
// Only the filters are persisted (sessionStorage), so they survive
// problem switches and reloads but not a closed tab / browser. The loaded
// rows are never persisted - they are re-fetched, which keeps solved
// status accurate.
// ─────────────────────────────────────────────────────────────────

export const PROBLEM_LIST_PAGE_SIZE = 20;
// Matches MAX_LIMIT on the server. A soft refresh asks for "everything
// that is already loaded" in one request, capped at this.
const MAX_REFRESH_LIMIT = 200;

export type ProblemDifficulty = "easy" | "medium" | "hard";
export type ProblemListStatus = "solved" | "attempted" | "unsolved";
export type ProblemStatusFilter = "all" | ProblemListStatus;

export interface ProblemListItem {
  id: number;
  title: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  // null for logged-out users
  status: ProblemListStatus | null;
}

export interface ProblemListSummary {
  total: number;
  solved: number;
  attempted: number;
}

interface ProblemListFilters {
  query: string;
  status: ProblemStatusFilter;
  difficulties: ProblemDifficulty[];
  tags: string[];
}

interface ProblemNavListResponse {
  data: ProblemListItem[];
  pagination: {
    nextCursor: number | null;
    hasNextPage: boolean;
    total: number | null;
  };
  summary: ProblemListSummary | null;
}

interface ProblemNavState extends ProblemListFilters {
  items: ProblemListItem[];
  nextCursor: number | null;
  hasNextPage: boolean;
  // Number of problems matching the current filters.
  total: number | null;
  // Solved / total across ALL problems. null for logged-out users.
  summary: ProblemListSummary | null;
  hasLoaded: boolean;
  // Loading a fresh list (first open, or after a filter change): the list
  // is replaced by skeleton rows.
  isLoading: boolean;
  // Silent refetch of what is already on screen: rows stay visible.
  isRefreshing: boolean;
  isFetchingMore: boolean;
  error: string | null;
  // true when the failed request was a "load more", so Retry should
  // continue from where the list stopped instead of starting over.
  errorWhileLoadingMore: boolean;

  setQuery: (query: string) => void;
  setStatus: (status: ProblemStatusFilter) => void;
  toggleDifficulty: (difficulty: ProblemDifficulty) => void;
  toggleTag: (tag: string) => void;
  resetFilters: () => void;
  loadFirstPage: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

const DEFAULT_FILTERS: ProblemListFilters = {
  query: "",
  status: "all",
  difficulties: [],
  tags: [],
};

const DIFFICULTY_VALUES: ProblemDifficulty[] = ["easy", "medium", "hard"];
const STATUS_VALUES: ProblemStatusFilter[] = [
  "all",
  "solved",
  "attempted",
  "unsolved",
];

// sessionStorage is user-editable, so never trust its shape.
const sanitizeFilters = (raw: unknown): ProblemListFilters => {
  const value = (raw ?? {}) as Partial<ProblemListFilters>;
  return {
    query: typeof value.query === "string" ? value.query : "",
    status: STATUS_VALUES.includes(value.status as ProblemStatusFilter)
      ? (value.status as ProblemStatusFilter)
      : "all",
    difficulties: Array.isArray(value.difficulties)
      ? value.difficulties.filter((d): d is ProblemDifficulty =>
          DIFFICULTY_VALUES.includes(d as ProblemDifficulty),
        )
      : [],
    tags: Array.isArray(value.tags)
      ? value.tags.filter((t): t is string => typeof t === "string")
      : [],
  };
};

// ── Request bookkeeping ──────────────────────────────────────────
// Only one list request is ever "live". Starting a new one aborts the
// previous (so typing quickly never leaves stale responses racing), and
// requestId guards against a response that resolves after being replaced.
let inFlight: AbortController | null = null;
let requestId = 0;

const beginRequest = () => {
  inFlight?.abort();
  inFlight = new AbortController();
  requestId += 1;
  return { id: requestId, signal: inFlight.signal };
};

const buildParams = (
  filters: ProblemListFilters,
  isAuthenticated: boolean,
  options: { limit: number; cursor?: number | null },
) => {
  const params: Record<string, string | number> = { limit: options.limit };
  if (options.cursor != null) params.cursor = options.cursor;
  const query = filters.query.trim();
  if (query) params.q = query;
  if (filters.difficulties.length) {
    params.difficulty = filters.difficulties.join(",");
  }
  if (filters.tags.length) params.tags = filters.tags.join(",");
  // Guests have no solved/attempted data; the server ignores status for
  // them anyway, so don't even send it.
  if (isAuthenticated && filters.status !== "all") {
    params.status = filters.status;
  }
  return params;
};

const fetchList = async (
  params: Record<string, string | number>,
  signal: AbortSignal,
): Promise<ProblemNavListResponse> => {
  const response = await axios.get(`${API_URL}/problem/navigationList`, {
    params,
    signal,
  });
  return response.data as ProblemNavListResponse;
};

const getErrorMessage = (error: any) =>
  error?.response?.data?.message || "Couldn't load problems.";

const pickFilters = (state: ProblemListFilters): ProblemListFilters => ({
  query: state.query,
  status: state.status,
  difficulties: state.difficulties,
  tags: state.tags,
});

export const useProblemNavStore = create<ProblemNavState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_FILTERS,
      items: [],
      nextCursor: null,
      hasNextPage: false,
      total: null,
      summary: null,
      hasLoaded: false,
      isLoading: false,
      isRefreshing: false,
      isFetchingMore: false,
      error: null,
      errorWhileLoadingMore: false,

      // Every filter change restarts the list from the top.
      setQuery: (query) => {
        if (query === get().query) return;
        set({ query });
        void get().loadFirstPage();
      },
      setStatus: (status) => {
        if (status === get().status) return;
        set({ status });
        void get().loadFirstPage();
      },
      toggleDifficulty: (difficulty) => {
        const current = get().difficulties;
        set({
          difficulties: current.includes(difficulty)
            ? current.filter((d) => d !== difficulty)
            : [...current, difficulty],
        });
        void get().loadFirstPage();
      },
      toggleTag: (tag) => {
        const current = get().tags;
        set({
          tags: current.includes(tag)
            ? current.filter((t) => t !== tag)
            : [...current, tag],
        });
        void get().loadFirstPage();
      },
      resetFilters: () => {
        set({ ...DEFAULT_FILTERS });
        void get().loadFirstPage();
      },

      loadFirstPage: async () => {
        const { id, signal } = beginRequest();
        const isAuthenticated = useUserStore.getState().isUserAuthenticated;
        set({
          items: [],
          nextCursor: null,
          hasNextPage: false,
          isLoading: true,
          isRefreshing: false,
          isFetchingMore: false,
          error: null,
          errorWhileLoadingMore: false,
        });
        try {
          const result = await fetchList(
            buildParams(pickFilters(get()), isAuthenticated, {
              limit: PROBLEM_LIST_PAGE_SIZE,
            }),
            signal,
          );
          if (id !== requestId) return;
          set({
            items: result.data,
            nextCursor: result.pagination.nextCursor,
            hasNextPage: result.pagination.hasNextPage,
            total: result.pagination.total,
            summary: result.summary,
            hasLoaded: true,
            isLoading: false,
          });
        } catch (error: any) {
          if (isCancel(error) || id !== requestId) return;
          set({ isLoading: false, error: getErrorMessage(error) });
        }
      },

      // Re-fetches exactly what is on screen and swaps it in place: used
      // when the sidebar is reopened (solved status may have changed after
      // a submission) and when the user logs in or out. Rows stay visible,
      // so scroll position and focus are untouched. A failure here is
      // silent on purpose - the stale list is still perfectly usable.
      refresh: async () => {
        if (!get().hasLoaded) {
          await get().loadFirstPage();
          return;
        }
        const { id, signal } = beginRequest();
        const isAuthenticated = useUserStore.getState().isUserAuthenticated;
        const limit = Math.min(
          Math.max(get().items.length, PROBLEM_LIST_PAGE_SIZE),
          MAX_REFRESH_LIMIT,
        );
        set({ isRefreshing: true, isFetchingMore: false, error: null });
        try {
          const result = await fetchList(
            buildParams(pickFilters(get()), isAuthenticated, { limit }),
            signal,
          );
          if (id !== requestId) return;
          set({
            items: result.data,
            nextCursor: result.pagination.nextCursor,
            hasNextPage: result.pagination.hasNextPage,
            total: result.pagination.total,
            summary: result.summary,
            isRefreshing: false,
          });
        } catch (error: any) {
          if (isCancel(error) || id !== requestId) return;
          set({ isRefreshing: false });
        }
      },

      loadMore: async () => {
        const state = get();
        if (
          !state.hasNextPage ||
          state.nextCursor == null ||
          state.isLoading ||
          state.isRefreshing ||
          state.isFetchingMore ||
          // After a failed page the user must press Retry; otherwise the
          // scroll listener would hammer a failing endpoint.
          state.error
        ) {
          return;
        }
        const { id, signal } = beginRequest();
        const isAuthenticated = useUserStore.getState().isUserAuthenticated;
        set({ isFetchingMore: true });
        try {
          const result = await fetchList(
            buildParams(pickFilters(state), isAuthenticated, {
              limit: PROBLEM_LIST_PAGE_SIZE,
              cursor: state.nextCursor,
            }),
            signal,
          );
          if (id !== requestId) return;
          set((current) => {
            const known = new Set(current.items.map((item) => item.id));
            return {
              items: [
                ...current.items,
                ...result.data.filter((item) => !known.has(item.id)),
              ],
              nextCursor: result.pagination.nextCursor,
              hasNextPage: result.pagination.hasNextPage,
              isFetchingMore: false,
            };
          });
        } catch (error: any) {
          if (isCancel(error) || id !== requestId) return;
          set({
            isFetchingMore: false,
            error: getErrorMessage(error),
            errorWhileLoadingMore: true,
          });
        }
      },

      retry: async () => {
        if (get().errorWhileLoadingMore) {
          set({ error: null, errorWhileLoadingMore: false });
          await get().loadMore();
        } else {
          await get().loadFirstPage();
        }
      },
    }),
    {
      name: "xcode-problem-list-filters",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => pickFilters(state),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeFilters(persisted),
      }),
    },
  ),
);

import axios from "@/lib/axiosInstance";
import { create } from "zustand";

// ── Types ────────────────────────────────────────────────────────────────

export interface ContestListItem {
  id: number;
  title: string;
  slug: string;
  type: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  _count: { participants: number };
}

export interface ContestDetail extends ContestListItem {
  description: string | null;
  rated: boolean;
  _count: { participants: number };
  problems: { id: number; label: string; points: number; problem: { difficulty: string } }[];
  isRegistered: boolean;
}

export interface ContestWorkspaceProblem {
  id: number;
  label: string;
  points: number;
  problem: {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    tags: string[];
    examples: unknown;
    constraints: unknown;
    baseCodes: { language: string; baseClassCode: string | null }[];
  };
}

export interface LeaderboardRow {
  userId: number;
  name: string;
  rating: number;
  title: string;
  rank: number | null;
  solvedCount: number;
  penaltyMins: number;
  totalPoints: number;
  ratingDelta: number | null;
}

export interface ContestProfile {
  user: { id: number; name: string; contestRating: number; peakRating: number; title: string };
  contestsPlayed: number;
  ratingHistory: { contestTitle: string; contestType: string; rating: number; delta: number; date: string }[];
  achievements: { key: string; name: string; icon: string; category: string; unlockedAt: string }[];
}

export interface JourneyMilestone {
  date: string;
  type: "start" | "title" | "achievement" | "peak";
  title: string;
  description: string;
  icon: string;
  rating: number;
}

interface ContestStoreState {
  // Home page lists
  upcoming: ContestListItem[];
  past: ContestListItem[];
  upcomingHasMore: boolean;
  pastHasMore: boolean;
  loadingList: boolean;

  // Lobby / active contest
  activeContest: ContestDetail | null;
  loadingContest: boolean;

  // Workspace
  workspace: {
    contest: ContestListItem;
    problems: ContestWorkspaceProblem[];
    participant: {
      userId: number;
      rank: number | null;
      solvedCount: number;
      penaltyMins: number;
    };
  } | null;
  loadingWorkspace: boolean;

  // Leaderboard
  leaderboard: LeaderboardRow[];
  leaderboardHasMore: boolean;
  leaderboardFrozen: boolean;
  loadingLeaderboard: boolean;

  // Profile / journey
  profile: ContestProfile | null;
  journey: JourneyMilestone[];
  loadingProfile: boolean;
  loadingJourney: boolean;

  error: string | null;

  fetchContests: (
    status: "upcoming" | "past",
    page: number,
    q?: string,
    append?: boolean,
  ) => Promise<void>;
  fetchContestBySlug: (slug: string) => Promise<void>;
  registerForContest: (contestId: number) => Promise<boolean>;
  fetchWorkspace: (contestId: number) => Promise<void>;
  fetchLeaderboard: (
    contestId: number,
    page: number,
    q?: string,
    append?: boolean,
  ) => Promise<void>;
  fetchProfile: (userId: number) => Promise<void>;
  fetchJourney: (userId: number) => Promise<void>;
}

export const useContestStore = create<ContestStoreState>((set, get) => ({
  upcoming: [],
  past: [],
  upcomingHasMore: false,
  pastHasMore: false,
  loadingList: false,

  activeContest: null,
  loadingContest: false,

  workspace: null,
  loadingWorkspace: false,

  leaderboard: [],
  leaderboardHasMore: false,
  leaderboardFrozen: false,
  loadingLeaderboard: false,

  profile: null,
  journey: [],
  loadingProfile: false,
  loadingJourney: false,

  error: null,

  fetchContests: async (status, page, q = "", append = false) => {
    set({ loadingList: true, error: null });
    try {
      const res = await axios.get("/contest", {
        params: { status, page, pageSize: 6, q },
      });
      const { contests, hasMore } = res.data;
      if (status === "upcoming") {
        set((state) => ({
          upcoming: append ? [...state.upcoming, ...contests] : contests,
          upcomingHasMore: hasMore,
          loadingList: false,
        }));
      } else {
        set((state) => ({
          past: append ? [...state.past, ...contests] : contests,
          pastHasMore: hasMore,
          loadingList: false,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch contests:", err);
      set({ error: "Failed to load contests", loadingList: false });
    }
  },

  fetchContestBySlug: async (slug) => {
    set({ loadingContest: true, error: null, activeContest: null });
    try {
      const res = await axios.get(`/contest/${slug}`);
      set({ activeContest: res.data, loadingContest: false });
    } catch (err) {
      console.error("Failed to fetch contest:", err);
      set({ error: "Failed to load contest", loadingContest: false });
    }
  },

  registerForContest: async (contestId) => {
    try {
      await axios.post(`/contest/${contestId}/register`);
      const current = get().activeContest;
      if (current && current.id === contestId) {
        set({ activeContest: { ...current, isRegistered: true } });
      }
      return true;
    } catch (err) {
      console.error("Failed to register for contest:", err);
      return false;
    }
  },

  fetchWorkspace: async (contestId) => {
    set({ loadingWorkspace: true, error: null });
    try {
      const res = await axios.get(`/contest/${contestId}/workspace`);
      set({ workspace: res.data, loadingWorkspace: false });
    } catch (err) {
      console.error("Failed to fetch contest workspace:", err);
      set({
        error: "Failed to load contest workspace",
        loadingWorkspace: false,
      });
    }
  },

  fetchLeaderboard: async (contestId, page, q = "", append = false) => {
    set({ loadingLeaderboard: true });
    try {
      const res = await axios.get(`/contest/leaderboard/${contestId}`, {
        params: { page, pageSize: 25, q },
      });
      const { leaderboard, hasMore, frozen } = res.data;
      set((state) => ({
        leaderboard: append
          ? [...state.leaderboard, ...leaderboard]
          : leaderboard,
        leaderboardHasMore: hasMore,
        leaderboardFrozen: !!frozen,
        loadingLeaderboard: false,
      }));
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      set({ loadingLeaderboard: false });
    }
  },

  fetchProfile: async (userId) => {
    set({ loadingProfile: true });
    try {
      const res = await axios.get(`/contest/profile/${userId}`);
      set({ profile: res.data, loadingProfile: false });
    } catch (err) {
      console.error("Failed to fetch contest profile:", err);
      set({ loadingProfile: false });
    }
  },

  fetchJourney: async (userId) => {
    set({ loadingJourney: true });
    try {
      const res = await axios.get(`/contest/journey/${userId}`);
      set({ journey: res.data.milestones, loadingJourney: false });
    } catch (err) {
      console.error("Failed to fetch contest journey:", err);
      set({ loadingJourney: false });
    }
  },
}));

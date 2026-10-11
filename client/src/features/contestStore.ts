import axios from "@/lib/axiosInstance";
import { create } from "zustand";

export type ContestType = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type ContestStatus = "SCHEDULED" | "LIVE" | "ENDED";

export interface ContestSummary {
  id: number;
  title: string;
  slug: string;
  type: ContestType;
  status: ContestStatus;
  startTime: string;
  endTime: string;
  ratingWeight: number;
  problemCount: number;
  participantCount: number;
}

export interface ContestDetail {
  id: number;
  title: string;
  slug: string;
  type: ContestType;
  status: ContestStatus;
  startTime: string;
  endTime: string;
  rated: boolean;
  ratingWeight: number;
  participantCount: number;
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
    constraints: string[];
    difficulty: "easy" | "medium" | "hard";
  };
}

export interface ContestWorkspaceParticipant {
  userId: number;
  rank: number | null;
  solvedCount: number;
  penaltyMins: number;
}

export interface ContestWorkspace {
  contest: { id: number; title: string; startTime: string; endTime: string; status: ContestStatus };
  participant: ContestWorkspaceParticipant;
  problems: ContestWorkspaceProblem[];
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
  solvedProblems: { label: string; submittedAtMins: number }[];
}

export interface ContestProfile {
  user: { id: number; name: string; contestRating: number; peakRating: number; title: string };
  contestsPlayed: number;
  ratingHistory: { contestTitle: string; contestType: ContestType; rating: number; delta: number; date: string }[];
  achievements: { key: string; name: string; icon: string; category: string; unlockedAt: string }[];
}

export interface AchievementCatalogEntry {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export interface JourneyMilestone {
  date: string;
  title: string;
  description: string;
}

interface ContestStoreState {
  // list
  contests: ContestSummary[];
  nextContest: ContestSummary | null;
  userRating: { rating: number; title: string } | null;
  loadingList: boolean;

  // lobby
  activeContest: ContestDetail | null;
  loadingLobby: boolean;

  // workspace
  workspace: ContestWorkspace | null;
  loadingWorkspace: boolean;

  // leaderboard
  leaderboardRows: LeaderboardRow[];
  leaderboardTotal: number;
  leaderboardIsFrozen: boolean;
  leaderboardProblemLabels: string[];
  loadingLeaderboard: boolean;

  // profile / journey
  profile: ContestProfile | null;
  journey: JourneyMilestone[];
  loadingProfile: boolean;
  loadingJourney: boolean;
  achievementCatalog: AchievementCatalogEntry[];

  error: string | null;

  fetchContests: (tab: "upcoming" | "past", search?: string) => Promise<void>;
  fetchContestBySlug: (slug: string) => Promise<void>;
  registerForContest: (contestId: number) => Promise<void>;
  fetchWorkspace: (contestId: number) => Promise<void>;
  fetchLeaderboard: (contestId: number, page?: number, search?: string) => Promise<void>;
  fetchProfile: (userId: number) => Promise<void>;
  fetchJourney: (userId: number) => Promise<void>;
  fetchAchievementCatalog: () => Promise<AchievementCatalogEntry[]>;
}

export const useContestStore = create<ContestStoreState>((set, get) => ({
  contests: [],
  nextContest: null,
  userRating: null,
  loadingList: false,

  activeContest: null,
  loadingLobby: false,

  workspace: null,
  loadingWorkspace: false,

  leaderboardRows: [],
  leaderboardTotal: 0,
  leaderboardIsFrozen: false,
  leaderboardProblemLabels: [],
  loadingLeaderboard: false,

  profile: null,
  journey: [],
  loadingProfile: false,
  loadingJourney: false,
  achievementCatalog: [],

  error: null,

  fetchContests: async (tab, search = "") => {
    set({ loadingList: true, error: null });
    try {
      const res = await axios.get("/contest", { params: { tab, search } });
      set({
        contests: res.data.contests,
        nextContest: res.data.nextContest,
        userRating: res.data.userRating,
        loadingList: false,
      });
    } catch (err) {
      console.error("Failed to fetch contests:", err);
      set({ loadingList: false, error: "Failed to load contests" });
    }
  },

  fetchContestBySlug: async (slug) => {
    set({ loadingLobby: true, error: null });
    try {
      const res = await axios.get(`/contest/${slug}`);
      set({ activeContest: res.data.contest, loadingLobby: false });
    } catch (err) {
      console.error("Failed to fetch contest:", err);
      set({ loadingLobby: false, error: "Failed to load contest" });
    }
  },

  registerForContest: async (contestId) => {
    await axios.post(`/contest/${contestId}/register`);
    const current = get().activeContest;
    if (current) set({ activeContest: { ...current, isRegistered: true } });
  },

  fetchWorkspace: async (contestId) => {
    set({ loadingWorkspace: true, error: null });
    try {
      const res = await axios.get(`/contest/${contestId}/workspace`);
      set({ workspace: res.data, loadingWorkspace: false });
    } catch (err) {
      console.error("Failed to fetch workspace:", err);
      set({ loadingWorkspace: false, error: "Failed to load workspace" });
    }
  },

  fetchLeaderboard: async (contestId, page = 1, search = "") => {
    set({ loadingLeaderboard: true, error: null });
    try {
      const res = await axios.get(`/contest/leaderboard/${contestId}`, { params: { page, search } });
      const rows = res.data.leaderboard as LeaderboardRow[];
      set((state) => ({
        leaderboardRows: page === 1 ? rows : [...state.leaderboardRows, ...rows],
        leaderboardTotal: res.data.total,
        leaderboardIsFrozen: res.data.isFrozen,
        leaderboardProblemLabels: res.data.problemLabels,
        loadingLeaderboard: false,
      }));
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      set({ loadingLeaderboard: false, error: "Failed to load leaderboard" });
    }
  },

  fetchProfile: async (userId) => {
    set({ loadingProfile: true, error: null });
    try {
      const res = await axios.get(`/contest/profile/${userId}`);
      set({ profile: res.data, loadingProfile: false });
    } catch (err) {
      console.error("Failed to fetch contest profile:", err);
      set({ loadingProfile: false, error: "Failed to load profile" });
    }
  },

  fetchJourney: async (userId) => {
    set({ loadingJourney: true, error: null });
    try {
      const res = await axios.get(`/contest/journey/${userId}`);
      set({ journey: res.data.milestones, loadingJourney: false });
    } catch (err) {
      console.error("Failed to fetch contest journey:", err);
      set({ loadingJourney: false, error: "Failed to load journey" });
    }
  },

  fetchAchievementCatalog: async () => {
    const cached = get().achievementCatalog;
    if (cached.length > 0) return cached;
    try {
      const res = await axios.get("/contest/achievements/catalog");
      const catalog = res.data.achievements as AchievementCatalogEntry[];
      set({ achievementCatalog: catalog });
      return catalog;
    } catch (err) {
      console.error("Failed to fetch achievement catalog:", err);
      return [];
    }
  },
}));

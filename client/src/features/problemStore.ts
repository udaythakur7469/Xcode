import { create } from "zustand";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Problem {
  title: string;
  difficulty: "easy" | "medium" | "hard";
  acceptanceRate: number;
  solved: boolean;
}

interface ProblemDetails {
  id: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  examples: { input: string; output: string; explanation: string }[];
  testCases: { input: string; expectedOutput: string }[];
  likes?: number;
  dislikes?: number;
  userReaction?: "like" | "dislike" | null;
  hints: string[];
  problemStats?: {
    totalAttempts: number;
    totalSolved: number;
    acceptanceRate: number;
  };
}

interface EditorialData {
  id: number;
  bruteForce: string;
  bruteForceCode: string;
  better: string;
  betterCode: string;
  optimal: string;
  optimalCode: string;
  videoUrl: string;
}

interface TestCaseData {
  id: number;
  userInput: string;
  userExpectedOutput: string;
}

interface TestCases {
  message: string;
  testCases: TestCaseData[];
  count: number;
}

interface Problemdata {
  problem: ProblemDetails | null;
  problems: Problem[];
  searchResults: Problem[];
  editorial: null;
  testCases: TestCases | null;
  isLoading: boolean;
  isReacting: boolean;
  isLoadingTestCases: boolean;
  error: any | null;
  testCasesError: any | null;
  difficultyFilter: "easy" | "medium" | "hard" | null;
  statusFilter: "solved" | "unsolved" | null;
  tagsFilter: string[];
  pagination: {
    currentPage: number;
    totalPages: number | null;
    totalProblems: number | null;
  };

  createProblem: (problem: ProblemDetails) => Promise<void>;
  getPaginatedProblems: (page: number) => Promise<void>;
  searchProblems: (query: string) => Promise<void>;
  getProblemByTitle: (title: string) => Promise<ProblemDetails>;
  setDifficultyFilter: (difficulty: "easy" | "medium" | "hard" | null) => void;
  setStatusFilter: (status: "solved" | "unsolved" | null) => void;
  setTagsFilter: (tags: string[]) => void;
  getEditorialsByTitle: (title: string) => Promise<EditorialData>;
  getTestCasesByTitle: (title: string) => Promise<void>;
  reactToProblem: (title: string, action: "like" | "dislike") => Promise<any>;
  refreshProblemLikesAndDislikes: (title: string) => Promise<any>;
}

export const useProblemStore = create<Problemdata>()((set, get) => ({
  problems: [],
  searchResults: [],
  problem: null,
  editorial: null,
  testCases: null,
  isLoading: false,
  isReacting: false,
  isLoadingTestCases: false,
  testCasesError: null,
  error: null,
  difficultyFilter: null,
  statusFilter: null,
  tagsFilter: [],
  pagination: {
    currentPage: 1,
    totalPages: null,
    totalProblems: null,
  },

  createProblem: async (createProblemData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${API_URL}/problem/createProblem`,
        createProblemData,
      );
      set({ isLoading: false, error: null, problem: response.data });
      console.log("Problem created:", response.data);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Error creating problem";
      set({ error: errMsg, isLoading: false });
      throw error;
    }
  },

  setTagsFilter: (tags) => {
    set({ tagsFilter: tags });
    // Refetch problems with the new tags filter
    get().getPaginatedProblems(get().pagination.currentPage);
  },

  setDifficultyFilter: (difficulty) => {
    set({ difficultyFilter: difficulty });
    // Refetch problems with the new difficulty filter
    get().getPaginatedProblems(get().pagination.currentPage);
  },
  setStatusFilter: (status) => {
    set({ statusFilter: status });
    // Refetch problems with the new status filter
    get().getPaginatedProblems(get().pagination.currentPage);
  },

  getPaginatedProblems: async (page: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/problem/getProblems`, {
        params: {
          page,
          difficulty: get().difficultyFilter, // Pass difficultyFilter to the backend
          status: get().statusFilter,
          tags: get().tagsFilter.join(","),
        },
      });

      set({
        isLoading: false,
        problems: response.data.data,
        pagination: {
          currentPage: page,
          totalPages: response.data.pagination.totalPages,
          totalProblems: response.data.pagination.totalProblems,
        },
      });
      console.log("Paginated problems fetched:", response.data.data);
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while fetching problems.";
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  searchProblems: async (query) => {
    set({ isLoading: true, error: null });

    try {
      if (query.trim() === "") {
        set({ searchResults: [], isLoading: false });
        return;
      }
      const response = await axios.get(`${API_URL}/problem/searchProblems`, {
        params: { query },
      });
      set({ searchResults: response.data, isLoading: false });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to search problems";
      set({ error: errMsg, isLoading: false });
    }
  },

  refreshProblemLikesAndDislikes: async (title: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/problem/getProblemReactions`,
        {
          params: { title },
        },
      );

      // Get the current problem and update only the likes, dislikes and userReaction
      const currentProblem = get().problem;
      if (currentProblem && currentProblem.title === title) {
        set({
          problem: {
            ...currentProblem,
            likes: response.data.likes,
            dislikes: response.data.dislikes,
            userReaction: response.data.userReaction,
          },
        });
      }

      return response.data;
    } catch (error: any) {
      console.error("Error refreshing reactions:", error);
      throw new Error("Failed to refresh reactions");
    }
  },
  getProblemByTitle: async (title: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch the problem details
      const response = await axios.get(`${API_URL}/problem/problemDetail`, {
        params: { title },
      });

      // Fetch the latest likes and dislikes separately
      let reactionData = { likes: 0, dislikes: 0, userReaction: null };
      try {
        const reactionResponse = await axios.get(
          `${API_URL}/problem/getProblemReactions`,
          {
            params: { title },
          },
        );
        reactionData = reactionResponse.data;
      } catch (reactionError) {
        console.error("Error fetching reactions:", reactionError);
        // Continue with default values if this fails
      }

      // Combine problem data with the latest reaction data
      const problemWithReactions = {
        ...response.data,
        likes: reactionData.likes,
        dislikes: reactionData.dislikes,
        userReaction: reactionData.userReaction,
      };

      set({ isLoading: false, error: null, problem: problemWithReactions });
      return problemWithReactions;
    } catch (error: any) {
      console.error("Error fetching problem:", error.response?.data);
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while fetching the problem.";
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  getEditorialsByTitle: async (title: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/problem/getEditorials`, {
        params: { title }, // Send title as a query parameter
      });

      console.log("editorial", response.data);
      set({ isLoading: false, error: null, editorial: response.data });
      return response.data; // Return the problem details
    } catch (error: any) {
      console.error("Error fetching editorial:", error.response?.data); // Debug log
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while fetching the editorial.";
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },
  getTestCasesByTitle: async (title: string) => {
    set({ isLoadingTestCases: true, testCasesError: null });

    try {
      const response = await axios.get(`${API_URL}/problem/getTestCases`, {
        params: { title },
      });

      set({
        isLoadingTestCases: false,
        testCasesError: null,
        testCases: response.data,
      });

      return response.data;
    } catch (testCasesError: any) {
      console.error(
        "Error fetching test cases:",
        testCasesError.response?.data,
      ); // Debug log
      const errMsg =
        testCasesError.response?.data?.message ||
        "An error occurred while fetching the test cases.";
      set({ testCasesError: errMsg, isLoadingTestCases: false });
      throw new Error(errMsg);
    }
  },

  reactToProblem: async (title: string, action: "like" | "dislike") => {
    set({ error: null });

    const currentProblem = get().problem;

    // Nothing to update if problem isn't in the store yet
    if (!currentProblem || currentProblem.title !== title) return;

    // ── Step 1: Snapshot for rollback ──────────────────────────────────────
    const snapshot = currentProblem;

    // ── Step 2: Calculate optimistic state ────────────────────────────────
    const prevReaction = currentProblem.userReaction ?? null;
    const isSameAction = prevReaction === action;
    const isSwitch = prevReaction !== null && prevReaction !== action;

    // New userReaction: toggle off if same, switch/set otherwise
    const newReaction: "like" | "dislike" | null = isSameAction ? null : action;

    // Delta for likes
    let likesDelta = 0;
    if (action === "like") {
      likesDelta = isSameAction ? -1 : 1; // toggle off → -1, add/switch → +1
    } else if (isSwitch && prevReaction === "like") {
      likesDelta = -1; // switching away from like
    }

    // Delta for dislikes
    let dislikesDelta = 0;
    if (action === "dislike") {
      dislikesDelta = isSameAction ? -1 : 1; // toggle off → -1, add/switch → +1
    } else if (isSwitch && prevReaction === "dislike") {
      dislikesDelta = -1; // switching away from dislike
    }

    const currentLikes = currentProblem.likes ?? 0;
    const currentDislikes = currentProblem.dislikes ?? 0;

    // ── Step 3: Apply optimistic update ───────────────────────────────────
    set({
      problem: {
        ...currentProblem,
        likes: Math.max(0, currentLikes + likesDelta),
        dislikes: Math.max(0, currentDislikes + dislikesDelta),
        userReaction: newReaction,
      },
      isReacting: true,
    });

    // ── Step 4: Fire API call ──────────────────────────────────────────────
    try {
      const response = await axios.post(
        `${API_URL}/problem/reaction`,
        { action },
        { params: { title } },
      );

      // ── Step 5a: Reconcile with server truth ──────────────────────────
      const latestProblem = get().problem;
      if (latestProblem && latestProblem.title === title) {
        set({
          problem: {
            ...latestProblem,
            likes: response.data.likes,
            dislikes: response.data.dislikes,
            userReaction: response.data.message.includes("removed")
              ? null
              : action,
          },
          isReacting: false,
        });
      }

      return response.data;
    } catch (error: any) {
      // ── Step 5b: Roll back on failure ─────────────────────────────────
      const errMsg =
        error.response?.data?.message || "Error processing reaction";
      set({
        problem: snapshot,
        isReacting: false,
        error: errMsg,
      });
      throw error;
    }
  },
}));

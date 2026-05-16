import axios from "@/lib/axiosInstance";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Enums ───────────────────────────────────────────────────────────────────

enum interviewType {
  BEHAVIORAL = "BEHAVIORAL",
  TECHNICAL = "TECHNICAL",
  MIXED = "MIXED",
}

enum Verdict {
  NOT_RECOMMENDED = "NOT_RECOMMENDED",
  DO_NOT_HIRE = "DO_NOT_HIRE",
  PREFER_NOT_TO_HIRE = "PREFER_NOT_TO_HIRE",
  WORTH_CONSIDERING = "WORTH_CONSIDERING",
  RECOMMENDED = "RECOMMENDED",
  MUST_HIRE = "MUST_HIRE",
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export interface Interview {
  id: number | null;
  role: string;
  type: interviewType;
  techStack: string[];
  level: string;
  amount: number;
  questions: string[];
  finalized: boolean;
  feedbackFinalized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShowInterviewData {
  id: string | number;
  role: string;
  type: interviewType;
  techStack: string[];
  finalized: boolean;
  feedbackFinalized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryScore {
  id: number | null;
  feedbackId: number | null;
  name: string;
  score: number | null;
  comment: string;
}

// ─── NEW types ───────────────────────────────────────────────────────────────

export interface QuestionScore {
  id: number | null;
  feedbackId: number | null;
  questionNumber: number;
  questionText: string;
  score: number;
  comment: string;
}

export type KeyMomentType = "BEST" | "WEAKEST" | "NOTABLE";

export interface KeyMoment {
  id: number | null;
  feedbackId: number | null;
  type: KeyMomentType;
  questionNumber: number;
  questionText: string;
  quote: string;
  annotation: string;
  timestampLabel: string;
}

export type TopicPriority = "CRITICAL" | "IMPORTANT" | "RECOMMENDED";

export interface RecommendedTopic {
  id: number | null;
  feedbackId: number | null;
  topic: string;
  reason: string;
  priority: TopicPriority;
  tags: string[];
}

export interface Feedback {
  id: number | null;
  interviewId: number | null;
  userId: number | null;
  totalScore: number | null;
  strengths: string[] | null;
  areasForImprovement: string[] | null;
  finalAssessment: string | null;
  finalVerdict: Verdict | null;
  categoryScores: CategoryScore[] | null;
  // NEW
  candidateTalkRatio: number | null;
  questionScores: QuestionScore[] | null;
  keyMoments: KeyMoment[] | null;
  recommendedTopics: RecommendedTopic[] | null;
  createdAt: string;
  updatedAt: string;
}

// ─── History types (Option A + B) ────────────────────────────────────────────

export interface FeedbackHistoryEntry {
  id: number;
  interviewId: number;
  totalScore: number;
  finalVerdict: Verdict;
  createdAt: string;
  categoryScores: { name: string; score: number }[];
}

export interface FeedbackHistoryData {
  history: FeedbackHistoryEntry[];
  platformAvg: number;
  userAvg: number;
  percentile: number;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface InterviewData {
  userInterviews: ShowInterviewData[];
  latestInterviews: ShowInterviewData[];
  interview: Interview | null;
  feedback: Feedback | null;
  feedbackHistory: FeedbackHistoryData | null;
  interviewError: string | null;
  isLoadingUserInterviews: boolean;
  isLoadingLatestInterviews: boolean;
  isLoadingInterviewDetails: boolean;
  isLoadingFeedback: boolean;
  isLoadingFeedbackHistory: boolean;
  message: string | null;
  success: boolean;

  getInterviewsByUserId: () => Promise<void>;
  getLatestInterviews: () => Promise<void>;
  getInterviewDetails: (id: number) => Promise<void>;
  getFeedback: (
    id: number | null,
    transcript: SavedMessage[] | null,
  ) => Promise<void>;
  getFeedbackByInterviewId: (
    id: number,
    source: "user" | "all" | null,
  ) => Promise<void>;
  // NEW
  getFeedbackHistory: (interviewId: number) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useInterviewStore = create<InterviewData>((set) => ({
  userInterviews: [],
  latestInterviews: [],
  interview: null,
  feedback: null,
  feedbackHistory: null,
  interviewError: null,
  isLoadingUserInterviews: false,
  isLoadingLatestInterviews: false,
  isLoadingInterviewDetails: false,
  isLoadingFeedback: false,
  isLoadingFeedbackHistory: false,
  message: null,
  success: false,

  getInterviewsByUserId: async () => {
    set({ isLoadingUserInterviews: true, interviewError: null });
    try {
      const response = await axios.get(
        `${API_URL}/interview/getInterviewsByUserId`,
      );
      set({ userInterviews: response.data, isLoadingUserInterviews: false });
    } catch (interviewError: any) {
      const errMsg =
        interviewError.response?.data?.message ||
        "Error fetching user interviews";
      set({ interviewError: errMsg, isLoadingUserInterviews: false });
      throw interviewError;
    }
  },

  getLatestInterviews: async () => {
    set({ isLoadingLatestInterviews: true, interviewError: null });
    try {
      const response = await axios.get(
        `${API_URL}/interview/getLatestInterviews`,
      );
      set({
        latestInterviews: response.data,
        isLoadingLatestInterviews: false,
      });
    } catch (interviewError: any) {
      const errMsg =
        interviewError.response?.data?.message ||
        "Error fetching latest interviews";
      set({ interviewError: errMsg, isLoadingLatestInterviews: false });
      throw interviewError;
    }
  },

  getInterviewDetails: async (id: number) => {
    set({ isLoadingInterviewDetails: true, interviewError: null });
    try {
      const response = await axios.get(
        `${API_URL}/interview/getInterviewDetails`,
        { params: { id } },
      );
      set({
        interview: response.data,
        isLoadingInterviewDetails: false,
        success: true,
      });
    } catch (interviewError: any) {
      const errMsg =
        interviewError.response?.data?.message ||
        "Error fetching interview details";
      set({
        interviewError: errMsg,
        isLoadingLatestInterviews: false,
        success: false,
      });
      throw interviewError;
    }
  },

  getFeedback: async (id: number | null, transcript: SavedMessage[] | null) => {
    set({ isLoadingFeedback: true, interviewError: null });
    try {
      const response = await axios.post(
        `${API_URL}/interview/generateFeedback`,
        { id, transcript },
      );
      const feedbackData = response.data;
      set({
        feedback: feedbackData.feedback,
        success: feedbackData.success,
        isLoadingFeedback: false,
      });
      return feedbackData;
    } catch (interviewError: any) {
      const errMsg =
        interviewError.response?.data?.message || "Error fetching feedback";
      set({
        interviewError: errMsg,
        isLoadingLatestInterviews: false,
        success: false,
      });
      throw interviewError;
    }
  },

  getFeedbackByInterviewId: async (
    id: number,
    source: "user" | "all" | null,
  ) => {
    set({ isLoadingFeedback: true, interviewError: null });
    try {
      const response = await axios.get(
        `${API_URL}/interview/getFeedbackByInterviewId`,
        { params: { id, source } },
      );
      set({ feedback: response.data, isLoadingFeedback: false });
    } catch (interviewError: any) {
      const errMsg =
        interviewError.response?.data?.message ||
        "Error fetching feedback details";
      set({
        interviewError: errMsg,
        isLoadingLatestInterviews: false,
        success: false,
      });
      throw interviewError;
    }
  },

  // NEW — fetch score history + platform stats for charts
  getFeedbackHistory: async (interviewId: number) => {
    set({ isLoadingFeedbackHistory: true, interviewError: null });
    try {
      const response = await axios.get(
        `${API_URL}/interview/getFeedbackHistory`,
        { params: { interviewId } },
      );
      set({ feedbackHistory: response.data, isLoadingFeedbackHistory: false });
    } catch (interviewError: any) {
      const errMsg =
        interviewError.response?.data?.message ||
        "Error fetching feedback history";
      set({ interviewError: errMsg, isLoadingFeedbackHistory: false });
      // Don't throw — history failing shouldn't break the whole page
    }
  },
}));

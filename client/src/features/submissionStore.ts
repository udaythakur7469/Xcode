import { create } from "zustand";
import axios from "axios";
import { User } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

axios.defaults.withCredentials = true;

// Define the Submission interface based on your Prisma schema
export interface Submission {
  id: number;
  problemId: number;
  problem: {
    title: string;
    difficulty: "easy" | "medium" | "hard";
  };
  userId: number;
  user?: User;
  code: string;
  language: string;
  status: string;
  runtime: number;
  memory: number;
  testCasesPassed: number;
  totalTestCases: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number | null;
  totalSubmissions: number | null;
}

export interface RunCodeSuccess {
  message: string;
  stdout: string;
  time: string;
  memory: number;
  testCase: {
    input: string;
    userOutput: string;
  };
}

export interface SubmitCodeSuccess {
  message: string; // "All test cases passed"
  code: string;
  language: string;
  runtimeInMilliseconds: number;
  memoryInMegabytes: number;
  testCasesPassed: number;
  totalTestCases: number;
}

export interface RunCodeError {
  error: string;
  stderr: string | null;
  compile_output: string;
  errorInfo: ErrorInfo[];
}

export interface SubmitCodeError {
  message: string; // "Code failed for a test case"
  failedTestCase: FailedTestCase;
  code: string;
  language: string;
  runtimeInMilliseconds: number;
  memoryInMegabytes: number;
  testCasesPassed: number;
  totalTestCases: number;
}

export interface ErrorInfo {
  file: string;
  line: number;
  column: number;
  type: string;
  message: string;
}

export interface FailedTestCase {
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  stderr: string | null;
  runtime: number;
  memory: number;
}

export type RunCodeResponse = RunCodeSuccess | RunCodeError;

export type SubmitCodeResponse = SubmitCodeSuccess | SubmitCodeError;

interface SubmissionStore {
  baseCode: string | null;
  isLoading: boolean;
  error: string | null;
  isBaseCodeLoading: boolean;
  baseCodeError: string | null;
  userSubmissions: Submission[];
  allSubmissions: Submission[];
  submissionPagination: PaginationState;
  allSubmissionsPagination: PaginationState;
  runCodeResult: RunCodeResponse | null;
  submitCodeResult: SubmitCodeResponse | null;
  isRunningCode: boolean;
  isSubmittingCode: boolean;
  fetchBaseClassCode: (problemId: number, language: string) => Promise<void>;
  getUserSubmissions: (page: number, problemTitle?: string) => Promise<void>;
  getAllSubmissions: (problemTitle: string, page: number) => Promise<void>;
  runCode: (
    language: string,
    code: string,
    problemTitle: string
  ) => Promise<void>;
  submitCode: (
    language: string,
    code: string,
    problemTitle: string
  ) => Promise<void>;
  clearRunCodeResult: () => void;
  clearSubmitCodeResult: () => void;
}

export const useSubmissionStore = create<SubmissionStore>((set) => ({
  baseCode: null,
  isLoading: false,
  error: null,
  isBaseCodeLoading: false,
  baseCodeError: null,
  userSubmissions: [],
  allSubmissions: [],
  submissionPagination: {
    currentPage: 1,
    totalPages: null,
    totalSubmissions: null,
  },
  allSubmissionsPagination: {
    currentPage: 1,
    totalPages: null,
    totalSubmissions: null,
  },
  runCodeResult: null,
  submitCodeResult: null,
  isRunningCode: false,
  isSubmittingCode: false,

  // Function to fetch base class code
  fetchBaseClassCode: async (problemId: number, language: string) => {
    set({ isBaseCodeLoading: true, baseCodeError: null });
    try {
      const response = await axios.get(`${API_URL}/submission/get-base-code`, {
        params: { problemId, language }, // Send problemId and language as query parameters
      });
      set({ baseCode: response.data.baseClassCode, isBaseCodeLoading: false });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to fetch base class code";
      set({ baseCodeError: errMsg, isBaseCodeLoading: false });
      throw error;
    }
  },

  // Get user submissions (either all or filtered by problem title)
  getUserSubmissions: async (page: number, problemTitle?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = { page };

      // Add problem title to params if provided
      if (problemTitle) {
        params.title = problemTitle;
      }

      const response = await axios.get(
        `${API_URL}/submission/getUserSubmissions`,
        { params }
      );

      set({
        userSubmissions: response.data.data,
        isLoading: false,
        submissionPagination: {
          currentPage: page,
          totalPages: response.data.pagination.totalPages,
          totalSubmissions: response.data.pagination.totalSubmissions,
        },
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while fetching user submissions.";
      set({ error: errMsg, isLoading: false });
    }
  },

  // Get all submissions for a specific problem
  getAllSubmissions: async (problemTitle: string, page: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_URL}/submission/getAllSubmissions`,
        {
          params: {
            title: problemTitle,
            page,
          },
        }
      );

      console.log(response);

      set({
        allSubmissions: response.data.data,
        isLoading: false,
        allSubmissionsPagination: {
          currentPage: page,
          totalPages: response.data.pagination.totalPages,
          totalSubmissions: response.data.pagination.totalSubmissions,
        },
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while fetching all submissions.";
      set({ error: errMsg, isLoading: false });
    }
  },
  runCode: async (language: string, code: string, problemTitle: string) => {
    set({ isRunningCode: true, error: null, runCodeResult: null });
    try {
      const response = await axios.post(
        `${API_URL}/submission/runCode`,
        {
          language,
          code,
        },
        {
          params: {
            title: problemTitle,
          },
        }
      );

      set({
        runCodeResult: response.data as RunCodeSuccess,
        isRunningCode: false,
      });
    } catch (error: any) {
      const errorData = error.response?.data as RunCodeError;
      set({
        runCodeResult: errorData || {
          error: "Failed to run code",
          stderr: null,
          compile_output: "",
          errorInfo: [],
        },
        isRunningCode: false,
      });
    }
  },
  submitCode: async (language: string, code: string, problemTitle: string) => {
    set({ isSubmittingCode: true, error: null, submitCodeResult: null });
    try {
      const response = await axios.post(
        `${API_URL}/submission/submitCode`,
        {
          language,
          code,
        },
        {
          params: {
            title: problemTitle,
          },
        }
      );

      set({
        submitCodeResult: response.data as SubmitCodeSuccess,
        isSubmittingCode: false,
      });
    } catch (error: any) {
      const errorData = error.response?.data as SubmitCodeError;
      set({
        submitCodeResult: errorData || {
          message: "Failed to submit code",
          failedTestCase: {
            input: "",
            expectedOutput: "",
            actualOutput: null,
            stderr: null,
            runtime: 0,
            memory: 0,
          },
          code: "",
          language: "",
          runtimeInMilliseconds: 0,
          memoryInMegabytes: 0,
          testCasesPassed: 0,
          totalTestCases: 0,
        },
        isSubmittingCode: false,
      });
    }
  },

  // Clear run code result
  clearRunCodeResult: () => {
    set({ runCodeResult: null });
  },

  // Clear submit code result
  clearSubmitCodeResult: () => {
    set({ submitCodeResult: null });
  },
}));

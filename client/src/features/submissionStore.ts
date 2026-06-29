import axios from "@/lib/axiosInstance";
import { create } from "zustand";
import { User } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Submission {
  id: number;
  problemId: number;
  problem: { title: string; difficulty: "easy" | "medium" | "hard" };
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

// ─── Per-test-case result (new) ───────────────────────────────────────────────

export interface TestCaseResult {
  index: number; // 1-based
  status: "accepted" | "wrong_answer";
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  runtimeInMilliseconds: number;
  memoryInMegabytes: number;
}

// ─── Runtime distribution bucket (new) ───────────────────────────────────────

export interface RuntimeBucket {
  bucketLabel: string; // e.g. "0-10ms"
  count: number;
  isUserBucket: boolean;
}

// ─── runCode types ────────────────────────────────────────────────────────────

export interface RunCodeSuccess {
  message: string;
  stdout: string;
  time: string; // seconds as string e.g. "0.004"
  memory: number; // KB
  status: "accepted";
  language: string;
  code: string;
  submittedAt: string;
  totalTestCasesInProblem: number;
  testCase: { input: string; userOutput: string | null };
}

export interface RunCodeError {
  success: false;
  status: "runtime_error" | "compilation_error" | "time_limit_exceeded";
  statusDescription: string;
  stderr: string | null;
  compile_output: string | null;
  errorInfo: ErrorInfo[] | null;
  message?: string;
  time?: string | null;
  memory?: number | null;
  language: string;
  code: string;
  submittedAt: string;
  totalTestCasesInProblem: number;
  testCase: { input: string; userOutput: string | null } | null;
}

export type RunCodeResponse = RunCodeSuccess | RunCodeError | NetworkError;

// ─── submitCode types ─────────────────────────────────────────────────────────

export interface SubmitCodeSuccess {
  success: true;
  message: string;
  language: string;
  code: string;
  runtimeInMilliseconds: number;
  memoryInMegabytes: number;
  testCasesPassed: number;
  totalTestCases: number;
  passRate: string; // e.g. "80.0"
  avgRuntimeInMilliseconds: number;
  submittedAt: string;
  testCaseResults: TestCaseResult[];
  percentile: number; // only on success
  runtimeDistribution: RuntimeBucket[]; // only on success
}

export interface FailedTestCase {
  input: string | null;
  expectedOutput: string | null;
  actualOutput: string | null;
  status:
    | "wrong_answer"
    | "runtime_error"
    | "compilation_error"
    | "time_limit_exceeded";
  statusDescription: string;
  message?: string | null;
  stderr: string | null;
  compile_output?: string | null;
  errorInfo?: ErrorInfo[] | null;
  runtime: number;
  memory: number;
}

export interface SubmitCodeError {
  message: string;
  failedTestCase?: FailedTestCase | null;
  language: string;
  code: string;
  runtimeInMilliseconds: number;
  memoryInMegabytes: number;
  testCasesPassed: number;
  totalTestCases: number;
  passRate: string;
  avgRuntimeInMilliseconds: number;
  submittedAt: string;
  testCaseResults: TestCaseResult[];
}

export type SubmitCodeResponse =
  | SubmitCodeSuccess
  | SubmitCodeError
  | NetworkError;

export interface ErrorInfo {
  file: string;
  line: number;
  column: number;
  type: string;
  message: string;
}

export interface NetworkError {
  _networkError: true;
  message: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

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
    problemTitle: string,
  ) => Promise<void>;
  submitCode: (
    language: string,
    code: string,
    problemTitle: string,
  ) => Promise<void>;
  clearRunCodeResult: () => void;
  clearSubmitCodeResult: () => void;
}

let runCodeAbortController: AbortController | null = null;
let submitCodeAbortController: AbortController | null = null;

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

  fetchBaseClassCode: async (problemId, language) => {
    set({ isBaseCodeLoading: true, baseCodeError: null });
    try {
      const response = await axios.get(`${API_URL}/submission/get-base-code`, {
        params: { problemId, language },
      });
      set({ baseCode: response.data.baseClassCode, isBaseCodeLoading: false });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to fetch base class code";
      set({ baseCodeError: errMsg, isBaseCodeLoading: false });
      throw error;
    }
  },

  getUserSubmissions: async (page, problemTitle) => {
    set({ isLoading: true, error: null });
    try {
      const params: any = { page };
      if (problemTitle) params.title = problemTitle;
      const response = await axios.get(
        `${API_URL}/submission/getUserSubmissions`,
        { params },
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

  getAllSubmissions: async (problemTitle, page) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${API_URL}/submission/getAllSubmissions`,
        {
          params: { title: problemTitle, page },
        },
      );
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

  runCode: (language, code, problemTitle) => {
    const previousRunController = runCodeAbortController;
    runCodeAbortController = new AbortController();
    previousRunController?.abort();

    set({ isRunningCode: true, error: null, runCodeResult: null });
    const controller = runCodeAbortController;
    return new Promise<void>((resolve) => {
      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(Object.assign(new Error("canceled"), { __cancel: true })),
        );
      });
      Promise.race([
        axios.post(
          `${API_URL}/submission/runCode`,
          { language, code },
          { params: { title: problemTitle }, signal: controller.signal },
        ),
        abortPromise,
      ])
        .then((response) => {
          set({
            runCodeResult: response.data as RunCodeSuccess,
            isRunningCode: false,
          });
          resolve();
        })
        .catch((error: any) => {
          if (
            axios.isCancel(error) ||
            error?.__cancel ||
            error?.code === "ERR_CANCELED"
          ) {
            set({ isRunningCode: false });
          } else {
            const payload: RunCodeResponse = error.response?.data ?? {
              _networkError: true,
              message:
                "Could not reach the server. Check your connection and try again.",
            };
            set({ runCodeResult: payload, isRunningCode: false });
          }
          resolve();
        });
    });
  },

  submitCode: (language, code, problemTitle) => {
    const previousSubmitController = submitCodeAbortController;
    submitCodeAbortController = new AbortController();
    previousSubmitController?.abort();

    set({ isSubmittingCode: true, error: null, submitCodeResult: null });
    const controller = submitCodeAbortController;
    return new Promise<void>((resolve) => {
      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(Object.assign(new Error("canceled"), { __cancel: true })),
        );
      });
      Promise.race([
        axios.post(
          `${API_URL}/submission/submitCode`,
          { language, code },
          { params: { title: problemTitle }, signal: controller.signal },
        ),
        abortPromise,
      ])
        .then((response) => {
          set({
            submitCodeResult: response.data as SubmitCodeSuccess,
            isSubmittingCode: false,
          });
          resolve();
        })
        .catch((error: any) => {
          if (
            axios.isCancel(error) ||
            error?.__cancel ||
            error?.code === "ERR_CANCELED"
          ) {
            set({ isSubmittingCode: false });
          } else {
            const payload: SubmitCodeResponse = error.response?.data ?? {
              _networkError: true,
              message:
                "Could not reach the server. Check your connection and try again.",
            };
            set({ submitCodeResult: payload, isSubmittingCode: false });
          }
          resolve();
        });
    });
  },

  clearRunCodeResult: () => set({ runCodeResult: null }),
  clearSubmitCodeResult: () => set({ submitCodeResult: null }),
}));

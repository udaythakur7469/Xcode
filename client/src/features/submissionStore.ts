import axios from "@/lib/axiosInstance";
import { create } from "zustand";
import { User } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// runCode/submitCode wait on a queued judge job. The backend's own
// enqueueAndWait caps that wait at 40s and returns a structured 500 if it
// times out, so this is set to 45s - just past the backend's cap - so the
// backend's own error response wins first when the server is alive. If the
// connection is hung entirely (server down, dropped socket, unresponsive
// EC2 instance) this is what forces the request to reject instead of
// leaving isRunningCode/isSubmittingCode stuck true and the loader
// spinning forever.
const RUN_SUBMIT_TIMEOUT_MS = 45000;

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
  status:
    | "wrong_answer"
    | "runtime_error"
    | "compilation_error"
    | "time_limit_exceeded";
  statusDescription: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  errorInfo?: ErrorInfo[] | null;
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
  totalTestCasesEvaluated: number;
  passRate: string;
  avgRuntimeInMilliseconds: number;
  submittedAt: string;
  testCaseResults: TestCaseResult[];
  percentile: number;
  runtimeDistribution: RuntimeBucket[];
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
  status?: string | null;
  statusDescription?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  errorInfo?: ErrorInfo[] | null;
  language: string;
  code: string;
  runtimeInMilliseconds: number;
  memoryInMegabytes: number;
  testCasesPassed: number;
  totalTestCases: number;
  totalTestCasesEvaluated: number;
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
  action: "Run Code" | "Submit Code";
  language: string;
  code: string;
  attemptedAt: string;
  waitedSeconds: number;
}

// ─── sessionStorage persistence (per problem) ─────────────────────────────────
// Run results and submit results are persisted to sessionStorage so they
// survive a page reload within the same browser tab, but are naturally
// wiped when the tab/browser is closed. Each entry is keyed by problem
// title so switching problems never shows another problem's stale result.

const RUN_RESULT_PREFIX = "xcode_run_result:";
const SUBMIT_RESULT_PREFIX = "xcode_submit_result:";
const SUBMIT_TAB_OPEN_PREFIX = "xcode_submit_tab_open:";

export const getRunResultKey = (problemTitle: string) =>
  `${RUN_RESULT_PREFIX}${problemTitle}`;
export const getSubmitResultKey = (problemTitle: string) =>
  `${SUBMIT_RESULT_PREFIX}${problemTitle}`;
export const getSubmitTabOpenKey = (problemTitle: string) =>
  `${SUBMIT_TAB_OPEN_PREFIX}${problemTitle}`;

function saveToSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage unavailable (SSR / privacy mode) — ignore
  }
}

function readFromSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function removeFromSession(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// Clears every persisted piece (run result, submit result, results-tab-open
// flag) for a given problem. Called when the user navigates to a different
// problem so old results never leak into the new problem's view.
export function clearPersistedProblemResults(problemTitle: string) {
  removeFromSession(getRunResultKey(problemTitle));
  removeFromSession(getSubmitResultKey(problemTitle));
  removeFromSession(getSubmitTabOpenKey(problemTitle));
}

// Tracks which problem was last active, IN sessionStorage rather than a
// React ref. A ref only survives within one mounted component instance —
// navigating via a genuine route change (e.g. the standalone /problems
// list page, as opposed to the in-page ProblemSidebar) unmounts and
// remounts page.tsx entirely, wiping any ref. sessionStorage survives that
// remount (it's only cleared when the tab itself closes), so the "did the
// problem actually change?" check works no matter how the user navigated.
const LAST_ACTIVE_PROBLEM_KEY = "xcode_last_active_problem_title";

export function getLastActiveProblemTitle(): string | null {
  try {
    return sessionStorage.getItem(LAST_ACTIVE_PROBLEM_KEY);
  } catch {
    return null;
  }
}

export function setLastActiveProblemTitle(problemTitle: string) {
  try {
    sessionStorage.setItem(LAST_ACTIVE_PROBLEM_KEY, problemTitle);
  } catch {
    // ignore
  }
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
  runningLanguage: string | null;
  submittingLanguage: string | null;
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
  clearRunCodeResult: (problemTitle?: string) => void;
  clearSubmitCodeResult: (problemTitle?: string) => void;
  hydrateRunCodeResult: (problemTitle: string) => void;
  hydrateSubmitCodeResult: (problemTitle: string) => void;
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
  runningLanguage: null,
  submittingLanguage: null,

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

    const attemptStartedAt = Date.now();
    set({
      isRunningCode: true,
      error: null,
      runCodeResult: null,
      runningLanguage: language,
    });
    removeFromSession(getRunResultKey(problemTitle));
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
          {
            language,
            code,
          },
          {
            params: { title: problemTitle },
            signal: controller.signal,
            timeout: RUN_SUBMIT_TIMEOUT_MS,
          },
        ),
        abortPromise,
      ])
        .then((response) => {
          const result = response.data as RunCodeSuccess;
          set({
            runCodeResult: result,
            isRunningCode: false,
          });
          saveToSession(getRunResultKey(problemTitle), result);
          resolve();
        })
        .catch((error: any) => {
          if (error?.__cancel || error?.code === "ERR_CANCELED") {
            set({ isRunningCode: false });
          } else {
            const responseData = error.response?.data;
            const isServerError =
              !responseData ||
              typeof responseData !== "object" ||
              error.response?.status >= 500;
            const payload: RunCodeResponse = isServerError
              ? {
                  _networkError: true,
                  message:
                    responseData?.error ??
                    responseData?.message ??
                    "Could not reach the server. Check your connection and try again.",
                  action: "Run Code",
                  language,
                  code,
                  attemptedAt: new Date().toISOString(),
                  waitedSeconds: Math.round(
                    (Date.now() - attemptStartedAt) / 1000,
                  ),
                }
              : (responseData as RunCodeResponse);
            set({ runCodeResult: payload, isRunningCode: false });
            saveToSession(getRunResultKey(problemTitle), payload);
          }
          resolve();
        });
    });
  },

  submitCode: (language, code, problemTitle) => {
    const previousSubmitController = submitCodeAbortController;
    submitCodeAbortController = new AbortController();
    previousSubmitController?.abort();

    const attemptStartedAt = Date.now();
    set({
      isSubmittingCode: true,
      error: null,
      submitCodeResult: null,
      submittingLanguage: language,
    });
    removeFromSession(getSubmitResultKey(problemTitle));
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
          {
            language,
            code,
          },
          {
            params: { title: problemTitle },
            signal: controller.signal,
            timeout: RUN_SUBMIT_TIMEOUT_MS,
          },
        ),
        abortPromise,
      ])
        .then((response) => {
          const result = response.data as SubmitCodeSuccess;
          set({
            submitCodeResult: result,
            isSubmittingCode: false,
          });
          saveToSession(getSubmitResultKey(problemTitle), result);
          resolve();
        })
        .catch((error: any) => {
          if (error?.__cancel || error?.code === "ERR_CANCELED") {
            set({ isSubmittingCode: false });
          } else {
            const responseData = error.response?.data;
            const isServerError =
              !responseData ||
              typeof responseData !== "object" ||
              error.response?.status >= 500;
            const payload: SubmitCodeResponse = isServerError
              ? {
                  _networkError: true,
                  message:
                    responseData?.error ??
                    responseData?.message ??
                    "Could not reach the server. Check your connection and try again.",
                  action: "Submit Code",
                  language,
                  code,
                  attemptedAt: new Date().toISOString(),
                  waitedSeconds: Math.round(
                    (Date.now() - attemptStartedAt) / 1000,
                  ),
                }
              : (responseData as SubmitCodeResponse);
            set({ submitCodeResult: payload, isSubmittingCode: false });
            saveToSession(getSubmitResultKey(problemTitle), payload);
          }
          resolve();
        });
    });
  },

  clearRunCodeResult: (problemTitle) => {
    set({ runCodeResult: null });
    if (problemTitle) removeFromSession(getRunResultKey(problemTitle));
  },
  clearSubmitCodeResult: (problemTitle) => {
    set({ submitCodeResult: null });
    if (problemTitle) removeFromSession(getSubmitResultKey(problemTitle));
  },
  hydrateRunCodeResult: (problemTitle) => {
    const saved = readFromSession<RunCodeResponse>(
      getRunResultKey(problemTitle),
    );
    if (saved) set({ runCodeResult: saved });
  },
  hydrateSubmitCodeResult: (problemTitle) => {
    const saved = readFromSession<SubmitCodeResponse>(
      getSubmitResultKey(problemTitle),
    );
    if (saved) set({ submitCodeResult: saved });
  },
}));

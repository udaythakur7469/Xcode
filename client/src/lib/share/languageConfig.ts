export interface LanguageConfig {
  judge0Id: number;
  label: string; // display name, e.g. "C++"
  highlightKey: string; // react-syntax-highlighter language key
  isInterpreted: boolean; // controls the syntax-error-from-runtime-error remap
  // Unambiguous, engine-emitted strings that ONLY appear when the language
  // runtime itself detects out-of-memory and throws/reports it before dying
  // (a "soft" OOM). This is deterministic pattern matching, not a guess —
  // if this text appears in stderr, it genuinely is MLE. It will NOT catch
  // a "hard" OOM kill (the cgroup OOM killer sending SIGKILL with no
  // chance for the runtime to say anything) — that case has no reliable
  // signal available through Judge0's API and stays classified as a
  // generic runtime error. See processRuntimeError in submissionService.ts.
  oomPatterns: RegExp[];
}

export const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  cpp: {
    judge0Id: 54,
    label: "C++",
    highlightKey: "cpp",
    isInterpreted: false,
    oomPatterns: [
      /std::bad_alloc/,
      /terminate called after throwing an instance of ['"`]?std::bad_alloc['"`]?/,
    ],
  },
  java: {
    judge0Id: 62,
    label: "Java",
    highlightKey: "java",
    isInterpreted: false,
    oomPatterns: [/java\.lang\.OutOfMemoryError/],
  },
  python: {
    judge0Id: 71,
    label: "Python",
    highlightKey: "python",
    isInterpreted: true,
    oomPatterns: [/\bMemoryError\b/],
  },
  javascript: {
    judge0Id: 63,
    label: "JavaScript",
    highlightKey: "javascript",
    isInterpreted: true,
    oomPatterns: [
      /FATAL ERROR:.*JavaScript heap out of memory/,
      /Allocation failed - JavaScript heap out of memory/,
    ],
  },
};

export function getLanguageConfig(language: string): LanguageConfig | null {
  return LANGUAGE_CONFIG[language] ?? null;
}

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG);

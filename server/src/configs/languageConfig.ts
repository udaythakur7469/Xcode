export interface LanguageConfig {
  judge0Id: number;
  label: string; // display name, e.g. "C++"
  highlightKey: string; // react-syntax-highlighter language key
  isInterpreted: boolean; // controls the syntax-error-from-runtime-error remap
}

export const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  cpp: {
    judge0Id: 54,
    label: "C++",
    highlightKey: "cpp",
    isInterpreted: false,
  },
  java: {
    judge0Id: 62,
    label: "Java",
    highlightKey: "java",
    isInterpreted: false,
  },
  python: {
    judge0Id: 71,
    label: "Python",
    highlightKey: "python",
    isInterpreted: true,
  },
  javascript: {
    judge0Id: 63,
    label: "JavaScript",
    highlightKey: "javascript",
    isInterpreted: true,
  },
};

export function getLanguageConfig(language: string): LanguageConfig | null {
  return LANGUAGE_CONFIG[language] ?? null;
}

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG);

export const LANGUAGE_CONFIG = {
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
export function getLanguageConfig(language) {
    return LANGUAGE_CONFIG[language] ?? null;
}
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG);

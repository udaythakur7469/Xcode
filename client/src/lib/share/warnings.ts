import { ParsedPostData, ShareWarning, SmartSharePlatform } from "@/types/share";

// ── Detection helpers ─────────────────────────────────────────────────────

const hasTables = (markdown: string): boolean => /\|.+\|.+\|/m.test(markdown);

const hasNestedLists = (markdown: string): boolean =>
  /^[ \t]{2,}[-*]/m.test(markdown);

const hasImages = (markdown: string): boolean => /!\[.*?\]\(.*?\)/m.test(markdown);

const hasCodeWithoutLanguage = (markdown: string): boolean =>
  /^```\s*\n/m.test(markdown);

const isLargeContent = (markdown: string): boolean => markdown.length > 8000;

// ── Per-platform rules ────────────────────────────────────────────────────
// NOTE: Discussion now renders every extracted section (same as Medium/Blog/
// Notion), so it's included in the same warning scopes as the others rather
// than being treated as a "short-form" exception.

type WarningRule = {
  check: (data: ParsedPostData, raw: string) => boolean;
  message: string;
  severity: ShareWarning["severity"];
  platforms: SmartSharePlatform[];
};

const ALL_PLATFORMS: SmartSharePlatform[] = [
  "medium",
  "blog",
  "notion",
  "discussion",
];

const RULES: WarningRule[] = [
  {
    check: (_, raw) => hasTables(raw),
    message:
      "Tables (Complexity, Testing) may not render correctly on Medium — they'll appear as plain text.",
    severity: "warn",
    platforms: ["medium", "discussion"],
  },
  {
    check: (_, raw) => hasNestedLists(raw),
    message: "Deeply nested lists may lose indentation on some platforms.",
    severity: "warn",
    platforms: ["medium", "discussion", "notion"],
  },
  {
    check: (_, raw) => hasImages(raw),
    message:
      "Images are linked by URL — they'll only display if the URL is publicly accessible.",
    severity: "info",
    platforms: ALL_PLATFORMS,
  },
  {
    check: (_, raw) => hasCodeWithoutLanguage(raw),
    message: "Some code blocks have no language tag — syntax highlighting may be missing.",
    severity: "info",
    platforms: ALL_PLATFORMS,
  },
  {
    check: (_, raw) => isLargeContent(raw),
    message: "This is a long post — some platforms may truncate pasted content.",
    severity: "warn",
    platforms: ALL_PLATFORMS,
  },
  {
    check: (data) => !data.isTemplatePost,
    message:
      "This post doesn't follow the standard template — some sections may be missing. Content has been copied as-is.",
    severity: "warn",
    platforms: ALL_PLATFORMS,
  },
  {
    check: (data) => data.isTemplatePost && data.approachSteps.length === 0,
    message:
      "No approach steps were found — the Approach section may be empty or use non-standard formatting.",
    severity: "info",
    platforms: ALL_PLATFORMS,
  },
  {
    check: (data) => data.isTemplatePost && !data.code,
    message: "No primary code block was found in the Code section.",
    severity: "info",
    platforms: ALL_PLATFORMS,
  },
  {
    check: (data) => data.isTemplatePost && !data.codeExplanation,
    message:
      "No code explanation was found — the Code Explanation section may be empty or unfilled.",
    severity: "info",
    platforms: ALL_PLATFORMS,
  },
  {
    check: (data) => data.isTemplatePost && data.testCases.length === 0,
    message:
      "No filled test case rows were found in the Testing table — it may be left as the default blank template.",
    severity: "info",
    platforms: ALL_PLATFORMS,
  },
  {
    check: (data) => data.isTemplatePost && data.alternativeApproaches.length > 0,
    message:
      "This post includes alternative approaches — some platforms may benefit from splitting these into a separate section or comment.",
    severity: "info",
    platforms: ["discussion"],
  },
  {
    check: (data) => data.isTemplatePost && !!data.visualization,
    message:
      "A visualization image is included — confirm the image URL is publicly accessible before sharing.",
    severity: "info",
    platforms: ALL_PLATFORMS,
  },
];

// ── Main export ───────────────────────────────────────────────────────────

export const generateWarnings = (
  data: ParsedPostData,
  rawMarkdown: string,
  platform: SmartSharePlatform,
): ShareWarning[] => {
  return RULES.filter(
    (rule) =>
      rule.platforms.includes(platform) && rule.check(data, rawMarkdown),
  ).map((rule) => ({ message: rule.message, severity: rule.severity }));
};

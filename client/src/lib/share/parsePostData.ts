import { ParsedPostData } from "@/types/share";

// ── Heading extractor ─────────────────────────────────────────────────────
// Returns the raw text content under a heading (until the next same-or-higher heading).
// Trims HTML comments (<!-- ... -->) left by the template.

const extractSection = (markdown: string, headingPattern: RegExp): string => {
  const match = markdown.match(headingPattern);
  if (!match || match.index === undefined) return "";

  const start = match.index + match[0].length;
  // Find next heading of same or higher level
  const headingLevel = (match[0].match(/^#+/) || [""])[0].length;
  const nextHeadingPattern = new RegExp(`^#{1,${headingLevel}}\\s`, "m");
  const rest = markdown.slice(start);
  const nextMatch = rest.match(nextHeadingPattern);
  const end = nextMatch?.index ?? rest.length;

  return rest
    .slice(0, end)
    .replace(/<!--[\s\S]*?-->/g, "") // strip template comments
    .trim();
};

// ── Bullet list parser ────────────────────────────────────────────────────
// Extracts items from `- text`, `* text`, or `1. text` lists.

const parseBulletList = (text: string): string[] => {
  const lines = text.split("\n");
  const items: string[] = [];
  for (const line of lines) {
    const match = line.match(/^[\s]*(?:[-*]|\d+\.)\s+(.+)/);
    if (match) {
      const cleaned = match[1]
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/^\[.*?\]\(.*?\)\s*/, "") // strip bare links used as placeholders
        .trim();
      if (cleaned && !isPlaceholder(cleaned)) {
        items.push(cleaned);
      }
    }
  }
  return items;
};

// ── Placeholder detector ──────────────────────────────────────────────────
// Template lines like "Describe step 1" or "Structure 1 — why it's used"
// should not appear in output.

const PLACEHOLDER_PATTERNS = [
  /^describe step \d/i,
  /^structure \d/i,
  /^why did you choose/i,
  /^what alternatives/i,
  /^initialization$/i,
  /^processing logic$/i,
  /^final result$/i,
  /^case \d/i,
  /^problem name$/i,
  /^add.*here/i,
  /^write the problem/i,
  /^tip:/i,
  /^observation \d/i,
  /^key takeaway \d/i,
];

const isPlaceholder = (text: string): boolean =>
  PLACEHOLDER_PATTERNS.some((p) => p.test(text.trim()));

// ── Code block extractor ──────────────────────────────────────────────────
// Finds the FIRST fenced code block under "# 💻 Code" heading.
// Returns { code, language }.

const extractPrimaryCode = (
  markdown: string,
): { code: string; language: string } => {
  // Find the "# 💻 Code" section
  const codeSectionMatch = markdown.match(/^#\s+💻\s+Code\s*$/m);

  if (codeSectionMatch && codeSectionMatch.index !== undefined) {
    const afterHeading = markdown.slice(
      codeSectionMatch.index + codeSectionMatch[0].length,
    );
    const fenceMatch = afterHeading.match(/```(\w*)\n([\s\S]*?)```/);
    if (fenceMatch) {
      return {
        language: fenceMatch[1] || "text",
        code: fenceMatch[2].trim(),
      };
    }
  }

  // Fallback: first code block in the entire document
  const fallback = markdown.match(/```(\w*)\n([\s\S]*?)```/);
  if (fallback) {
    return { language: fallback[1] || "text", code: fallback[2].trim() };
  }

  return { code: "", language: "text" };
};

// ── Complexity extractor ──────────────────────────────────────────────────
// Reads a markdown table under "# ⏱ Complexity Analysis".

const extractComplexity = (
  markdown: string,
): { time: string; space: string } => {
  const section = extractSection(markdown, /^#\s+⏱\s+Complexity Analysis\s*$/m);

  // Try table rows: | Time Complexity | O(n) |
  const timeMatch = section.match(/[Tt]ime[^|]*\|([^|]+)\|/);
  const spaceMatch = section.match(/[Ss]pace[^|]*\|([^|]+)\|/);

  const clean = (s: string) =>
    s
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/e\.g\.\s*/gi, "")
      .trim();

  return {
    time: timeMatch ? clean(timeMatch[1]) : "",
    space: spaceMatch ? clean(spaceMatch[1]) : "",
  };
};

// ── Related problems extractor ────────────────────────────────────────────

const extractRelatedProblems = (
  markdown: string,
): { name: string; url: string }[] => {
  const section = extractSection(markdown, /^#\s+🔗\s+Related Problems\s*$/m);
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const results: { name: string; url: string }[] = [];
  let m;
  while ((m = linkPattern.exec(section)) !== null) {
    if (m[2] !== "url" && m[1] !== "Problem Name") {
      results.push({ name: m[1], url: m[2] });
    }
  }
  return results;
};

// ── Problem link extractor ────────────────────────────────────────────────

const extractProblemLink = (markdown: string): string => {
  const section = extractSection(markdown, /^##\s+🔗\s+References\s*$/m);
  // Look for [Problem Link](url) where url is not literally "url"
  const match = section.match(/\[Problem Link\]\(([^)]+)\)/);
  if (match && match[1] !== "url") return match[1];
  // fallback: first real URL in section
  const urlMatch = section.match(/https?:\/\/[^\s)]+/);
  return urlMatch ? urlMatch[0] : "";
};

// ── Example walkthrough extractor ─────────────────────────────────────────

const extractExample = (
  markdown: string,
): { input: string; output: string; explanation: string } => {
  const section = extractSection(
    markdown,
    /^#\s+📊\s+Example Walkthrough\s*$/m,
  );

  const inputMatch = section.match(/##\s+Input[\s\S]*?```[\w]*\n([\s\S]*?)```/);
  const outputMatch = section.match(
    /##\s+Output[\s\S]*?```[\w]*\n([\s\S]*?)```/,
  );
  const explanationMatch = section.match(
    /##\s+Explanation\s*([\s\S]*?)(?:^##|$)/m,
  );

  const clean = (s: string) => s.replace(/<!--[\s\S]*?-->/g, "").trim();

  return {
    input: inputMatch ? clean(inputMatch[1]) : "",
    output: outputMatch ? clean(outputMatch[1]) : "",
    explanation: explanationMatch ? clean(explanationMatch[1]) : "",
  };
};

// ── Template detection ────────────────────────────────────────────────────
// A post is considered "template-based" if it contains at least 3 of the
// standard section headings.

const TEMPLATE_HEADINGS = [
  /^#\s+💡\s+Intuition/m,
  /^#\s+🧠\s+Approach/m,
  /^#\s+⏱\s+Complexity Analysis/m,
  /^#\s+💻\s+Code/m,
  /^#\s+📊\s+Example Walkthrough/m,
  /^#\s+⚠️\s+Edge Cases/m,
  /^#\s+📚\s+Summary/m,
];

const isTemplatePost = (markdown: string): boolean => {
  const matches = TEMPLATE_HEADINGS.filter((p) => p.test(markdown)).length;
  return matches >= 3;
};

// ── Main parser ───────────────────────────────────────────────────────────

export const parsePostData = (
  markdown: string,
  title: string,
): ParsedPostData => {
  const isTemplate = isTemplatePost(markdown);

  if (!isTemplate) {
    // Freeform post — return minimal data, formatters will use raw markdown
    return {
      title,
      problemLink: extractProblemLink(markdown),
      intuition: markdown, // pass through entire content as intuition for fallback
      approachSteps: [],
      keyDecisions: [],
      dataStructures: [],
      algorithmFlow: [],
      timeComplexity: "",
      spaceComplexity: "",
      code: extractPrimaryCode(markdown).code,
      language: extractPrimaryCode(markdown).language,
      exampleInput: "",
      exampleOutput: "",
      exampleExplanation: "",
      edgeCases: [],
      relatedProblems: [],
      summaryPoints: [],
      isTemplatePost: false,
    };
  }

  const { code, language } = extractPrimaryCode(markdown);
  const { time, space } = extractComplexity(markdown);
  const { input, output, explanation } = extractExample(markdown);

  const intuitionSection = extractSection(markdown, /^#\s+💡\s+Intuition\s*$/m);
  const approachSection = extractSection(
    markdown,
    /^##\s+Step-by-step Strategy\s*$/m,
  );
  const keyDecisionsSection = extractSection(
    markdown,
    /^##\s+Key Decisions\s*$/m,
  );
  const dataStructuresSection = extractSection(
    markdown,
    /^##\s+🧩\s+Data Structures Used\s*$/m,
  );
  const algorithmFlowSection = extractSection(
    markdown,
    /^##\s+🔁\s+Algorithm Flow\s*$/m,
  );
  const edgeCasesSection = extractSection(
    markdown,
    /^#\s+⚠️\s+Edge Cases\s*$/m,
  );
  const summarySection = extractSection(markdown, /^#\s+📚\s+Summary\s*$/m);

  // Intuition may be a blockquote ("> ...") — strip the > prefix
  const cleanIntuition = intuitionSection
    .replace(/^>\s*/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  return {
    title,
    problemLink: extractProblemLink(markdown),
    intuition: cleanIntuition || "",
    approachSteps: parseBulletList(approachSection),
    keyDecisions: parseBulletList(keyDecisionsSection),
    dataStructures: parseBulletList(dataStructuresSection),
    algorithmFlow: parseBulletList(algorithmFlowSection),
    timeComplexity: time,
    spaceComplexity: space,
    code,
    language,
    exampleInput: input,
    exampleOutput: output,
    exampleExplanation: explanation,
    edgeCases: parseBulletList(edgeCasesSection),
    relatedProblems: extractRelatedProblems(markdown),
    summaryPoints: parseBulletList(summarySection),
    isTemplatePost: true,
  };
};

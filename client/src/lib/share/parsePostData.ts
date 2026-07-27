import {
  AlternativeApproach,
  CodeExplanation,
  ParsedPostData,
  TestCaseRow,
  VisualizationData,
} from "@/types/share";

// ── Heading extractor ─────────────────────────────────────────────────────

const extractSection = (markdown: string, headingPattern: RegExp): string => {
  const match = markdown.match(headingPattern);
  if (!match || match.index === undefined) return "";

  const start = match.index + match[0].length;
  const headingLevel = (match[0].match(/^#+/) || [""])[0].length;
  const nextHeadingPattern = new RegExp(`^#{1,${headingLevel}}\\s`, "m");
  const rest = markdown.slice(start);
  const nextMatch = rest.match(nextHeadingPattern);
  const end = nextMatch?.index ?? rest.length;

  return rest
    .slice(0, end)
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
};

// ── Bullet list parser ────────────────────────────────────────────────────

const parseBulletList = (text: string): string[] => {
  const lines = text.split("\n");
  const items: string[] = [];
  for (const line of lines) {
    const match = line.match(/^[\s]*(?:[-*]|\d+\.)\s+(.+)/);
    if (match) {
      const cleaned = match[1]
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/^\[.*?\]\(.*?\)\s*/, "")
        .trim();
      if (cleaned && !isPlaceholder(cleaned)) {
        items.push(cleaned);
      }
    }
  }
  return items;
};

// ── Placeholder detector ──────────────────────────────────────────────────

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
  /^add pseudocode or idea/i,
  /^paste small relevant snippet/i,
  /^add diagram/i,
  /^add sample input/i,
  /^add expected output/i,
  /^add problem link/i,
  /^add any helpful resources/i,
  /^approach \d$/i,
  /^optional$/i,
];

const isPlaceholder = (text: string): boolean =>
  PLACEHOLDER_PATTERNS.some((p) => p.test(text.trim()));

// ── Code block extractor ──────────────────────────────────────────────────
// First fenced code block strictly under "# 💻 Code" (sliced to next H1 so
// it can never bleed into "# 🔍 Code Explanation"'s snippet block).

const extractPrimaryCode = (
  markdown: string,
): { code: string; language: string } => {
  const codeSectionMatch = markdown.match(/^#\s+💻\s+Code\s*$/m);

  if (codeSectionMatch && codeSectionMatch.index !== undefined) {
    const afterHeading = markdown.slice(
      codeSectionMatch.index + codeSectionMatch[0].length,
    );
    const nextH1 = afterHeading.match(/^#\s/m);
    const sectionContent = nextH1
      ? afterHeading.slice(0, nextH1.index)
      : afterHeading;

    const fenceMatch = sectionContent.match(/```(\w*)\n([\s\S]*?)```/);
    if (fenceMatch) {
      return { language: fenceMatch[1] || "text", code: fenceMatch[2].trim() };
    }
  }

  const fallback = markdown.match(/```(\w*)\n([\s\S]*?)```/);
  if (fallback) {
    return { language: fallback[1] || "text", code: fallback[2].trim() };
  }

  return { code: "", language: "text" };
};

// ── Complexity extractor ──────────────────────────────────────────────────

const extractComplexity = (
  markdown: string,
): { time: string; space: string } => {
  const section = extractSection(
    markdown,
    /^#\s+⏱\s+Complexity Analysis\s*$/m,
  );

  const timeMatch = section.match(/[Tt]ime[^|]*\|([^|]+)\|/);
  const spaceMatch = section.match(/[Ss]pace[^|]*\|([^|]+)\|/);

  const clean = (s: string) =>
    s.replace(/<!--[\s\S]*?-->/g, "").replace(/e\.g\.\s*/gi, "").trim();

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
  const match = section.match(/\[Problem Link\]\(([^)]+)\)/);
  if (match && match[1] !== "url") return match[1];
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

// ── Notes extractor ───────────────────────────────────────────────────────

const extractNotes = (markdown: string): string[] => {
  const section = extractSection(markdown, /^#\s+📝\s+Notes\s*$/m);
  return parseBulletList(section);
};

// ── Code Explanation extractor ────────────────────────────────────────────
// "# 🔍 Code Explanation" → "## Key Snippets" (fenced snippet) +
// "### Explanation" (free text). Returns null if snippet is placeholder/empty.

const extractCodeExplanation = (markdown: string): CodeExplanation | null => {
  const section = extractSection(markdown, /^#\s+🔍\s+Code Explanation\s*$/m);
  if (!section) return null;

  const snippetMatch = section.match(/```[\w]*\n([\s\S]*?)```/);
  const explanationMatch = section.match(/###\s+Explanation\s*([\s\S]*?)$/m);

  const snippet = snippetMatch ? snippetMatch[1].trim() : "";
  const explanation = explanationMatch
    ? explanationMatch[1]
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/^>\s*/gm, "")
        .trim()
    : "";

  const cleanSnippet = snippet && !isPlaceholder(snippet) ? snippet : "";

  if (!cleanSnippet && !explanation) return null;

  return { snippet: cleanSnippet, explanation };
};

// ── Testing table extractor ───────────────────────────────────────────────
// "# 🧪 Testing" → "## Test Cases" markdown table with | Input | Output | Notes |
// Skips fully-empty rows (the template ships with 2 blank rows by default).

const extractTestCases = (markdown: string): TestCaseRow[] => {
  const section = extractSection(markdown, /^#\s+🧪\s+Testing\s*$/m);
  if (!section) return [];

  const rows: TestCaseRow[] = [];
  const lines = section.split("\n");
  let pastHeaderSeparator = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;

    if (/^\|[\s:-]+\|[\s:-]+\|[\s:-]+\|?$/.test(trimmed)) {
      pastHeaderSeparator = true;
      continue;
    }
    if (!pastHeaderSeparator) continue;

    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length < 2) continue;
    const [input, output, notes = ""] = cells;

    if (!input && !output && !notes) continue;

    rows.push({ input, output, notes });
  }

  return rows;
};

// ── Visualization extractor ───────────────────────────────────────────────
// "# 📷 Visualization (Optional)" → ![alt](url). Skips the template's own
// placeholder image ("image-url").

const extractVisualization = (markdown: string): VisualizationData | null => {
  const section = extractSection(markdown, /^#\s+📷\s+Visualization[^\n]*$/m);
  if (!section) return null;

  const imageMatch = section.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!imageMatch) return null;

  const alt = imageMatch[1].trim();
  const url = imageMatch[2].trim();

  if (!url || url === "image-url" || isPlaceholder(alt)) return null;

  return { url, alt: alt || "Visualization" };
};

// ── Alternative Approaches extractor ──────────────────────────────────────
// "# 📌 Alternative Approaches" contains "## Approach 1", "## Approach 2", etc.
// Each becomes { label, content }. Empty/placeholder-only approaches are skipped.

const extractAlternativeApproaches = (
  markdown: string,
): AlternativeApproach[] => {
  const section = extractSection(
    markdown,
    /^#\s+📌\s+Alternative Approaches\s*$/m,
  );
  if (!section) return [];

  const approaches: AlternativeApproach[] = [];
  const subHeadingPattern = /^##\s+(.+)$/gm;
  const matches = [...section.matchAll(subHeadingPattern)];

  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1].trim();
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = matches[i + 1]?.index ?? section.length;
    const content = section
      .slice(start, end)
      .replace(/<!--[\s\S]*?-->/g, "")
      .trim();

    const strippedFence = content.replace(/```[\s\S]*?```/g, "").trim();
    const fenceContent = content.match(/```[\w]*\n([\s\S]*?)```/)?.[1]?.trim();
    const isPlaceholderOnly =
      !strippedFence && (!fenceContent || isPlaceholder(fenceContent));

    if (content && !isPlaceholderOnly) {
      approaches.push({ label, content });
    }
  }

  return approaches;
};

// ── Template detection ────────────────────────────────────────────────────

const TEMPLATE_HEADINGS = [
  /^#\s+💡\s+Intuition/m,
  /^#\s+🧠\s+Approach/m,
  /^#\s+⏱\s+Complexity Analysis/m,
  /^#\s+💻\s+Code/m,
  /^#\s+📊\s+Example Walkthrough/m,
  /^#\s+⚠️\s+Edge Cases/m,
  /^#\s+📚\s+Summary/m,
  /^#\s+🔍\s+Code Explanation/m,
  /^#\s+🧪\s+Testing/m,
  /^#\s+📝\s+Notes/m,
  /^#\s+📌\s+Alternative Approaches/m,
  /^#\s+❓\s+Discussion/m,
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
    return {
      title,
      problemLink: extractProblemLink(markdown),
      intuition: markdown,
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
      codeExplanation: null,
      testCases: [],
      visualization: null,
      alternativeApproaches: [],
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
  const edgeCasesSection = extractSection(markdown, /^#\s+⚠️\s+Edge Cases\s*$/m);
  const summarySection = extractSection(markdown, /^#\s+📚\s+Summary\s*$/m);

  const cleanIntuition = intuitionSection
    .replace(/^>\s*/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

  const summaryPoints = [
    ...parseBulletList(summarySection),
    ...extractNotes(markdown),
  ];

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
    summaryPoints,
    codeExplanation: extractCodeExplanation(markdown),
    testCases: extractTestCases(markdown),
    visualization: extractVisualization(markdown),
    alternativeApproaches: extractAlternativeApproaches(markdown),
    isTemplatePost: true,
  };
};

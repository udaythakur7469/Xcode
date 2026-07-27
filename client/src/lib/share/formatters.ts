import { ParsedPostData } from "@/types/share";

// ── Helpers ───────────────────────────────────────────────────────────────

const bulletList = (items: string[]): string =>
  items.length > 0 ? items.map((i) => `- ${i}`).join("\n") : "_Not specified_";

const numberedList = (items: string[]): string =>
  items.length > 0
    ? items.map((i, idx) => `${idx + 1}. ${i}`).join("\n")
    : "_Not specified_";

const codeBlock = (code: string, language: string): string =>
  code ? `\`\`\`${language}\n${code}\n\`\`\`` : "_No code provided_";

const complexityRow = (time: string, space: string): string => {
  const t = time || "_not specified_";
  const s = space || "_not specified_";
  return `- **Time:** ${t}\n- **Space:** ${s}`;
};

const testCasesTable = (data: ParsedPostData): string => {
  if (data.testCases.length === 0) return "";
  const header = "| Input | Output | Notes |\n|-------|--------|-------|";
  const rows = data.testCases
    .map((t) => `| ${t.input || "-"} | ${t.output || "-"} | ${t.notes || "-"} |`)
    .join("\n");
  return `${header}\n${rows}`;
};

const alternativeApproachesBlock = (data: ParsedPostData): string =>
  data.alternativeApproaches
    .map((a) => `**${a.label}**\n\n${a.content}`)
    .join("\n\n");

// ── Freeform fallback ─────────────────────────────────────────────────────

const freeformFallback = (data: ParsedPostData): string =>
  `# ${data.title}\n\n${data.intuition}`;

// ── Medium Format ─────────────────────────────────────────────────────────

export const generateMediumFormat = (data: ParsedPostData): string => {
  if (!data.isTemplatePost) return freeformFallback(data);

  const parts: string[] = [
    `# ${data.title}`,
    "",
    `## Problem Statement`,
    `_Write the problem in your own words._`,
    "",
  ];

  if (data.problemLink) {
    parts.push(`## References`, `- Problem Link: ${data.problemLink}`, "");
  }

  parts.push("---", "", "## Intuition", data.intuition || "_Not provided_", "");

  if (data.approachSteps.length > 0 || data.keyDecisions.length > 0) {
    parts.push("---", "", "## Approach", "");
    if (data.approachSteps.length > 0) {
      parts.push("### Step-by-step Strategy", numberedList(data.approachSteps), "");
    }
    if (data.keyDecisions.length > 0) {
      parts.push("### Key Decisions", bulletList(data.keyDecisions), "");
    }
  }

  if (data.dataStructures.length > 0 || data.algorithmFlow.length > 0) {
    parts.push("---", "", "## Implementation Details", "");
    if (data.dataStructures.length > 0) {
      parts.push("### Data Structures Used", bulletList(data.dataStructures), "");
    }
    if (data.algorithmFlow.length > 0) {
      parts.push("### Algorithm Flow", numberedList(data.algorithmFlow), "");
    }
  }

  if (data.timeComplexity || data.spaceComplexity) {
    parts.push(
      "---",
      "",
      "## Complexity Analysis",
      "",
      complexityRow(data.timeComplexity, data.spaceComplexity),
      "",
    );
  }

  if (data.code) {
    parts.push("---", "", "## Code", "", codeBlock(data.code, data.language), "");
  }

  if (data.codeExplanation) {
    parts.push("---", "", "## Code Explanation", "");
    if (data.codeExplanation.snippet) {
      parts.push("**Key Snippet**", codeBlock(data.codeExplanation.snippet, data.language), "");
    }
    if (data.codeExplanation.explanation) {
      parts.push(data.codeExplanation.explanation, "");
    }
  }

  if (data.exampleInput || data.exampleOutput) {
    parts.push("---", "", "## Example Walkthrough", "");
    if (data.exampleInput) parts.push("**Input**", `\`\`\`\n${data.exampleInput}\n\`\`\``, "");
    if (data.exampleOutput) parts.push("**Output**", `\`\`\`\n${data.exampleOutput}\n\`\`\``, "");
    if (data.exampleExplanation) parts.push("**Explanation**", data.exampleExplanation, "");
  }

  if (data.edgeCases.length > 0) {
    parts.push("---", "", "## Edge Cases", "", bulletList(data.edgeCases), "");
  }

  if (data.relatedProblems.length > 0) {
    parts.push(
      "---",
      "",
      "## Related Problems",
      "",
      data.relatedProblems.map((p) => `- [${p.name}](${p.url})`).join("\n"),
      "",
    );
  }

  if (data.testCases.length > 0) {
    parts.push("---", "", "## Testing", "", testCasesTable(data), "");
  }

  if (data.visualization) {
    parts.push(
      "---",
      "",
      "## Visualization",
      "",
      `![${data.visualization.alt}](${data.visualization.url})`,
      "",
    );
  }

  if (data.alternativeApproaches.length > 0) {
    parts.push(
      "---",
      "",
      "## Alternative Approaches",
      "",
      alternativeApproachesBlock(data),
      "",
    );
  }

  if (data.summaryPoints.length > 0) {
    parts.push("---", "", "## Summary", "", bulletList(data.summaryPoints), "");
  }

  return parts.join("\n");
};

// ── Blog Format (full fidelity) ───────────────────────────────────────────

export const generateBlogFormat = (data: ParsedPostData): string => {
  if (!data.isTemplatePost) return freeformFallback(data);

  const parts: string[] = [
    `# 🚀 ${data.title}`,
    "",
    "## 📌 Problem Statement",
    "> _Write the problem in your own words._",
    "",
  ];

  if (data.problemLink) {
    parts.push("## 🔗 References", `- [Problem Link](${data.problemLink})`, "");
  }

  parts.push("---", "", "# 💡 Intuition", data.intuition || "_Not provided_", "");

  if (data.approachSteps.length > 0 || data.keyDecisions.length > 0) {
    parts.push("---", "", "# 🧠 Approach", "");
    if (data.approachSteps.length > 0) {
      parts.push("## Step-by-step Strategy", numberedList(data.approachSteps), "");
    }
    if (data.keyDecisions.length > 0) {
      parts.push("## Key Decisions", bulletList(data.keyDecisions), "");
    }
  }

  if (data.dataStructures.length > 0 || data.algorithmFlow.length > 0) {
    parts.push("---", "", "# ⚙️ Implementation Details", "");
    if (data.dataStructures.length > 0) {
      parts.push("## 🧩 Data Structures Used", bulletList(data.dataStructures), "");
    }
    if (data.algorithmFlow.length > 0) {
      parts.push("## 🔁 Algorithm Flow", numberedList(data.algorithmFlow), "");
    }
  }

  if (data.timeComplexity || data.spaceComplexity) {
    parts.push(
      "---",
      "",
      "# ⏱ Complexity Analysis",
      "",
      "| Type | Complexity |",
      "|------|-----------|",
      `| Time | ${data.timeComplexity || "_not specified_"} |`,
      `| Space | ${data.spaceComplexity || "_not specified_"} |`,
      "",
    );
  }

  if (data.code) {
    parts.push("---", "", "# 💻 Code", "", codeBlock(data.code, data.language), "");
  }

  if (data.codeExplanation) {
    parts.push("---", "", "# 🔍 Code Explanation", "");
    if (data.codeExplanation.snippet) {
      parts.push("## Key Snippets", codeBlock(data.codeExplanation.snippet, data.language), "");
    }
    if (data.codeExplanation.explanation) {
      parts.push("### Explanation", data.codeExplanation.explanation, "");
    }
  }

  if (data.exampleInput || data.exampleOutput) {
    parts.push("---", "", "# 📊 Example Walkthrough", "");
    if (data.exampleInput) parts.push("## Input", `\`\`\`\n${data.exampleInput}\n\`\`\``, "");
    if (data.exampleOutput) parts.push("## Output", `\`\`\`\n${data.exampleOutput}\n\`\`\``, "");
    if (data.exampleExplanation) parts.push("## Explanation", data.exampleExplanation, "");
  }

  if (data.edgeCases.length > 0) {
    parts.push("---", "", "# ⚠️ Edge Cases", "", bulletList(data.edgeCases), "");
  }

  if (data.relatedProblems.length > 0) {
    parts.push(
      "---",
      "",
      "# 🔗 Related Problems",
      "",
      data.relatedProblems.map((p) => `- [${p.name}](${p.url})`).join("\n"),
      "",
    );
  }

  if (data.testCases.length > 0) {
    parts.push("---", "", "# 🧪 Testing", "", "## Test Cases", testCasesTable(data), "");
  }

  if (data.visualization) {
    parts.push(
      "---",
      "",
      "# 📷 Visualization",
      "",
      `![${data.visualization.alt}](${data.visualization.url})`,
      "",
    );
  }

  if (data.alternativeApproaches.length > 0) {
    parts.push("---", "", "# 📌 Alternative Approaches", "");
    data.alternativeApproaches.forEach((a) => {
      parts.push(`## ${a.label}`, a.content, "");
    });
  }

  if (data.summaryPoints.length > 0) {
    parts.push("---", "", "# 📚 Summary", "", bulletList(data.summaryPoints), "");
  }

  return parts.join("\n");
};

// ── Notion Format ─────────────────────────────────────────────────────────

export const generateNotionFormat = (data: ParsedPostData): string => {
  if (!data.isTemplatePost) return freeformFallback(data);

  const parts: string[] = [`# ${data.title}`, ""];

  if (data.problemLink) {
    parts.push("## Problem", `- Link: ${data.problemLink}`, "", "---", "");
  }

  parts.push("## Intuition", `- ${data.intuition || "_Not provided_"}`, "", "---", "");

  if (data.approachSteps.length > 0) {
    parts.push("## Approach", numberedList(data.approachSteps), "", "---", "");
  }

  if (data.keyDecisions.length > 0) {
    parts.push("## Key Decisions", bulletList(data.keyDecisions), "", "---", "");
  }

  if (data.dataStructures.length > 0) {
    parts.push("## Data Structures Used", bulletList(data.dataStructures), "", "---", "");
  }

  if (data.algorithmFlow.length > 0) {
    parts.push("## Algorithm Flow", numberedList(data.algorithmFlow), "", "---", "");
  }

  if (data.timeComplexity || data.spaceComplexity) {
    parts.push(
      "## Complexity",
      `- Time: ${data.timeComplexity || "_not specified_"}`,
      `- Space: ${data.spaceComplexity || "_not specified_"}`,
      "",
      "---",
      "",
    );
  }

  if (data.code) {
    parts.push("## Code", codeBlock(data.code, data.language), "", "---", "");
  }

  if (data.codeExplanation) {
    parts.push("## Code Explanation", "");
    if (data.codeExplanation.snippet) {
      parts.push(codeBlock(data.codeExplanation.snippet, data.language), "");
    }
    if (data.codeExplanation.explanation) {
      parts.push(data.codeExplanation.explanation, "");
    }
    parts.push("---", "");
  }

  if (data.exampleInput || data.exampleOutput) {
    parts.push("## Example", "");
    if (data.exampleInput) parts.push(`Input:\n\`\`\`\n${data.exampleInput}\n\`\`\``, "");
    if (data.exampleOutput) parts.push(`Output:\n\`\`\`\n${data.exampleOutput}\n\`\`\``, "");
    if (data.exampleExplanation) parts.push(data.exampleExplanation, "");
    parts.push("---", "");
  }

  if (data.edgeCases.length > 0) {
    parts.push("## Edge Cases", bulletList(data.edgeCases), "", "---", "");
  }

  if (data.relatedProblems.length > 0) {
    parts.push(
      "## Related Problems",
      data.relatedProblems.map((p) => `- [${p.name}](${p.url})`).join("\n"),
      "",
      "---",
      "",
    );
  }

  if (data.testCases.length > 0) {
    parts.push("## Testing", testCasesTable(data), "", "---", "");
  }

  if (data.visualization) {
    parts.push(
      "## Visualization",
      `![${data.visualization.alt}](${data.visualization.url})`,
      "",
      "---",
      "",
    );
  }

  if (data.alternativeApproaches.length > 0) {
    parts.push("## Alternative Approaches", "");
    data.alternativeApproaches.forEach((a) => {
      parts.push(`**${a.label}**`, a.content, "");
    });
    parts.push("---", "");
  }

  if (data.summaryPoints.length > 0) {
    parts.push("## Notes", bulletList(data.summaryPoints), "");
  }

  return parts.join("\n");
};

// ── Discussion Format ─────────────────────────────────────────────────────
// Updated per user request: previously kept intentionally short (title +
// intuition + approach + complexity + code + 2 summary points). Now includes
// every extracted section so nothing from the post is left behind, while
// keeping the conversational forum tone (short intros, emoji headers).

export const generateDiscussionFormat = (data: ParsedPostData): string => {
  if (!data.isTemplatePost) return freeformFallback(data);

  const parts: string[] = [
    `I solved **${data.title}** using the following approach:`,
    "",
    "---",
    "",
  ];

  parts.push("### 💡 Intuition", data.intuition || "_Not provided_", "", "---", "");

  if (data.approachSteps.length > 0 || data.keyDecisions.length > 0) {
    parts.push("### 🧠 Approach", "");
    if (data.approachSteps.length > 0) {
      parts.push(numberedList(data.approachSteps), "");
    }
    if (data.keyDecisions.length > 0) {
      parts.push("**Key Decisions**", bulletList(data.keyDecisions), "");
    }
    parts.push("---", "");
  }

  if (data.dataStructures.length > 0 || data.algorithmFlow.length > 0) {
    parts.push("### ⚙️ Implementation Details", "");
    if (data.dataStructures.length > 0) {
      parts.push("**Data Structures Used**", bulletList(data.dataStructures), "");
    }
    if (data.algorithmFlow.length > 0) {
      parts.push("**Algorithm Flow**", numberedList(data.algorithmFlow), "");
    }
    parts.push("---", "");
  }

  if (data.timeComplexity || data.spaceComplexity) {
    parts.push(
      "### ⏱ Complexity",
      `- Time: ${data.timeComplexity || "_not specified_"}`,
      `- Space: ${data.spaceComplexity || "_not specified_"}`,
      "",
      "---",
      "",
    );
  }

  if (data.code) {
    parts.push("### 💻 Code", codeBlock(data.code, data.language), "", "---", "");
  }

  if (data.codeExplanation) {
    parts.push("### 🔍 Code Explanation", "");
    if (data.codeExplanation.snippet) {
      parts.push(codeBlock(data.codeExplanation.snippet, data.language), "");
    }
    if (data.codeExplanation.explanation) {
      parts.push(data.codeExplanation.explanation, "");
    }
    parts.push("---", "");
  }

  if (data.exampleInput || data.exampleOutput) {
    parts.push("### 📊 Example Walkthrough", "");
    if (data.exampleInput) parts.push(`Input:\n\`\`\`\n${data.exampleInput}\n\`\`\``, "");
    if (data.exampleOutput) parts.push(`Output:\n\`\`\`\n${data.exampleOutput}\n\`\`\``, "");
    if (data.exampleExplanation) parts.push(data.exampleExplanation, "");
    parts.push("---", "");
  }

  if (data.edgeCases.length > 0) {
    parts.push("### ⚠️ Edge Cases", bulletList(data.edgeCases), "", "---", "");
  }

  if (data.relatedProblems.length > 0) {
    parts.push(
      "### 🔗 Related Problems",
      data.relatedProblems.map((p) => `- [${p.name}](${p.url})`).join("\n"),
      "",
      "---",
      "",
    );
  }

  if (data.testCases.length > 0) {
    parts.push("### 🧪 Testing", testCasesTable(data), "", "---", "");
  }

  if (data.visualization) {
    parts.push(
      "### 📷 Visualization",
      `![${data.visualization.alt}](${data.visualization.url})`,
      "",
      "---",
      "",
    );
  }

  if (data.alternativeApproaches.length > 0) {
    parts.push("### 📌 Alternative Approaches", "");
    data.alternativeApproaches.forEach((a) => {
      parts.push(`**${a.label}**`, a.content, "");
    });
    parts.push("---", "");
  }

  if (data.summaryPoints.length > 0) {
    parts.push("### 🤔 Thoughts", bulletList(data.summaryPoints), "", "---", "");
  }

  parts.push("Would love feedback or alternative approaches!");

  return parts.join("\n");
};

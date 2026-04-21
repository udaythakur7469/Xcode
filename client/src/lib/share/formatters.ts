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

// ── Freeform fallback ─────────────────────────────────────────────────────
// When the post doesn't follow the template, just wrap the raw markdown
// with a title header. All formatters call this when isTemplatePost = false.

const freeformFallback = (data: ParsedPostData): string =>
  `# ${data.title}\n\n${data.intuition}`; // intuition holds raw md for freeform

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

  if (data.approachSteps.length > 0) {
    parts.push(
      "---",
      "",
      "## Approach",
      "",
      "### Step-by-step Strategy",
      numberedList(data.approachSteps),
      "",
    );
  }

  if (data.keyDecisions.length > 0) {
    parts.push("### Key Decisions", bulletList(data.keyDecisions), "");
  }

  if (data.dataStructures.length > 0 || data.algorithmFlow.length > 0) {
    parts.push("---", "", "## Implementation Details", "");
    if (data.dataStructures.length > 0) {
      parts.push(
        "### Data Structures Used",
        bulletList(data.dataStructures),
        "",
      );
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
    parts.push(
      "---",
      "",
      "## Code",
      "",
      codeBlock(data.code, data.language),
      "",
    );
  }

  if (data.exampleInput || data.exampleOutput) {
    parts.push("---", "", "## Example Walkthrough", "");
    if (data.exampleInput)
      parts.push("**Input**", `\`\`\`\n${data.exampleInput}\n\`\`\``, "");
    if (data.exampleOutput)
      parts.push("**Output**", `\`\`\`\n${data.exampleOutput}\n\`\`\``, "");
    if (data.exampleExplanation)
      parts.push("**Explanation**", data.exampleExplanation, "");
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

  parts.push(
    "---",
    "",
    "# 💡 Intuition",
    data.intuition || "_Not provided_",
    "",
  );

  if (data.approachSteps.length > 0 || data.keyDecisions.length > 0) {
    parts.push("---", "", "# 🧠 Approach", "");
    if (data.approachSteps.length > 0) {
      parts.push(
        "## Step-by-step Strategy",
        numberedList(data.approachSteps),
        "",
      );
    }
    if (data.keyDecisions.length > 0) {
      parts.push("## Key Decisions", bulletList(data.keyDecisions), "");
    }
  }

  if (data.dataStructures.length > 0 || data.algorithmFlow.length > 0) {
    parts.push("---", "", "# ⚙️ Implementation Details", "");
    if (data.dataStructures.length > 0) {
      parts.push(
        "## 🧩 Data Structures Used",
        bulletList(data.dataStructures),
        "",
      );
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
    parts.push(
      "---",
      "",
      "# 💻 Code",
      "",
      codeBlock(data.code, data.language),
      "",
    );
  }

  if (data.exampleInput || data.exampleOutput) {
    parts.push("---", "", "# 📊 Example Walkthrough", "");
    if (data.exampleInput)
      parts.push("## Input", `\`\`\`\n${data.exampleInput}\n\`\`\``, "");
    if (data.exampleOutput)
      parts.push("## Output", `\`\`\`\n${data.exampleOutput}\n\`\`\``, "");
    if (data.exampleExplanation)
      parts.push("## Explanation", data.exampleExplanation, "");
  }

  if (data.edgeCases.length > 0) {
    parts.push(
      "---",
      "",
      "# ⚠️ Edge Cases",
      "",
      bulletList(data.edgeCases),
      "",
    );
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

  if (data.summaryPoints.length > 0) {
    parts.push(
      "---",
      "",
      "# 📚 Summary",
      "",
      bulletList(data.summaryPoints),
      "",
    );
  }

  return parts.join("\n");
};

// ── Notion Format ─────────────────────────────────────────────────────────

export const generateNotionFormat = (data: ParsedPostData): string => {
  if (!data.isTemplatePost) return freeformFallback(data);

  const parts: string[] = [`# ${data.title}`, ""];

  if (data.problemLink) {
    parts.push("## Problem", `- Link: ${data.problemLink}`, "---", "");
  }

  parts.push(
    "## Intuition",
    `- ${data.intuition || "_Not provided_"}`,
    "",
    "---",
    "",
  );

  if (data.approachSteps.length > 0) {
    parts.push("## Approach", numberedList(data.approachSteps), "", "---", "");
  }

  if (data.keyDecisions.length > 0) {
    parts.push(
      "## Key Decisions",
      bulletList(data.keyDecisions),
      "",
      "---",
      "",
    );
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

  if (data.exampleInput || data.exampleOutput) {
    parts.push("## Example", "");
    if (data.exampleInput)
      parts.push(`Input:\n\`\`\`\n${data.exampleInput}\n\`\`\``, "");
    if (data.exampleOutput)
      parts.push(`Output:\n\`\`\`\n${data.exampleOutput}\n\`\`\``, "");
    parts.push("---", "");
  }

  if (data.edgeCases.length > 0) {
    parts.push("## Edge Cases", bulletList(data.edgeCases), "", "---", "");
  }

  if (data.summaryPoints.length > 0) {
    parts.push("## Notes", bulletList(data.summaryPoints), "");
  }

  return parts.join("\n");
};

// ── Discussion Format ─────────────────────────────────────────────────────

export const generateDiscussionFormat = (data: ParsedPostData): string => {
  if (!data.isTemplatePost) return freeformFallback(data);

  const parts: string[] = [
    `I solved **${data.title}** using the following approach:`,
    "",
    "---",
    "",
  ];

  parts.push(
    "### 💡 Intuition",
    data.intuition || "_Not provided_",
    "",
    "---",
    "",
  );

  if (data.approachSteps.length > 0) {
    parts.push(
      "### 🧠 Approach",
      numberedList(data.approachSteps),
      "",
      "---",
      "",
    );
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
    parts.push(
      "### 💻 Code",
      codeBlock(data.code, data.language),
      "",
      "---",
      "",
    );
  }

  const thoughtPoints = data.summaryPoints.slice(0, 2);
  if (thoughtPoints.length > 0) {
    parts.push("### 🤔 Thoughts", bulletList(thoughtPoints), "");
  }

  parts.push("---", "", "Would love feedback or alternative approaches!");

  return parts.join("\n");
};

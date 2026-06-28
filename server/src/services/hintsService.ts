import crypto from "crypto";

export const normalizeCode = (code: string): string => {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments  /* ... */
    .replace(/\/\/[^\n]*/g, "") // line comments   // ...
    .replace(/#[^\n]*/g, "") // python comments # ...
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
};

export const hashCode = (normalized: string): string => {
  return crypto.createHash("sha256").update(normalized).digest("hex");
};

export const isLowEffort = (normalized: string): boolean => {
  return normalized.replace(/\s/g, "").length < 60;
};

export const hasCodeChangedSignificantly = (
  storedHash: string,
  currentHash: string,
): boolean => {
  return storedHash !== currentHash;
};

export const buildPrompt = (
  problemTitle: string,
  problemDescription: string,
  userCode: string,
  language: string,
  lowEffort: boolean,
): string => {
  const effortNote = lowEffort
    ? `The user's code is minimal or mostly empty. Keep all three hints broad and directional.
       Do NOT reveal the algorithm or data structure to use. Focus on encouraging the user to think.`
    : `The user has written meaningful code. Adapt hints to their current progress and approach.
       Avoid repeating conceptual guidance they have clearly already grasped.
       If the code is near-complete, focus on edge cases, off-by-one errors, and validation.`;

  return `
You are an interview preparation mentor helping a user solve a coding problem.
Your job is to generate exactly 3 progressive hints.
 
STRICT RULES — violating any of these is a failure:
- NEVER generate full solution code, pseudocode, or step-by-step implementation instructions.
- NEVER reveal the exact algorithm or data structure directly in Hint 1.
- Keep each hint to a maximum of 2 sentences.
- Hints must be progressive: Hint 1 broadest, Hint 3 most specific (but still no solution).
- Avoid repeating hints that cover the same ground as each other.
- Tone: encouraging, educational, mentor-like. Not robotic.
- Return ONLY valid JSON. No markdown fences, no preamble, no explanation outside the JSON.
 
${effortNote}
 
Problem title: ${problemTitle}
Problem description: ${problemDescription}
User's current code (${language}):
\`\`\`
${userCode}
\`\`\`
 
Hint 1: Broad directional guidance — what kind of thinking or strategy applies here.
Hint 2: More algorithmic — what category of approach or data structure might help (give options, do not specify exactly).
Hint 3: Implementation-level guidance — specific enough to unblock, not enough to solve.
 
Return this exact JSON shape and nothing else:
{
  "hints": ["hint 1 text", "hint 2 text", "hint 3 text"]
}
  `.trim();
};

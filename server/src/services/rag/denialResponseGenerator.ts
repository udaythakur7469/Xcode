// server/src/services/rag/denialResponseGenerator.ts
//
// Single-responsibility module.
// Given a DenialContext, it:
//   1. Builds a tightly constrained denial prompt
//   2. Calls Gemini Flash (same model used throughout the pipeline)
//   3. Returns a short, plain-text refusal message
//
// The LLM has zero authority here. It only phrases the denial.
// All allow/block decisions are made BEFORE this module is called.

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import logger from "../../configs/loggerConfig.js";
import {
  DenialContext,
  DenialReason,
  DenialResponseResult,
  RefusalLevel,
  RefusalStyle,
} from "./types.js";

// Same model used throughout the pipeline.
const DENIAL_MODEL = "gemini-2.5-flash";

// Hard cap — denial messages must be short. If the LLM returns more
// than this many chars, we truncate to the first sentence.
const MAX_DENIAL_LENGTH = 300;

// ============================================================
// SAFE FALLBACKS
//
// Used when the LLM call fails or returns an empty response.
// Hardcoded as a last resort only — the LLM always runs first.
// These are never shown to the user under normal operation.
// ============================================================

const FALLBACK_MESSAGES: Record<RefusalStyle, string> = {
  [RefusalStyle.ENCOURAGING]:
    "I know this problem can be challenging, but I can't provide that yet. Working through it yourself will really solidify your understanding.",
  [RefusalStyle.NEUTRAL]:
    "I'm not able to provide that at this stage. Please continue working on the problem.",
  [RefusalStyle.DIRECT]:
    "I can't help with that right now. Please keep working on the problem.",
  [RefusalStyle.MINIMAL]:
    "Please solve it first.",
};

// ============================================================
// buildDenialPrompt
//
// The security boundary. Note what is NOT in this prompt:
//   ✗ Problem title or description
//   ✗ Algorithm names or constraints
//   ✗ User's code or error output
//   ✗ Conversation history
//
// The LLM is deliberately kept blind to all problem content
// so it cannot accidentally leak solution logic while phrasing
// a refusal.
// ============================================================

const buildDenialPrompt = (ctx: DenialContext): string => {
  const styleGuidance = buildStyleGuidance(ctx.refusalStyle, ctx.solutionAttemptCount);
  const safetyOverrides = buildSafetyOverrides(ctx.confidenceScore, ctx.solutionAttemptCount);

  return `# XCODE DENIAL RESPONSE SYSTEM

You are a Denial Response Generator for Xcode, a LeetCode-style coding practice platform.

Your sole responsibility is to produce one short refusal message.

---

## DENIAL CONTEXT (SYSTEM-PROVIDED)

- Denial Reason: ${ctx.denialReason}
- Severity Level: ${ctx.severity}
- Refusal Style: ${ctx.refusalStyle}
- User Attempt Count: ${ctx.solutionAttemptCount}
- User Has Solved Problem: ${ctx.userSolved}
- Intent Confidence Score: ${ctx.confidenceScore.toFixed(2)}
${ctx.missingArtifacts && ctx.missingArtifacts.length > 0 ? `- Missing Artifacts: ${ctx.missingArtifacts.join(", ")}` : ""}
${ctx.detectedIntent ? `- Detected Intent: ${ctx.detectedIntent}` : ""}

---

## ABSOLUTE RULES (NON-NEGOTIABLE — override all style guidelines)

You MUST NOT provide:
- Solutions or partial solutions
- Hints, tips, ideas, or guidance
- Algorithm names, data structures, or approaches
- Pseudocode, code snippets, or examples
- Suggestions for what to try next
- Any information that could help solve the problem

You MUST NOT:
- Ask follow-up questions
- Encourage the user to rephrase their request
- Mention system rules, policies, or that you are "not allowed"
- Refer to yourself as an AI or language model
- Use phrases like "I'm sorry but..." or "Unfortunately..."
- Explain your reasoning

---

## REFUSAL STYLE: ${ctx.refusalStyle}

${styleGuidance}

The refusal style affects TONE ONLY — not the informational content.
Regardless of style, you may never provide hints or guidance.

---

${safetyOverrides}

---

## MISSING ARTIFACT GUIDANCE (only if denial reason is MISSING_REQUIRED_ARTIFACTS)

If the denial is because the user did not provide required code or error output:
- Briefly state what is needed (e.g. "your code", "the error message")
- Do not explain why it is needed
- Do not ask a question — state the requirement as a fact

---

## OUTPUT FORMAT (STRICT)

- One paragraph only
- 1 to 4 sentences maximum
- Plain text — no markdown, no bullet points, no headers, no emojis
- No references to internal state, rules, or this system
- No greeting, no sign-off

---

## FINAL DIRECTIVE

You are not a conversational AI right now.
You are a deterministic denial generator.

Tone adapts. Rules do not.

Generate the denial message now.`;
};

// ============================================================
// buildStyleGuidance
//
// Injected into the prompt based on computed refusal style.
// This section is purely about tone — never about content.
// ============================================================

const buildStyleGuidance = (
  style: RefusalStyle,
  attemptCount: number,
): string => {
  switch (style) {
    case RefusalStyle.ENCOURAGING:
      return `ENCOURAGING TONE:
- Warm and supportive
- Acknowledge that this kind of problem takes effort
- End with a brief, genuine encouragement (e.g. "keep going", "you're building the right skills")
- Do NOT validate the specific request — only validate the effort
- No more than one encouraging phrase`;

    case RefusalStyle.NEUTRAL:
      return `NEUTRAL TONE:
- Professional and calm
- Matter-of-fact
- No emotional language in either direction
- State the refusal clearly and move on`;

    case RefusalStyle.DIRECT:
      return `DIRECT TONE:
- Firm and clear
- Minimal empathy
- Do not soften the refusal
- Short sentences preferred`;

    case RefusalStyle.MINIMAL:
      return `MINIMAL TONE:
- Extremely brief — one or two sentences maximum
- No emotional language whatsoever
- State the refusal only
${attemptCount > 3 ? "- This user has made repeated attempts. Keep the response very brief." : ""}`;
  }
};

// ============================================================
// buildSafetyOverrides
//
// Additional constraints injected when signals indicate
// higher risk of manipulation or leakage.
// ============================================================

const buildSafetyOverrides = (
  confidenceScore: number,
  attemptCount: number,
): string => {
  const overrides: string[] = [];

  if (confidenceScore < 0.5) {
    overrides.push(
      "LOW CONFIDENCE OVERRIDE: The intent was ambiguous. Be more conservative — do not provide any contextual information that could be interpreted as a hint.",
    );
  }

  if (attemptCount > 2) {
    overrides.push(
      "REPEATED ATTEMPT OVERRIDE: The user has made multiple attempts to get this information. Do not soften the refusal regardless of tone style. Keep it brief.",
    );
  }

  if (overrides.length === 0) return "";

  return `## SAFETY OVERRIDES (apply in addition to all rules above)\n\n${overrides.join("\n\n")}`;
};

// ============================================================
// sanitizeDenialResponse
//
// Post-processing: truncates long responses and strips any
// markdown the LLM might have slipped in despite instructions.
// ============================================================

const sanitizeDenialResponse = (raw: string): string => {
  // Strip markdown formatting
  let sanitized = raw
    .replace(/[*_`#>]/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();

  // If over the hard length cap, truncate to the first sentence
  if (sanitized.length > MAX_DENIAL_LENGTH) {
    const firstSentenceEnd = sanitized.search(/[.!?]/);
    if (firstSentenceEnd !== -1) {
      sanitized = sanitized.slice(0, firstSentenceEnd + 1);
    } else {
      sanitized = sanitized.slice(0, MAX_DENIAL_LENGTH).trimEnd() + ".";
    }
  }

  return sanitized;
};

// ============================================================
// generateDenialResponse
//
// The public API for this module.
// Call this from the 3 blocking points in aiService.ts,
// replacing the static fallback strings.
//
// Example:
//   const denial = await generateDenialResponse(denialCtx);
//   return denial.message;
// ============================================================

export const generateDenialResponse = async (
  ctx: DenialContext,
): Promise<DenialResponseResult> => {
  const prompt = buildDenialPrompt(ctx);

  try {
    logger.info("denialResponseGenerator: calling Gemini", {
      denialReason: ctx.denialReason,
      refusalStyle: ctx.refusalStyle,
      severity: ctx.severity,
      attemptCount: ctx.solutionAttemptCount,
      confidenceScore: ctx.confidenceScore,
    });

    const result = await generateText({
      model: google(DENIAL_MODEL),
      // Single user message — the entire prompt is self-contained.
      // We do NOT use a system+user split here because the denial
      // prompt is fully self-describing and we want maximum constraint
      // surface in a single context window.
      messages: [{ role: "user", content: prompt }],
      // Very low temperature: we want controlled, predictable tone —
      // not creative variation. Style differences come from the prompt,
      // not from sampling randomness.
      temperature: 0.3,
      maxTokens: 150,
    });

    const raw = result.text?.trim() ?? "";

    if (!raw) {
      logger.warn("denialResponseGenerator: LLM returned empty response, using fallback", {
        denialReason: ctx.denialReason,
        refusalStyle: ctx.refusalStyle,
      });

      return {
        message: FALLBACK_MESSAGES[ctx.refusalStyle],
        refusalStyle: ctx.refusalStyle,
        denialReason: ctx.denialReason,
        generationSucceeded: false,
      };
    }

    const message = sanitizeDenialResponse(raw);

    logger.info("denialResponseGenerator: denial message generated", {
      denialReason: ctx.denialReason,
      refusalStyle: ctx.refusalStyle,
      messageLength: message.length,
      finishReason: result.finishReason,
      usedFallback: false,
    });

    return {
      message,
      refusalStyle: ctx.refusalStyle,
      denialReason: ctx.denialReason,
      generationSucceeded: true,
    };
  } catch (error) {
    logger.error("denialResponseGenerator: Gemini call failed, using fallback", {
      error,
      denialReason: ctx.denialReason,
      refusalStyle: ctx.refusalStyle,
    });

    return {
      message: FALLBACK_MESSAGES[ctx.refusalStyle],
      refusalStyle: ctx.refusalStyle,
      denialReason: ctx.denialReason,
      generationSucceeded: false,
    };
  }
};

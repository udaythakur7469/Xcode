// Deterministic, synchronous tag rules — mirrors the rules encoded in
// server/src/services/postTagsService.ts's validateTagUsingAI prompt.
// Anything that fails here is invalid with zero network cost.
// Anything that passes still goes to the AI for the "single concept /
// relevant / not gibberish" checks that can't be done with a regex.

export type PrevalidationResult =
  | { status: "invalid"; message: string }
  | { status: "needs-ai" };

const TAG_CHAR_PATTERN = /^[a-zA-Z0-9+#][a-zA-Z0-9\s+#_-]*[a-zA-Z0-9+#]$|^[a-zA-Z0-9+#]$/;
const CONSECUTIVE_SEPARATOR_PATTERN = /[-_]{2,}/;
const LETTER_PATTERN = /[a-zA-Z]/g;

/**
 * Runs the fast, deterministic checks. Returns `{ status: "invalid" }`
 * when the tag can be rejected without ever calling the AI, or
 * `{ status: "needs-ai" }` when it passes every mechanical rule and
 * the ambiguous semantic checks (relevance, single-concept, gibberish)
 * must be delegated to the backend.
 */
export const prevalidateTag = (rawTag: string): PrevalidationResult => {
  const tag = rawTag.trim();

  if (tag.length === 0) {
    return { status: "invalid", message: "Tag cannot be empty" };
  }

  if (tag.length > 30) {
    return {
      status: "invalid",
      message: "The tag must not exceed 30 characters.",
    };
  }

  const letterCount = (tag.match(LETTER_PATTERN) || []).length;
  if (letterCount < 2) {
    return {
      status: "invalid",
      message: "The tag must contain at least 2 letters.",
    };
  }

  if (!TAG_CHAR_PATTERN.test(tag)) {
    return {
      status: "invalid",
      message: "The tag contains invalid characters.",
    };
  }

  if (CONSECUTIVE_SEPARATOR_PATTERN.test(tag)) {
    return {
      status: "invalid",
      message: "The tag contains invalid characters.",
    };
  }

  return { status: "needs-ai" };
};

// Kept for backwards compatibility with any existing import sites;
// delegates to prevalidateTag.
export const isValidTag = (tag: string): boolean =>
  prevalidateTag(tag).status === "needs-ai";

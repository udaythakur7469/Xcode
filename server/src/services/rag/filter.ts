import { FilterResult, RetrievedKnowledge } from "./types.js";

export const filterDocuments = async (
  docs: RetrievedKnowledge[],
  threshold: number,
): Promise<FilterResult> => {
  if (!docs.length) {
    return { docs: [], docsLength: 0, retrievalConfidence: 0 };
  }
  const scores = docs.map((d) => d.score);

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const max = Math.max(...scores);

  const variance =
    scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const filtered = docs.filter((d) => d.score >= threshold);
  const retrievalConfidence = Math.max(
    0,
    Math.min(1, 0.4 * mean + 0.4 * max - 0.2 * variance),
  );
  return { docs: filtered, docsLength: docs.length, retrievalConfidence };
};

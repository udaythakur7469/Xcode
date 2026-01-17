import createHttpError from "http-errors";

export const cosineSimilarity = (
  vectorA: number[],
  vectorB: number[]
): number => {
  const DIMENSIONS = 1536;

  if (vectorA.length !== DIMENSIONS || vectorB.length !== DIMENSIONS) {
    throw createHttpError.BadRequest(
      `Both vectors must be of length ${DIMENSIONS}`
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < DIMENSIONS; i++) {
    const a = vectorA[i];
    const b = vectorB[i];

    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    throw new Error("Cosine similarity is undefined for zero vectors");
  }

  const cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

  // Normalize from [-1, 1] → [0, 1]
  const normalized = (cosine + 1) / 2;

  // Round to max 2 decimal places
  return Math.round(normalized * 100) / 100;
};

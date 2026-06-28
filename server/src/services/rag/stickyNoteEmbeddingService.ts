// server/src/services/rag/stickyNoteEmbeddingService.ts
//
// Handles embedding sticky notes into Pinecone for semantic search.
//
// Called in TWO places:
// 1. stickyNoteController.ts — on CREATE and UPDATE (upsertStickyNoteEmbedding)
// 2. stickyNoteController.ts — on DELETE (deleteStickyNoteEmbedding)
// 3. personalDataFetcher.ts — for semantic search (searchStickyNotes)
//
// Namespace: "sticky-notes" (scoped per-user via metadata filter on userId)

import { Pinecone } from "@pinecone-database/pinecone";
import { generateEmbedding } from "./embeddings.js";
import logger from "../../configs/loggerConfig.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME!;
const STICKY_NAMESPACE = "sticky-notes";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StickyNoteEmbedInput {
  noteId: string;
  userId: number;
  title: string | null;
  content: string;
}

export interface StickyNoteSearchResult {
  id: string;
  title: string | null;
  content: string;
  score: number;
  updatedAt?: string;
}

// ─── Build embed text ─────────────────────────────────────────────────────────
// Combine title + content so the embedding captures both.
// Short content is padded with the title to improve retrieval.

function buildEmbedText(title: string | null, content: string): string {
  const titlePart = title && title !== "Untitled Note" ? `${title}: ` : "";
  return `${titlePart}${content}`.trim().slice(0, 2000); // cap at 2k chars
}

// ─── Upsert (on note create or update) ───────────────────────────────────────

export async function upsertStickyNoteEmbedding(
  input: StickyNoteEmbedInput
): Promise<void> {
  const { noteId, userId, title, content } = input;

  // Don't embed empty notes — nothing to search
  if (!content || content.trim().length < 5) {
    logger.debug(`[stickyNoteEmbedding] skipping empty note ${noteId}`);
    return;
  }

  try {
    const embedText = buildEmbedText(title, content);
    const embedding = await generateEmbedding(embedText);

    const index = pc.index(PINECONE_INDEX).namespace(STICKY_NAMESPACE);
    await index.upsert([
      {
        id: `sticky_${noteId}`,
        values: embedding,
        metadata: {
          noteId,
          userId,              // used to filter search results per-user
          title: title ?? "",
          content: content.slice(0, 500), // store snippet for retrieval
          sourceType: "sticky-note",
        },
      },
    ]);

    logger.debug(`[stickyNoteEmbedding] upserted note ${noteId} for user ${userId}`);
  } catch (err) {
    // Non-fatal — don't crash the note save operation
    logger.error(`[stickyNoteEmbedding] upsert failed for note ${noteId}`, err);
  }
}

// ─── Delete (on note delete) ──────────────────────────────────────────────────

export async function deleteStickyNoteEmbedding(noteId: string): Promise<void> {
  try {
    const index = pc.index(PINECONE_INDEX).namespace(STICKY_NAMESPACE);
    await index.deleteOne(`sticky_${noteId}`);
    logger.debug(`[stickyNoteEmbedding] deleted embedding for note ${noteId}`);
  } catch (err) {
    logger.error(`[stickyNoteEmbedding] delete failed for note ${noteId}`, err);
  }
}

// ─── Semantic search (called by personalDataFetcher) ─────────────────────────

export async function searchStickyNotes(input: {
  userId: number;
  query: string;
  topK?: number;
}): Promise<StickyNoteSearchResult[]> {
  const { userId, query, topK = 3 } = input;

  try {
    const queryEmbedding = await generateEmbedding(query);

    const index = pc.index(PINECONE_INDEX).namespace(STICKY_NAMESPACE);
    const results = await index.query({
      vector: queryEmbedding,
      topK,
      filter: { userId: { $eq: userId } }, // CRITICAL: only this user's notes
      includeMetadata: true,
    });

    return (results.matches ?? [])
      .filter((m) => (m.score ?? 0) >= 0.65) // minimum similarity threshold
      .map((m) => ({
        id: String(m.metadata?.noteId ?? m.id),
        title: (m.metadata?.title as string) || null,
        content: (m.metadata?.content as string) ?? "",
        score: m.score ?? 0,
        updatedAt: m.metadata?.updatedAt as string | undefined,
      }));
  } catch (err) {
    logger.error("[searchStickyNotes] failed", err);
    return [];
  }
}

// ─── Bulk sync (for seeding existing notes) ───────────────────────────────────
// Run this once if you have existing sticky notes that predate this service.
// Usage: npx ts-node scripts/syncStickyNoteEmbeddings.ts

export async function bulkSyncStickyNoteEmbeddings(
  notes: Array<{ id: string; userId: number; title: string | null; content: string }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const note of notes) {
    try {
      await upsertStickyNoteEmbedding({
        noteId: note.id,
        userId: note.userId,
        title: note.title,
        content: note.content,
      });
      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
}

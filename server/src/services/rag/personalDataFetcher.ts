// server/src/services/rag/personalDataFetcher.ts
//
// Fetches personal data from the DB for MY_* intents.
// Called by generalQueryDispatcher when requiresDbLookup=true and
// intent is one of: MY_SUBMISSIONS, MY_STATS, MY_STICKY_NOTES,
// MY_POSTS, MY_COMMENTS, MY_INTERVIEW_HISTORY, MY_PROFILE.
//
// Returns a structured PersonalDataResult that generalResponseAssembler
// converts to natural language.

import prisma from "../../configs/db.js";
import { generateEmbedding } from "./embeddings.js";
import logger from "../../configs/loggerConfig.js";
import type { GeneralTopLevelIntent } from "./generalIntentRouter.js";

// ─── Return types ─────────────────────────────────────────────────────────────

export interface PersonalDataResult {
  intent: GeneralTopLevelIntent;
  found: boolean;
  data: Record<string, unknown>;
  summary: string; // Human-readable one-liner for response assembler
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface PersonalDataInput {
  userId: number;
  intent: GeneralTopLevelIntent;
  extractedProblemTitle?: string;
  extractedKeyword?: string;      // for sticky note semantic search
  userMessage: string;
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function fetchPersonalData(
  input: PersonalDataInput
): Promise<PersonalDataResult> {
  const { userId, intent } = input;

  try {
    switch (intent) {
      case "MY_SUBMISSIONS":
        return await fetchSubmissions(input);
      case "MY_STATS":
        return await fetchStats(userId);
      case "MY_STICKY_NOTES":
        return await fetchStickyNotes(input);
      case "MY_POSTS":
        return await fetchPosts(input);
      case "MY_COMMENTS":
        return await fetchComments(userId);
      case "MY_INTERVIEW_HISTORY":
        return await fetchInterviewHistory(userId);
      case "MY_PROFILE":
        return await fetchProfile(userId);
      default:
        return {
          intent,
          found: false,
          data: {},
          summary: "No personal data handler for this intent.",
        };
    }
  } catch (err) {
    logger.error(`[personalDataFetcher] failed for intent=${intent}`, err);
    return {
      intent,
      found: false,
      data: { error: (err as Error).message },
      summary: "I ran into an error fetching your data. Please try again.",
    };
  }
}

// ─── MY_SUBMISSIONS ───────────────────────────────────────────────────────────

async function fetchSubmissions(
  input: PersonalDataInput
): Promise<PersonalDataResult> {
  const { userId, extractedProblemTitle } = input;

  const where: Record<string, unknown> = { userId };

  // If user mentioned a specific problem, filter by it
  if (extractedProblemTitle) {
    where.problem = {
      title: { contains: extractedProblemTitle, mode: "insensitive" },
    };
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      language: true,
      runtime: true,
      memory: true,
      testCasesPassed: true,
      totalTestCases: true,
      createdAt: true,
      problem: { select: { title: true } },
    },
  });

  const acceptedCount = submissions.filter((s) => s.status === "accepted").length;

  return {
    intent: "MY_SUBMISSIONS",
    found: submissions.length > 0,
    data: { submissions, totalFetched: submissions.length, acceptedCount },
    summary: submissions.length === 0
      ? extractedProblemTitle
        ? `No submissions found for "${extractedProblemTitle}".`
        : "You have no submissions yet."
      : `Found ${submissions.length} recent submission(s)${extractedProblemTitle ? ` for "${extractedProblemTitle}"` : ""}, ${acceptedCount} accepted.`,
  };
}

// ─── MY_STATS ────────────────────────────────────────────────────────────────

async function fetchStats(userId: number): Promise<PersonalDataResult> {
  const stats = await prisma.stats.findUnique({
    where: { userId },
  });

  if (!stats) {
    return {
      intent: "MY_STATS",
      found: false,
      data: {},
      summary: "No stats found. Solve a problem to start tracking your progress!",
    };
  }

  return {
    intent: "MY_STATS",
    found: true,
    data: stats,
    summary: `You've solved ${stats.totalSolved} problem(s) total — ${stats.easySolved} easy, ${stats.mediumSolved} medium, ${stats.hardSolved} hard.`,
  };
}

// ─── MY_STICKY_NOTES ─────────────────────────────────────────────────────────
// Two strategies:
// 1. Keyword search — quick DB ILIKE on title + content (always runs first)
// 2. Semantic search — embed the keyword and query Pinecone sticky-notes namespace
//    (only runs when keyword is present and DB search returns < 2 results)

async function fetchStickyNotes(
  input: PersonalDataInput
): Promise<PersonalDataResult> {
  const { userId, extractedKeyword } = input;

  // Always fetch all notes for this user (they rarely have >50)
  const allNotes = await prisma.stickyNote.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      color: true,
      updatedAt: true,
    },
  });

  if (allNotes.length === 0) {
    return {
      intent: "MY_STICKY_NOTES",
      found: false,
      data: {},
      summary: "You don't have any sticky notes yet.",
    };
  }

  // If no keyword — return all notes summary
  if (!extractedKeyword) {
    return {
      intent: "MY_STICKY_NOTES",
      found: true,
      data: { notes: allNotes, totalCount: allNotes.length },
      summary: `You have ${allNotes.length} sticky note(s).`,
    };
  }

  // Keyword DB filter first (fast)
  const lowerKeyword = extractedKeyword.toLowerCase();
  const dbMatches = allNotes.filter(
    (n) =>
      n.title?.toLowerCase().includes(lowerKeyword) ||
      n.content.toLowerCase().includes(lowerKeyword)
  );

  if (dbMatches.length >= 1) {
    return {
      intent: "MY_STICKY_NOTES",
      found: true,
      data: { notes: dbMatches, matchedBy: "keyword", keyword: extractedKeyword },
      summary: `Found ${dbMatches.length} note(s) matching "${extractedKeyword}".`,
    };
  }

  // Semantic fallback — embed keyword and find semantically similar notes
  // (relies on sticky notes having been embedded into Pinecone at save time)
  try {
    const { searchStickyNotes } = await import("./stickyNoteEmbeddingService.js");
    const semanticMatches = await searchStickyNotes({ userId, query: extractedKeyword, topK: 3 });

    if (semanticMatches.length > 0) {
      return {
        intent: "MY_STICKY_NOTES",
        found: true,
        data: { notes: semanticMatches, matchedBy: "semantic", keyword: extractedKeyword },
        summary: `Found ${semanticMatches.length} note(s) semantically related to "${extractedKeyword}".`,
      };
    }
  } catch (err) {
    logger.warn("[fetchStickyNotes] semantic search failed, returning empty", err);
  }

  return {
    intent: "MY_STICKY_NOTES",
    found: false,
    data: { keyword: extractedKeyword },
    summary: `No sticky notes found matching "${extractedKeyword}".`,
  };
}

// ─── MY_POSTS ─────────────────────────────────────────────────────────────────

async function fetchPosts(
  input: PersonalDataInput
): Promise<PersonalDataResult> {
  const { userId, extractedProblemTitle } = input;

  const where: Record<string, unknown> = { authorId: userId };
  if (extractedProblemTitle) {
    where.problem = {
      title: { contains: extractedProblemTitle, mode: "insensitive" },
    };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      isDraftPost: true,
      createdAt: true,
      problem: { select: { title: true } },
      tags: { select: { name: true } },
      _count: { select: { comments: true, postReactions: true } },
    },
  });

  return {
    intent: "MY_POSTS",
    found: posts.length > 0,
    data: { posts, totalCount: posts.length },
    summary: posts.length === 0
      ? "You haven't written any posts yet."
      : `You have ${posts.length} post(s)${extractedProblemTitle ? ` related to "${extractedProblemTitle}"` : ""}.`,
  };
}

// ─── MY_COMMENTS ─────────────────────────────────────────────────────────────

async function fetchComments(userId: number): Promise<PersonalDataResult> {
  const comments = await prisma.comment.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      content: true,
      createdAt: true,
      post: { select: { title: true, id: true } },
      _count: { select: { votes: true } },
    },
  });

  return {
    intent: "MY_COMMENTS",
    found: comments.length > 0,
    data: { comments, totalCount: comments.length },
    summary: comments.length === 0
      ? "You haven't made any comments yet."
      : `You have made ${comments.length} recent comment(s).`,
  };
}

// ─── MY_INTERVIEW_HISTORY ─────────────────────────────────────────────────────

async function fetchInterviewHistory(userId: number): Promise<PersonalDataResult> {
  const interviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      role: true,
      type: true,
      level: true,
      techStack: true,
      finalized: true,
      feedbackFinalized: true,
      createdAt: true,
      feedback: {
        select: {
          totalScore: true,
          finalVerdict: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return {
    intent: "MY_INTERVIEW_HISTORY",
    found: interviews.length > 0,
    data: { interviews, totalCount: interviews.length },
    summary: interviews.length === 0
      ? "You haven't taken any mock interviews yet."
      : `You have ${interviews.length} recent mock interview(s). Latest: ${interviews[0].role} (${interviews[0].type}).`,
  };
}

// ─── MY_PROFILE ──────────────────────────────────────────────────────────────

async function fetchProfile(userId: number): Promise<PersonalDataResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      description: true,
      institution: true,
      picture: true,
      createdAt: true,
      links: { select: { key: true, value: true } },
    },
  });

  if (!user) {
    return {
      intent: "MY_PROFILE",
      found: false,
      data: {},
      summary: "Could not find your profile.",
    };
  }

  return {
    intent: "MY_PROFILE",
    found: true,
    data: { user },
    summary: `Profile: ${user.name ?? "No name set"}, ${user.email}, member since ${user.createdAt.toLocaleDateString()}.`,
  };
}

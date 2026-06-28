// server/src/services/rag/refusalStateRepository.ts
//
// All DB operations for the RefusalState table.
// Single responsibility: read and write refusal style state.
// No business logic here — all decisions are in styleDecayEngine.ts.

import prisma from "../../configs/db.js";
import logger from "../../configs/loggerConfig.js";
import { StyleState } from "./types.js";

// ============================================================
// getRefusalState
//
// Reads the current RefusalState row for a user+problem.
// Returns null if this is the first denial (no row yet).
//
// userId    — numeric user ID (req.user.Id or req.user.userId)
// problemId — numeric ID of the Problem row (from Problem table)
// ============================================================

export const getRefusalState = async (
  userId: number,
  problemId: number,
): Promise<StyleState | null> => {
  try {
    const row = await prisma.refusalState.findUnique({
      where: {
        userId_problemId: { userId, problemId },
      },
      select: {
        intensity: true,
        denialCount: true,
        lastUpdatedAt: true,
      },
    });

    if (!row) return null;

    return {
      intensity: row.intensity as 0 | 1 | 2 | 3,
      denialCount: row.denialCount,
      lastUpdatedAt: row.lastUpdatedAt,
    };
  } catch (error) {
    logger.error("refusalStateRepository: getRefusalState failed", {
      error,
      userId,
      problemId,
    });
    // Fail-safe: return null so the denial generator defaults to ENCOURAGING
    return null;
  }
};

// ============================================================
// upsertRefusalState
//
// Creates or updates the RefusalState row for a user+problem.
// Called every time a denial fires, AFTER computeNextStyleState.
// ============================================================

export const upsertRefusalState = async (
  userId: number,
  problemId: number,
  nextState: StyleState,
): Promise<void> => {
  try {
    await prisma.refusalState.upsert({
      where: {
        userId_problemId: { userId, problemId },
      },
      update: {
        intensity: nextState.intensity,
        denialCount: nextState.denialCount,
        lastUpdatedAt: nextState.lastUpdatedAt,
      },
      create: {
        userId,
        problemId,
        intensity: nextState.intensity,
        denialCount: nextState.denialCount,
        lastUpdatedAt: nextState.lastUpdatedAt,
      },
    });
  } catch (error) {
    // Non-fatal: style state is a UX concern, not a safety concern.
    // Log and move on — denial will still fire correctly.
    logger.error("refusalStateRepository: upsertRefusalState failed", {
      error,
      userId,
      problemId,
      intensity: nextState.intensity,
    });
  }
};

// ============================================================
// resetRefusalState
//
// Hard-deletes the RefusalState row on problem solve or topic reset.
// Next denial for this user+problem will start fresh at ENCOURAGING.
// Optional — the decay engine handles reset internally via
// computeNextStyleState, but a hard delete is cleaner for solved problems.
// ============================================================

export const resetRefusalState = async (
  userId: number,
  problemId: number,
): Promise<void> => {
  try {
    await prisma.refusalState.deleteMany({
      where: { userId, problemId },
    });
  } catch (error) {
    logger.error("refusalStateRepository: resetRefusalState failed", {
      error,
      userId,
      problemId,
    });
  }
};

// ============================================================
// resetRefusalStateForBranch
//
// Called from chatController.createBranch when a new branch is created
// (either edit or regenerate). Resets intensity to NEUTRAL (2) so the
// user is not penalised on a fresh branch for denial events that
// accumulated on the abandoned branch.
//
// Decision: intensity=2 (NEUTRAL), not 3 (ENCOURAGING) — we stop
// being firm, but we don't fully reset to an encouraging tone.
// ============================================================
export const resetRefusalStateForBranch = async (
  userId: number,
  problemId: number,
  branchRootMessageId: string | null,
): Promise<void> => {
  try {
    await prisma.refusalState.upsert({
      where: {
        userId_problemId: { userId, problemId },
      },
      update: {
        intensity: 2, // NEUTRAL
        denialCount: 0,
        lastUpdatedAt: new Date(),
        branchRootMessageId,
      },
      create: {
        userId,
        problemId,
        intensity: 2,
        denialCount: 0,
        branchRootMessageId,
      },
    });
  } catch (error) {
    // Non-fatal: style state is a UX concern, not a safety concern.
    // A failure here must not block the branch creation response.
    logger.error("refusalStateRepository: resetRefusalStateForBranch failed", {
      error,
      userId,
      problemId,
    });
  }
};

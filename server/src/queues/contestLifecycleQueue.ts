import { Queue } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";

export type ContestLifecycleJobData =
  | { kind: "start"; contestId: number }
  | { kind: "midpoint"; contestId: number }
  | { kind: "freeze"; contestId: number }
  | { kind: "end"; contestId: number }
  | { kind: "release-problems"; contestId: number };

export const contestLifecycleQueue = new Queue<ContestLifecycleJobData>(
  "contest-lifecycle",
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 200 },
    },
  },
);

/**
 * Schedules the five delayed jobs that drive a contest through its
 * lifecycle without any polling: flip to LIVE at startTime, snapshot
 * standings at the halfway point (for Comeback detection), freeze the
 * leaderboard for the last 25% of the contest (all types — see the
 * freeze-leaderboard design discussion), flip to ENDED + settle
 * ratings/achievements at endTime, and release the problems back to the
 * public bank a short buffer after that. Call this once, right after
 * generateContest() creates the Contest row.
 */
export async function scheduleContestLifecycle(params: {
  contestId: number;
  startTime: Date;
  endTime: Date;
}): Promise<void> {
  const now = Date.now();
  const releaseBufferMs = 10 * 60_000; // 10 minutes after contest end
  const durationMs = params.endTime.getTime() - params.startTime.getTime();
  const midpointTime = params.startTime.getTime() + durationMs * 0.5;
  const freezeTime = params.endTime.getTime() - durationMs * 0.25;

  await contestLifecycleQueue.add(
    "start",
    { kind: "start", contestId: params.contestId },
    { delay: Math.max(0, params.startTime.getTime() - now), jobId: `contest-${params.contestId}-start` },
  );
  await contestLifecycleQueue.add(
    "midpoint",
    { kind: "midpoint", contestId: params.contestId },
    { delay: Math.max(0, midpointTime - now), jobId: `contest-${params.contestId}-midpoint` },
  );
  await contestLifecycleQueue.add(
    "freeze",
    { kind: "freeze", contestId: params.contestId },
    { delay: Math.max(0, freezeTime - now), jobId: `contest-${params.contestId}-freeze` },
  );
  await contestLifecycleQueue.add(
    "end",
    { kind: "end", contestId: params.contestId },
    { delay: Math.max(0, params.endTime.getTime() - now), jobId: `contest-${params.contestId}-end` },
  );
  await contestLifecycleQueue.add(
    "release-problems",
    { kind: "release-problems", contestId: params.contestId },
    {
      delay: Math.max(0, params.endTime.getTime() - now) + releaseBufferMs,
      jobId: `contest-${params.contestId}-release`,
    },
  );
}

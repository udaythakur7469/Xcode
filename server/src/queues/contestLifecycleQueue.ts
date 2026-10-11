import { Queue } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";

// ─── contestLifecycleQueue ───────────────────────────────────────────────
//
// Each contest gets its own start/midpoint/freeze/end jobs scheduled as
// *delayed* jobs the moment it's created — not a polling loop that scans
// for due contests every minute. BullMQ's own delay mechanism handles
// "wake up and run this at the right time," so there's no DB scan running
// forever even when nothing's scheduled, and precision isn't capped at a
// poll interval. See CONTEST_SYSTEM_EXPLAINED.md §5.

export type ContestLifecycleStage = "start" | "midpoint" | "freeze" | "end";

export interface ContestLifecycleJobData {
  contestId: number;
  stage: ContestLifecycleStage;
}

export const contestLifecycleQueue = new Queue<ContestLifecycleJobData>("contest-lifecycle", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
});

export async function scheduleContestLifecycle(params: {
  contestId: number;
  startTime: Date;
  endTime: Date;
}) {
  const { contestId, startTime, endTime } = params;
  const now = Date.now();
  const durationMs = endTime.getTime() - startTime.getTime();

  const stages: { stage: ContestLifecycleStage; at: number }[] = [
    { stage: "start", at: startTime.getTime() },
    { stage: "midpoint", at: startTime.getTime() + durationMs * 0.5 },
    { stage: "freeze", at: startTime.getTime() + durationMs * 0.75 },
    { stage: "end", at: endTime.getTime() },
  ];

  for (const { stage, at } of stages) {
    const delay = Math.max(0, at - now);
    await contestLifecycleQueue.add(
      stage,
      { contestId, stage },
      { delay, jobId: `contest-${contestId}-${stage}` }, // stable id — reschedule-safe
    );
  }
}

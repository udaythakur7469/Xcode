import { Queue } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";

// No payload needed — the worker checks all four contest types itself
// every time this fires. See contestSchedulerWorker.ts.
export const contestSchedulerQueue = new Queue("contest-scheduler", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: { count: 30 },
    removeOnFail: { count: 30 },
  },
});

/**
 * Registers the repeatable "check what's due" job. Call this once at
 * server startup (see index.ts). Safe to call on every boot — BullMQ
 * dedupes repeatable jobs by their key, so this won't create duplicates
 * across restarts/deploys.
 */
export async function scheduleContestSchedulerJob(): Promise<void> {
  await contestSchedulerQueue.add(
    "check-due-contests",
    {},
    {
      repeat: { pattern: "0 0 * * *" }, // once a day at 00:00 UTC
      jobId: "contest-scheduler-daily",
    },
  );
}

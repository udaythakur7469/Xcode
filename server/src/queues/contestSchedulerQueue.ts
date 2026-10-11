import { Queue } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";

// ─── contestSchedulerQueue ───────────────────────────────────────────────
//
// A single repeatable job, running every 5 minutes, that checks — for
// each contest type — whether the next occurrence already exists and
// creates it if not. This is what makes contest generation fully
// unattended: nobody has to click anything, ever. See
// CONTEST_SYSTEM_EXPLAINED.md §4 and §13's build-order note on why full
// automation is the last piece, not the first.
//
// Deliberately a poll-on-a-cadence, not a per-contest delayed job — unlike
// contestLifecycleQueue.ts, there's no natural "wake me up at this exact
// moment" trigger for "should the next Weekly exist yet", so a cheap
// periodic check (idempotent — see contestSchedulerWorker.ts) is the
// simpler, correct choice here.

export const contestSchedulerQueue = new Queue("contest-scheduler", {
  connection: redisConnection,
});

export async function startContestSchedulerRepeatable() {
  await contestSchedulerQueue.add(
    "check-due-contests",
    {},
    {
      repeat: { every: 5 * 60 * 1000 }, // every 5 minutes
      jobId: "contest-scheduler-repeatable", // stable id — avoids duplicate repeat schedules across restarts
    },
  );
}

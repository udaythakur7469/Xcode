import { Queue } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import { ContestType } from "@prisma/client";

export interface ContestReminderJobData {
  contestId: number;
  userId: number;
  timeUntilStartLabel: string; // baked in at schedule time, e.g. "1 hour"
}

export const contestReminderQueue = new Queue<ContestReminderJobData>(
  "contest-reminder",
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 500 },
    },
  },
);

// ── Per-type reminder plan ──────────────────────────────────────────────
// Daily contests are only generated 24h ahead of their own start, so
// there's no room for a meaningful "24h before" reminder — a single
// 30-minute one is the honest equivalent for that type. Every other type
// gets two: a day-before and an hour-before.
const REMINDER_PLAN: Record<
  ContestType,
  { minutesBefore: number; label: string }[]
> = {
  DAILY: [{ minutesBefore: 30, label: "30 minutes" }],
  WEEKLY: [
    { minutesBefore: 24 * 60, label: "24 hours" },
    { minutesBefore: 60, label: "1 hour" },
  ],
  BIWEEKLY: [
    { minutesBefore: 24 * 60, label: "24 hours" },
    { minutesBefore: 60, label: "1 hour" },
  ],
  MONTHLY: [
    { minutesBefore: 24 * 60, label: "24 hours" },
    { minutesBefore: 60, label: "1 hour" },
  ],
};

/**
 * Schedules whichever reminders in this contest type's plan still fall in
 * the future relative to right now. Called once, right when a user
 * registers (see registerForContest in contestController.ts) — if a
 * reminder's window has already passed by the time they register (e.g.
 * they register 20 minutes before a Weekly contest), that one is simply
 * skipped rather than firing immediately or in the past.
 */
export async function scheduleContestReminders(params: {
  contestId: number;
  userId: number;
  contestType: ContestType;
  startTime: Date;
}): Promise<void> {
  const { contestId, userId, contestType, startTime } = params;
  const now = Date.now();

  for (const reminder of REMINDER_PLAN[contestType]) {
    const fireAt = startTime.getTime() - reminder.minutesBefore * 60_000;
    if (fireAt <= now) continue; // window already passed — skip, don't fire late

    await contestReminderQueue.add(
      "send-reminder",
      { contestId, userId, timeUntilStartLabel: reminder.label },
      {
        delay: fireAt - now,
        jobId: `contest-${contestId}-user-${userId}-reminder-${reminder.minutesBefore}`,
      },
    );
  }
}

import { Worker } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import prisma from "../configs/db.js";
import { ContestType } from "@prisma/client";
import { generateContest } from "../services/contestGeneratorService.js";
import { scheduleContestLifecycle } from "../queues/contestLifecycleQueue.js";
import logger from "../configs/loggerConfig.js";

const CONTEST_TYPES: ContestType[] = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"];

// Anchor date for BIWEEKLY's every-14-days cadence — an arbitrary Sunday.
// Every biweekly occurrence lands exactly N*14 days after this.
const BIWEEKLY_ANCHOR = new Date("2024-01-07T18:00:00Z");

/** Rounds `from` forward to the next occurrence of this contest type. */
function getNextOccurrence(type: ContestType, from: Date): Date {
  switch (type) {
    case "DAILY": {
      const next = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 18, 0, 0));
      if (next <= from) next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }
    case "WEEKLY": {
      const next = new Date(from);
      next.setUTCHours(20, 0, 0, 0);
      const daysUntilSaturday = (6 - next.getUTCDay() + 7) % 7;
      next.setUTCDate(next.getUTCDate() + daysUntilSaturday);
      if (next <= from) next.setUTCDate(next.getUTCDate() + 7);
      return next;
    }
    case "BIWEEKLY": {
      const msSinceAnchor = from.getTime() - BIWEEKLY_ANCHOR.getTime();
      const periodMs = 14 * 24 * 60 * 60 * 1000;
      const periodsElapsed = Math.floor(msSinceAnchor / periodMs);
      let next = new Date(BIWEEKLY_ANCHOR.getTime() + (periodsElapsed + 1) * periodMs);
      if (next <= from) next = new Date(next.getTime() + periodMs);
      return next;
    }
    case "MONTHLY": {
      const firstOfMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 1, 17, 0, 0));
      const firstSundayOnOrAfter = (d: Date) => {
        const result = new Date(d);
        result.setUTCDate(result.getUTCDate() + ((7 - result.getUTCDay()) % 7));
        return result;
      };
      let candidate = firstSundayOnOrAfter(firstOfMonth(from.getUTCFullYear(), from.getUTCMonth()));
      if (candidate <= from) {
        candidate = firstSundayOnOrAfter(firstOfMonth(from.getUTCFullYear(), from.getUTCMonth() + 1));
      }
      return candidate;
    }
  }
}

function slugFor(type: ContestType, startTime: Date): string {
  const datePart = startTime.toISOString().slice(0, 10);
  return `${type.toLowerCase()}-${datePart}`;
}

function titleFor(type: ContestType, startTime: Date, sequenceNumber: number): string {
  const typeLabel = type.charAt(0) + type.slice(1).toLowerCase();
  if (type === "DAILY") {
    return `Daily Challenge #${sequenceNumber}`;
  }
  const monthLabel = startTime.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  if (type === "MONTHLY") {
    return `Monthly Championship — ${monthLabel}`;
  }
  return `${typeLabel} Contest ${sequenceNumber}`;
}

const contestSchedulerWorker = new Worker(
  "contest-scheduler",
  async () => {
    const now = new Date();

    for (const type of CONTEST_TYPES) {
      const startTime = getNextOccurrence(type, now);
      const slug = slugFor(type, startTime);

      // Idempotent — the unique slug means a job that fires twice (or a
      // second worker instance) can't ever double-create the same
      // occurrence.
      const existing = await prisma.contest.findUnique({ where: { slug } });
      if (existing) continue;

      const sequenceNumber = (await prisma.contest.count({ where: { type } })) + 1;
      const title = titleFor(type, startTime, sequenceNumber);

      const contest = await generateContest({ type, title, slug, startTime });

      await scheduleContestLifecycle({
        contestId: contest.id,
        startTime: contest.startTime,
        endTime: contest.endTime,
      });

      logger.info(
        `[contestSchedulerWorker] Auto-generated "${title}" (${type}), starting ${startTime.toISOString()}.`,
      );
    }
  },
  { connection: redisConnection, concurrency: 1 },
);

contestSchedulerWorker.on("failed", (job, err) => {
  logger.error(`[contestSchedulerWorker] Job ${job?.id} failed: ${err.message}`);
});

export default contestSchedulerWorker;

import { Worker } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import prisma from "../configs/db.js";
import { ContestType } from "@prisma/client";
import logger from "../configs/loggerConfig.js";
import {
  getNextOccurrence,
  isDueForGeneration,
  slugFor,
  titleFor,
} from "../services/contestSchedulingService.js";
import { generateContest } from "../services/contestGeneratorService.js";
import { scheduleContestLifecycle } from "../queues/contestLifecycleQueue.js";

const CONTEST_TYPES: ContestType[] = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"];

const contestSchedulerWorker = new Worker(
  "contest-scheduler",
  async () => {
    const now = new Date();

    // Auto-generated contests need an owning user for Contest.createdBy.
    // Any ADMIN works — this is a system attribution, not a permission
    // check, so we just take the first one found.
    const systemUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (!systemUser) {
      logger.error(
        "[contestSchedulerWorker] No ADMIN user found — cannot attribute auto-generated contests. Promote at least one user to ADMIN (see the implementation guide).",
      );
      return;
    }

    for (const type of CONTEST_TYPES) {
      if (!isDueForGeneration(type, now)) continue;

      const startTime = getNextOccurrence(type, now);
      const slug = slugFor(type, startTime);

      const existing = await prisma.contest.findUnique({ where: { slug } });
      if (existing) continue; // already generated on a prior run

      const sequenceNumber =
        (await prisma.contest.count({ where: { type } })) + 1;
      const title = titleFor(type, startTime, sequenceNumber);

      const contest = await generateContest({
        type,
        title,
        slug,
        startTime,
        createdById: systemUser.id,
      });

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

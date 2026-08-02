import { Worker } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import { sendEmail } from "../services/emailService.js";
import { contestReminderEmail } from "../emails/contestReminderEmail.js";
import { ContestReminderJobData } from "../queues/contestReminderQueue.js";

const FRONTEND_URL = process.env.FRONTEND_URL;

const contestReminderWorker = new Worker<ContestReminderJobData>(
  "contest-reminder",
  async (job) => {
    const { contestId, userId, timeUntilStartLabel } = job.data;

    const [contest, participant, user] = await Promise.all([
      prisma.contest.findUnique({ where: { id: contestId } }),
      prisma.contestParticipant.findUnique({
        where: { contestId_userId: { contestId, userId } },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
    ]);

    // Contest cancelled/deleted, user unregistered, or contest somehow
    // already ended by the time this fires — nothing to remind them of.
    if (!contest || !participant || !user || contest.status === "ENDED") {
      logger.info(
        `[contestReminderWorker] Skipping reminder for contest ${contestId} / user ${userId} — contest or registration no longer valid.`,
      );
      return;
    }

    const contestUrl = `${FRONTEND_URL}/contests/${contest.slug}`;
    const startTimeLabel = contest.startTime.toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    await sendEmail(
      user.email,
      `${contest.title} starts in ${timeUntilStartLabel}`,
      contestReminderEmail({
        contestTitle: contest.title,
        contestUrl,
        timeUntilStartLabel,
        startTimeLabel,
      }),
    );

    logger.info(
      `[contestReminderWorker] Sent "${timeUntilStartLabel} before" reminder for contest ${contestId} to user ${userId}.`,
    );
  },
  { connection: redisConnection, concurrency: 5 },
);

contestReminderWorker.on("failed", (job, err) => {
  logger.error(`[contestReminderWorker] Job ${job?.id} failed: ${err.message}`);
});

export default contestReminderWorker;

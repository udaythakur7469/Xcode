import { Worker, Job } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import { StatsJobData } from "../queues/statsQueue.js";
import { updateStatistics } from "../controllers/submissionController.js";
import { recordContestSubmission } from "../services/contestSubmissionService.js";
import logger from "../configs/loggerConfig.js";

const statsWorker = new Worker<StatsJobData>(
  "stats-updates",
  async (job: Job<StatsJobData>) => {
    const {
      userId,
      problemId,
      difficulty,
      submissionStatus,
      code,
      language,
      runtimeInMilliseconds,
      memoryInMegabytes,
      testCasesPassed,
      totalTestCases,
      contestId,
      contestProblemId,
    } = job.data;

    logger.info(
      `[statsWorker] Processing job ${job.id} — userId=${userId} problemId=${problemId} status=${submissionStatus}`,
    );

    const submission = await updateStatistics(
      userId,
      problemId,
      difficulty,
      submissionStatus,
      code,
      language,
      runtimeInMilliseconds,
      memoryInMegabytes,
      testCasesPassed,
      totalTestCases,
    );

    // Contest bookkeeping is deliberately a branch tacked onto the end of
    // the existing stats pipeline, not a parallel implementation — a
    // contest submission goes through exactly the same judging and
    // normal-stats logic as any other submission, and only gets this one
    // extra step. See CONTEST_SYSTEM_EXPLAINED.md §9 and §12.
    if (contestId && contestProblemId) {
      await recordContestSubmission({
        submissionId: submission.id,
        userId,
        contestId,
        contestProblemId,
        isAccepted: submissionStatus === "accepted",
        submittedAt: submission.createdAt,
      });
    }

    logger.info(`[statsWorker] Job ${job.id} completed successfully`);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

statsWorker.on("failed", (job, err) => {
  logger.error(
    `[statsWorker] Job ${job?.id} failed after ${job?.attemptsMade} attempt(s): ${err.message}`,
  );
});

statsWorker.on("error", (err) => {
  logger.error(`[statsWorker] Worker-level error: ${err.message}`);
});

export default statsWorker;

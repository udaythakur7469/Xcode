import { Worker } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import { updateStatistics } from "../controllers/submissionController.js";
import logger from "../configs/loggerConfig.js";
const statsWorker = new Worker("stats-updates", async (job) => {
    const { userId, problemId, difficulty, submissionStatus, code, language, runtimeInMilliseconds, memoryInMegabytes, testCasesPassed, totalTestCases, } = job.data;
    logger.info(`[statsWorker] Processing job ${job.id} — userId=${userId} problemId=${problemId} status=${submissionStatus}`);
    await updateStatistics(userId, problemId, difficulty, submissionStatus, code, language, runtimeInMilliseconds, memoryInMegabytes, testCasesPassed, totalTestCases);
    logger.info(`[statsWorker] Job ${job.id} completed successfully`);
}, {
    connection: redisConnection,
    concurrency: 5,
});
statsWorker.on("failed", (job, err) => {
    logger.error(`[statsWorker] Job ${job?.id} failed after ${job?.attemptsMade} attempt(s): ${err.message}`);
});
statsWorker.on("error", (err) => {
    logger.error(`[statsWorker] Worker-level error: ${err.message}`);
});
export default statsWorker;

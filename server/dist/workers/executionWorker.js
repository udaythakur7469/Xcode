import { Worker } from "bullmq";
import axios from "axios";
import { redisConnection } from "../configs/redisConfig.js";
import { JUDGE0_URL, JUDGE0_HEADERS, } from "../controllers/submissionController.js";
import logger from "../configs/loggerConfig.js";
const executionWorker = new Worker("code-execution", async (job) => {
    const { fullCode, languageId, stdin, language, type } = job.data;
    logger.info(`[executionWorker] Job ${job.id} started — type=${type} language=${language}`);
    // Step 1: submit to Judge0 with wait=true — Judge0 blocks until execution
    // completes and returns the full result directly. No polling needed.
    // Timeout must cover: queue wait + compile time + CPU_TIME_LIMIT + buffer.
    // CPU_TIME_LIMIT=5s + CPU_EXTRA_TIME=1s + EC2 cold-start buffer = ~25s total.
    const JUDGE0_TIMEOUT_MS = 25000;
    const createResponse = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
        source_code: Buffer.from(fullCode).toString("base64"),
        language_id: languageId,
        stdin: Buffer.from(stdin).toString("base64"),
    }, { headers: JUDGE0_HEADERS, timeout: JUDGE0_TIMEOUT_MS });
    // wait=true returns the full result inline — no token poll needed.
    const result = createResponse.data;
    if (!result || !result.status) {
        throw new Error("Judge0 returned an empty or malformed response");
    }
    // Step 2: decode base64 fields
    if (result.stdout) {
        result.stdout = Buffer.from(result.stdout, "base64").toString();
    }
    if (result.stderr) {
        result.stderr = Buffer.from(result.stderr, "base64").toString();
    }
    if (result.compile_output) {
        result.compile_output = Buffer.from(result.compile_output, "base64").toString();
    }
    logger.info(`[executionWorker] Job ${job.id} finished — status=${result.status.description}`);
    return { judgeRawResult: result };
}, {
    connection: redisConnection,
    concurrency: 10,
});
executionWorker.on("failed", (job, err) => {
    logger.error(`[executionWorker] Job ${job?.id} failed after ${job?.attemptsMade} attempt(s): ${err.message}`);
});
executionWorker.on("error", (err) => {
    logger.error(`[executionWorker] Worker-level error: ${err.message}`);
});
export default executionWorker;

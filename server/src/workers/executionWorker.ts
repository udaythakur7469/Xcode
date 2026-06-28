import { Worker, Job } from "bullmq";
import axios from "axios";
import { redisConnection } from "../configs/redisConfig.js";
import {
  ExecutionJobData,
  ExecutionJobResult,
} from "../queues/executionQueue.js";
import {
  JUDGE0_URL,
  JUDGE0_HEADERS,
} from "../controllers/submissionController.js";
import logger from "../configs/loggerConfig.js";

const executionWorker = new Worker<ExecutionJobData, ExecutionJobResult>(
  "code-execution",
  async (job: Job<ExecutionJobData>): Promise<ExecutionJobResult> => {
    const { fullCode, languageId, stdin, language, type } = job.data;

    logger.info(
      `[executionWorker] Job ${job.id} started — type=${type} language=${language}`,
    );

    // Step 1: submit to Judge0 in async mode (no wait=true)
    const createResponse = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: Buffer.from(fullCode).toString("base64"),
        language_id: languageId,
        stdin: Buffer.from(stdin).toString("base64"),
      },
      { headers: JUDGE0_HEADERS, timeout: 10000 },
    );

    const token = createResponse.data.token;
    if (!token) throw new Error("Judge0 did not return a submission token");

    // Step 2: poll until Judge0 finishes
    // status.id 1 = In Queue, 2 = Processing — keep polling while <= 2
    const maxAttempts = 40; // 40 x 500ms = 20 seconds maximum
    let attempts = 0;
    let result: any;

    do {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const poll = await axios.get(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=true`,
        { headers: JUDGE0_HEADERS, timeout: 5000 },
      );
      result = poll.data;
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error("Judge0 timed out after 20 seconds");
      }
    } while (result.status.id <= 2);

    // Step 3: decode base64 fields
    // The worker decodes here so the controller receives plain strings directly.
    if (result.stdout) {
      result.stdout = Buffer.from(result.stdout, "base64").toString();
    }
    if (result.stderr) {
      result.stderr = Buffer.from(result.stderr, "base64").toString();
    }
    if (result.compile_output) {
      result.compile_output = Buffer.from(
        result.compile_output,
        "base64",
      ).toString();
    }

    logger.info(
      `[executionWorker] Job ${job.id} finished — status=${result.status.description}`,
    );

    return { judgeRawResult: result };
  },
  {
    connection: redisConnection,
    concurrency: 10,
  },
);

executionWorker.on("failed", (job, err) => {
  logger.error(
    `[executionWorker] Job ${job?.id} failed after ${job?.attemptsMade} attempt(s): ${err.message}`,
  );
});

executionWorker.on("error", (err) => {
  logger.error(`[executionWorker] Worker-level error: ${err.message}`);
});

export default executionWorker;

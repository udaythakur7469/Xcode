import { QueueEvents } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import {
  executionQueue,
  ExecutionJobData,
  ExecutionJobResult,
} from "./executionQueue.js";

const executionQueueEvents = new QueueEvents("code-execution", {
  connection: redisConnection,
});

export async function enqueueAndWait(
  jobName: string,
  data: ExecutionJobData,
  timeoutMs = 40000,
): Promise<ExecutionJobResult> {
  const job = await executionQueue.add(jobName, data);
  const result = await job.waitUntilFinished(executionQueueEvents, timeoutMs);
  return result as ExecutionJobResult;
}

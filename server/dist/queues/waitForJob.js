import { QueueEvents } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
import { executionQueue, } from "./executionQueue.js";
const executionQueueEvents = new QueueEvents("code-execution", {
    connection: redisConnection,
});
export async function enqueueAndWait(jobName, data, timeoutMs = 35000) {
    const job = await executionQueue.add(jobName, data);
    const result = await job.waitUntilFinished(executionQueueEvents, timeoutMs);
    return result;
}

import { Queue } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
export const executionQueue = new Queue("code-execution", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2, // retry once on transient Judge0 failure
        backoff: { type: "fixed", delay: 1000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 200 },
    },
});

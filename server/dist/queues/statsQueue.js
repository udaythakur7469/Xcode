import { Queue } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";
export const statsQueue = new Queue("stats-updates", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 2000, // retries at 2s, 4s, 8s, 16s, 32s
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
    },
});
export async function enqueueStatsUpdate(data) {
    await statsQueue.add("update-stats", data);
}

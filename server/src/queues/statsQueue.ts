import { Queue } from "bullmq";
import { Difficulty, SubmissionStatus } from "@prisma/client";
import { redisConnection } from "../configs/redisConfig.js";

export interface StatsJobData {
  userId: number;
  problemId: number;
  difficulty: Difficulty;
  submissionStatus: SubmissionStatus;
  code: string;
  language: string;
  runtimeInMilliseconds: number;
  memoryInMegabytes: number;
  testCasesPassed: number;
  totalTestCases: number;
  // Only present when the submission was made from inside a live contest
  // workspace — see submissionController.ts's submitCode. Absent for
  // every normal, non-contest submission, and for practice submissions
  // against an ENDED contest (those are treated as ordinary submissions
  // on purpose — see CONTEST_SYSTEM_EXPLAINED.md's practice-mode notes).
  // Note there's no submissionId here: the Submission row doesn't exist
  // yet at enqueue time — updateStatistics() creates it and hands its id
  // back to statsWorker.ts, which is what actually calls
  // recordContestSubmission with it.
  contestId?: number;
  contestProblemId?: number;
}

export const statsQueue = new Queue<StatsJobData>("stats-updates", {
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

export async function enqueueStatsUpdate(data: StatsJobData): Promise<void> {
  await statsQueue.add("update-stats", data);
}

import { Queue } from "bullmq";
import { redisConnection } from "../configs/redisConfig.js";

export interface ExecutionJobData {
  type: "run" | "submit";
  userId: number;
  language: string;
  fullCode: string;
  languageId: number;
  stdin: string;
  problemTitle: string;
  code: string; // raw user code included in response metadata

  // run-only fields
  totalTestCasesInProblem?: number;
  testCaseInput?: string;
  testCaseUserOutput?: string | null;

  // submit-only fields
  problemId?: number;
  difficulty?: string;
  testCases?: {
    apiInput: string;
    apiExpectedOutput: string;
    userInput: string;
    userExpectedOutput: string;
  }[];
}

export interface ExecutionJobResult {
  judgeRawResult: any; // raw Judge0 response, already base64-decoded
}

export const executionQueue = new Queue<ExecutionJobData, ExecutionJobResult>(
  "code-execution",
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 2, // retry once on transient Judge0 failure
      backoff: { type: "fixed", delay: 1000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 200 },
    },
  },
);

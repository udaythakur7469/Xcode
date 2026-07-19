import React from "react";
import type { RunCodeSuccess, RunCodeError } from "@/features/submissionStore";
import {
  formatMemoryKB,
  formatRuntimeSeconds,
  InfoChip,
  PlainCodeBlock,
  SectionLabel,
} from "../../helperComponents/codeSubmission/ResultAtoms";

export function RunTestCase({
  result,
}: {
  result: RunCodeSuccess | RunCodeError;
}) {
  const isSuccess = result.status === "accepted";
  const isWrongAnswer = result.status === "wrong_answer";
  const success = result as RunCodeSuccess;
  const error = result as RunCodeError;

  const runtime = isSuccess
    ? formatRuntimeSeconds(success.time)
    : formatRuntimeSeconds(error.time ?? null);
  const memory = isSuccess
    ? formatMemoryKB(success.memory)
    : formatMemoryKB(error.memory ?? null);

  const displayedStdout = isSuccess ? success.stdout : error.stdout;
  const showOutput = (isSuccess || isWrongAnswer) && displayedStdout != null;
  const displayedExpected = result.testCase?.userOutput ?? null;
  const showExpected =
    (isSuccess || isWrongAnswer) && displayedExpected != null;

  return (
    <div className="flex flex-col gap-4">
      {(runtime || memory) && (
        <div className="flex gap-2 flex-wrap">
          {runtime && <InfoChip label="Runtime" value={runtime} />}
          {memory && <InfoChip label="Memory" value={memory} />}
        </div>
      )}

      {result.testCase?.input && (
        <div>
          <SectionLabel>Input</SectionLabel>
          <PlainCodeBlock>{result.testCase.input}</PlainCodeBlock>
        </div>
      )}

      {showOutput && (
        <div>
          <SectionLabel>Your Output</SectionLabel>
          <PlainCodeBlock variant={isWrongAnswer ? "wrong" : "default"}>
            {displayedStdout}
          </PlainCodeBlock>
        </div>
      )}

      {showExpected && (
        <div>
          <SectionLabel>Expected Output</SectionLabel>
          <PlainCodeBlock>{displayedExpected}</PlainCodeBlock>
        </div>
      )}
    </div>
  );
}

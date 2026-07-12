"use client";

import React from "react";
import {
  useSubmissionStore,
  SubmitCodeSuccess,
  SubmitCodeError,
  FailedTestCase,
  NetworkError,
} from "@/features/submissionStore";
import QuestionResultsLoader from "./QuestionResultsLoader";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import { getLanguageConfig } from "@/lib/share/languageConfig";
import { getStatusCfg } from "@/lib/share/getStatusConfig";
import { SubmitStatusHero } from "./SubmitStatusHero";
import { PerformanceCards } from "./PerformanceCards";
import { RuntimeDistribution } from "./RuntimeDistribution";
import { TestCaseAccordion } from "./TestCaseAccordion";
import { ErrorPanel } from "./ErrorPanel";
import { SubmissionMetadata } from "./SubmissionMetadata";
import { SubmittedCode } from "./SubmittedCode";
import { RiseIn } from "../helperComponents/StatusHeader";
import { Divider } from "../helperComponents/ResultAtoms";

SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("javascript", javascript);

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground select-none">
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="opacity-25"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
      <p className="text-sm font-medium">Submit your code to see results</p>
      <p className="text-xs opacity-60 text-center max-w-[200px]">
        Click &ldquo;Submit&rdquo; to run against all test cases
      </p>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNetworkError(r: any): r is NetworkError {
  return r != null && r._networkError === true;
}

function isSubmitSuccess(
  r: SubmitCodeSuccess | SubmitCodeError | null,
): r is SubmitCodeSuccess {
  return r != null && (r as SubmitCodeSuccess).success === true;
}

// ─── Result card ──────────────────────────────────────────────────────────────

function SubmitResultCard({
  result,
  isSuccess,
}: {
  result: SubmitCodeSuccess | SubmitCodeError;
  isSuccess: boolean;
}) {
  const success = result as SubmitCodeSuccess;
  const failure = result as SubmitCodeError;
  const ft: FailedTestCase | null = isSuccess
    ? null
    : (failure.failedTestCase ?? null);

  const ftStatus = ft?.status ?? (failure as any).status ?? "wrong_answer";
  const ftDesc = ft?.statusDescription ?? (failure as any).statusDescription ?? null;
  const ftStderr = ft?.stderr ?? (failure as any).stderr ?? null;
  const cfg = getStatusCfg(
    isSuccess ? "accepted" : ftStatus,
    ftDesc,
    result.language,
    ftStderr,
  );

  const passed = result.testCasesPassed ?? 0;
  const total = result.totalTestCases ?? 0;
  const totalEvaluated = result.totalTestCasesEvaluated ?? total;
  const firstFailingCase = result.testCaseResults?.find(
    (tc) => tc.status !== "accepted",
  );
  const failedIdx = firstFailingCase ? firstFailingCase.index : passed + 1;

  const langLabel = getLanguageConfig(result.language)?.label ?? result.language;
  const hlLang = getLanguageConfig(result.language)?.highlightKey ?? "cpp";
  const code = result.code ?? "";

  const hasDistribution = isSuccess && success.runtimeDistribution?.length > 0;
  const failBadge = !isSuccess ? `Failed on test case ${failedIdx} of ${total}` : null;

  return (
    <div className="rounded-xl overflow-hidden bg-card">
      <RiseIn order={0}>
        <SubmitStatusHero
          result={result}
          isSuccess={isSuccess}
          langLabel={langLabel}
          failBadge={failBadge}
          passed={passed}
          total={total}
        />
      </RiseIn>

      <div className="px-5 py-4 flex flex-col gap-4">
        <RiseIn order={1}>
          <PerformanceCards
            isSuccess={isSuccess}
            runtimeMs={result.runtimeInMilliseconds ?? 0}
            memoryMb={result.memoryInMegabytes ?? 0}
            passed={passed}
            total={total}
            percentile={isSuccess ? success.percentile : null}
          />
        </RiseIn>

        {hasDistribution && (
          <>
            <Divider />
            <RiseIn order={1}>
              <RuntimeDistribution
                distribution={success.runtimeDistribution}
                percentile={success.percentile}
                language={result.language}
              />
            </RiseIn>
          </>
        )}

        {result.testCaseResults && result.testCaseResults.length > 0 && (
          <>
            <Divider />
            <RiseIn order={1}>
              <TestCaseAccordion
                testCaseResults={result.testCaseResults}
                totalTestCases={total}
                totalTestCasesEvaluated={totalEvaluated}
              />
            </RiseIn>
          </>
        )}

        {!isSuccess && ft && (
          <>
            <Divider />
            <RiseIn order={1}>
              <ErrorPanel ft={ft} cfg={cfg} />
            </RiseIn>
          </>
        )}

        <Divider />
        <RiseIn order={2}>
          <SubmissionMetadata result={result} />
        </RiseIn>

        <Divider />

        <RiseIn order={2}>
          <SubmittedCode code={code} hlLang={hlLang} langLabel={langLabel} />
        </RiseIn>
      </div>
    </div>
  );
}

// ─── QuestionResults ──────────────────────────────────────────────────────────

const QuestionResults: React.FC = () => {
  const { submitCodeResult, isSubmittingCode } = useSubmissionStore();

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-white">
      {isSubmittingCode && (
        <div className="h-full w-full flex items-center justify-center">
          <QuestionResultsLoader isLoading={isSubmittingCode} size={150} />
        </div>
      )}
      {!isSubmittingCode && !submitCodeResult && <EmptyState />}
      {!isSubmittingCode &&
        submitCodeResult &&
        isNetworkError(submitCodeResult) && (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 py-14 text-destructive select-none">
            <p className="text-sm font-medium">Connection Error</p>
            <p className="text-xs opacity-70 text-center max-w-[220px]">
              {submitCodeResult.message}
            </p>
          </div>
        )}
      {!isSubmittingCode &&
        submitCodeResult &&
        !isNetworkError(submitCodeResult) && (
          <div className="mb-16">
            <SubmitResultCard
              result={submitCodeResult}
              isSuccess={isSubmitSuccess(submitCodeResult)}
            />
          </div>
        )}
    </div>
  );
};

export default QuestionResults;

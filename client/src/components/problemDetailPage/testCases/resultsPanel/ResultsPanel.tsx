import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  useSubmissionStore,
  RunCodeSuccess,
  RunCodeError,
  NetworkError,
} from "@/features/submissionStore";
import QuestionResultsLoader from "../../questionResults/QuestionResultsLoader";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import { getLanguageConfig } from "@/lib/share/languageConfig";
import { RunStatusHero } from "./RunStatusHero";
import { RunTestCase } from "./RunTestCase";
import { RunErrorPanel } from "./RunErrorPanel";
import { RunMetadata } from "./RunMetadata";
import { RunSubmittedCode } from "./RunSubmittedCode";
import { RiseIn } from "../../helperComponents/StatusHeader";
import { Divider } from "../../helperComponents/ResultAtoms";

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
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      <p className="text-sm font-medium">Run your code to see results</p>
      <p className="text-xs opacity-60 text-center max-w-[200px]">
        Click &ldquo;Run Code&rdquo; to execute against the sample test case
      </p>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function RunResultCard({ result }: { result: RunCodeSuccess | RunCodeError }) {
  const isSuccess = result.status === "accepted";
  const error = result as RunCodeError;

  const language = result.language ?? "cpp";
  const code = result.code ?? "";
  const langLabel = getLanguageConfig(language)?.label ?? language;
  const hlLang = getLanguageConfig(language)?.highlightKey ?? "cpp";

  return (
    <div className="rounded-xl overflow-hidden bg-card">
      <RiseIn order={0}>
        <RunStatusHero result={result} langLabel={langLabel} />
      </RiseIn>

      <div className="px-5 py-4 flex flex-col gap-4">
        <RiseIn order={1}>
          <RunTestCase result={result} />
        </RiseIn>

        {!isSuccess && result.status !== "wrong_answer" && (
          <RiseIn order={1}>
            <RunErrorPanel error={error} />
          </RiseIn>
        )}

        <Divider />

        <RiseIn order={2}>
          <RunMetadata result={result} langLabel={langLabel} />
        </RiseIn>

        <Divider />

        <RiseIn order={2}>
          <RunSubmittedCode code={code} hlLang={hlLang} langLabel={langLabel} />
        </RiseIn>
      </div>
    </div>
  );
}

// ─── ResultsPanel ─────────────────────────────────────────────────────────────

function isNetworkError(r: any): r is NetworkError {
  return r != null && r._networkError === true;
}

const ResultsPanel: React.FC = () => {
  const { runCodeResult, isRunningCode, hydrateRunCodeResult } =
    useSubmissionStore();
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title");

  // Reload-proof: restore the last run result for this problem from
  // sessionStorage whenever this panel mounts (page reload, or coming back
  // from the "Test cases" tab which unmounts/remounts this component).
  useEffect(() => {
    if (problemTitle) {
      hydrateRunCodeResult(problemTitle);
    }
  }, [problemTitle, hydrateRunCodeResult]);

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-white">
      {isRunningCode && (
        <div className="h-full w-full flex items-center justify-center">
          <QuestionResultsLoader isLoading={isRunningCode} size={50} />
        </div>
      )}
      {!isRunningCode && !runCodeResult && <EmptyState />}
      {!isRunningCode && runCodeResult && isNetworkError(runCodeResult) && (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 py-14 text-destructive select-none">
          <p className="text-sm font-medium">Connection Error</p>
          <p className="text-xs opacity-70 text-center max-w-[220px]">
            {runCodeResult.message}
          </p>
        </div>
      )}
      {!isRunningCode && runCodeResult && !isNetworkError(runCodeResult) && (
        <RunResultCard result={runCodeResult} />
      )}
    </div>
  );
};

export default ResultsPanel;

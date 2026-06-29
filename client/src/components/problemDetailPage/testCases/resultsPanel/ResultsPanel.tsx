import React from "react";
import {
  useSubmissionStore,
  RunCodeSuccess,
  RunCodeError,
  NetworkError,
} from "@/features/submissionStore";
import QuestionResultsLoader from "../../questionResults/QuestionResultsLoader";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";

SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("javascript", javascript);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANG_LABELS: Record<string, string> = {
  cpp: "C++",
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
};
const LANG_HL: Record<string, string> = {
  cpp: "cpp",
  java: "java",
  python: "python",
  javascript: "javascript",
};

function formatMemoryKB(kb: number | null | undefined): string | null {
  if (kb == null) return null;
  return (kb / 1024).toFixed(1) + " MB";
}
function formatRuntimeSeconds(s: string | null | undefined): string | null {
  if (s == null) return null;
  return Math.round(parseFloat(s) * 1000) + "ms";
}
function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type StatusCfg = {
  label: string;
  accentColor: string;
  textClass: string;
  dotClass: string;
  subtitleText: string;
};
const SYNTAX_ERROR_PATTERNS =
  /SyntaxError|IndentationError|ParseError|unexpected token|invalid syntax/i;

function getStatusCfg(
  status: string,
  statusDescription?: string | null,
  language?: string,
  stderr?: string | null,
): StatusCfg {
  if (status === "accepted")
    return {
      label: "Accepted",
      accentColor: "#1D9E75",
      textClass: "text-[#1D9E75]",
      dotClass: "bg-[#1D9E75]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#E24B4A]",
      countClass: "text-[#1D9E75]",
    };
  if (status === "time_limit_exceeded")
    return {
      label: "Time Limit Exceeded",
      accentColor: "#BA7517",
      textClass: "text-[#BA7517]",
      dotClass: "bg-[#BA7517]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#BA7517]",
      countClass: "text-[#BA7517]",
    };
  if (status === "wrong_answer")
    return {
      label: "Wrong Answer",
      accentColor: "#E24B4A",
      textClass: "text-[#E24B4A]",
      dotClass: "bg-[#E24B4A]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#E24B4A]",
      countClass: "text-[#E24B4A]",
    };
  if (status === "compilation_error")
    return {
      label: "Compilation Error",
      accentColor: "#E24B4A",
      textClass: "text-[#E24B4A]",
      dotClass: "bg-[#E24B4A]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#E24B4A]",
      countClass: "text-[#E24B4A]",
    };

  // For interpreted languages: remap NZEC runtime errors that contain syntax errors
  if (
    status === "runtime_error" &&
    (language === "javascript" || language === "python") &&
    stderr &&
    SYNTAX_ERROR_PATTERNS.test(stderr)
  ) {
    return {
      label: "Syntax Error",
      accentColor: "#E24B4A",
      textClass: "text-[#E24B4A]",
      dotClass: "bg-[#E24B4A]",
      passSegClass: "bg-[#1D9E75]",
      failSegClass: "bg-[#E24B4A]",
      countClass: "text-[#E24B4A]",
    };
  }

  return {
    label: "Runtime Error",
    accentColor: "#E24B4A",
    textClass: "text-[#E24B4A]",
    dotClass: "bg-[#E24B4A]",
    passSegClass: "bg-[#1D9E75]",
    failSegClass: "bg-[#E24B4A]",
    countClass: "text-[#E24B4A]",
  };
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
      {children}
    </p>
  );
}
function PlainCodeBlock({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "error";
}) {
  return (
    <pre
      className={[
        "rounded-lg px-3 py-2.5 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words overflow-x-auto",
        variant === "error"
          ? "bg-destructive/5 border border-destructive/20 text-destructive"
          : "bg-secondary border border-border/10 text-foreground",
      ].join(" ")}
    >
      {children}
    </pre>
  );
}
function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs bg-secondary border border-border/10 px-2.5 py-1 rounded-md">
      <span className="text-muted-foreground">{label}</span>
      <strong className="font-medium text-foreground">{value}</strong>
    </div>
  );
}
function Divider() {
  return <div className="w-full h-px bg-border/10" />;
}

// ─── Empty + loader ───────────────────────────────────────────────────────────

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
  const success = result as RunCodeSuccess;
  const error = result as RunCodeError;
  const cfg = getStatusCfg(
    result.status,
    error.statusDescription,
    result.language,
    error.stderr ?? null,
  );

  const language = result.language ?? "cpp";
  const code = result.code ?? "";
  const langLabel = LANG_LABELS[language] ?? language;
  const hlLang = LANG_HL[language] ?? "cpp";

  const runtime = isSuccess
    ? formatRuntimeSeconds(success.time)
    : formatRuntimeSeconds(error.time ?? null);
  const memory = isSuccess
    ? formatMemoryKB(success.memory)
    : formatMemoryKB(error.memory ?? null);

  const errorContent = error.compile_output ?? error.stderr ?? null;
  const errorLabel = error.compile_output
    ? "Compiler Output"
    : "Error (stderr)";
  const showError = !isSuccess && errorContent != null;

  return (
    <div className="rounded-xl border border-border/20 overflow-hidden bg-card animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Status header */}
      <div
        className="px-5 py-4 border-b border-border/10 flex items-start justify-between gap-3"
        style={{ borderLeftWidth: 3, borderLeftColor: cfg.accentColor }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dotClass}`}
            />
            <span
              className={`text-[17px] font-semibold tracking-tight ${cfg.textClass}`}
            >
              {cfg.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground pl-4">
            {cfg.subtitleText}
          </span>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border/15 bg-secondary text-muted-foreground flex-shrink-0">
          {langLabel}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Runtime / Memory */}
        {(runtime || memory) && (
          <div className="flex gap-2 flex-wrap">
            {runtime && <InfoChip label="Runtime" value={runtime} />}
            {memory && <InfoChip label="Memory" value={memory} />}
          </div>
        )}

        {/* Input */}
        {result.testCase?.input && (
          <div>
            <SectionLabel>Input</SectionLabel>
            <PlainCodeBlock>{result.testCase.input}</PlainCodeBlock>
          </div>
        )}

        {/* Your output — success only */}
        {isSuccess && success.stdout != null && (
          <div>
            <SectionLabel>Your Output</SectionLabel>
            <PlainCodeBlock>{success.stdout}</PlainCodeBlock>
          </div>
        )}

        {/* Expected output — success only */}
        {isSuccess && success.testCase?.userOutput != null && (
          <div>
            <SectionLabel>Expected Output</SectionLabel>
            <PlainCodeBlock>{success.testCase.userOutput}</PlainCodeBlock>
          </div>
        )}

        {/* Error block */}
        {showError && (
          <div>
            <SectionLabel>{errorLabel}</SectionLabel>
            <PlainCodeBlock variant="error">{errorContent}</PlainCodeBlock>
          </div>
        )}

        {!isSuccess &&
          result.status === "compilation_error" &&
          !error.testCase && (
            <p className="text-xs text-muted-foreground">
              Code did not reach execution — fix the errors above and run again.
            </p>
          )}

        <Divider />

        {/* Submission metadata */}
        <div className="flex gap-6 flex-wrap">
          {result.submittedAt && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">
                Submitted at
              </span>
              <span className="text-[13px] font-medium text-foreground">
                {formatTimestamp(result.submittedAt)}
              </span>
            </div>
          )}
          {result.totalTestCasesInProblem != null && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground">
                Total test cases
              </span>
              <span className="text-[13px] font-medium text-foreground">
                {result.totalTestCasesInProblem}
              </span>
            </div>
          )}
        </div>

        <Divider />

        {/* Syntax-highlighted code */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Your Code</SectionLabel>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary border border-border/10 text-muted-foreground">
              {langLabel}
            </span>
          </div>
          <div className="rounded-lg overflow-hidden border border-border/10">
            <SyntaxHighlighter
              language={hlLang}
              style={atomOneDark}
              showLineNumbers
              customStyle={{
                margin: 0,
                padding: "12px",
                fontSize: "12px",
                lineHeight: "1.65",
                background: "transparent",
                maxHeight: "340px",
                overflowY: "auto",
              }}
              lineNumberStyle={{
                minWidth: "2.5em",
                paddingRight: "1em",
                color: "#4b5563",
                userSelect: "none",
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ResultsPanel ─────────────────────────────────────────────────────────────

function isNetworkError(r: any): r is NetworkError {
  return r != null && r._networkError === true;
}

const ResultsPanel: React.FC = () => {
  const { runCodeResult, isRunningCode } = useSubmissionStore();
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
        <div className="p-4">
          <RunResultCard result={runCodeResult} />
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;

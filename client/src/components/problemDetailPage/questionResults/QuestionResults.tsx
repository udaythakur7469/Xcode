"use client";

import React, { useState } from "react";
import {
  useSubmissionStore,
  SubmitCodeSuccess,
  SubmitCodeError,
  FailedTestCase,
  TestCaseResult,
  RuntimeBucket,
  NetworkError
} from "@/features/submissionStore";
import QuestionResultsLoader from "./QuestionResultsLoader";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

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

function formatMemoryMB(mb: number | null | undefined): string | null {
  if (mb == null) return null;
  return mb.toFixed(1) + " MB";
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
  passSegClass: string;
  failSegClass: string;
  countClass: string;
};
function getStatusCfg(
  status: string,
  statusDescription?: string | null,
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
  variant?: "default" | "error" | "wrong";
}) {
  const isRed = variant === "error" || variant === "wrong";
  return (
    <pre
      className={[
        "rounded-lg px-3 py-2.5 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words overflow-x-auto",
        isRed
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

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  passed,
  total,
  cfg,
}: {
  passed: number;
  total: number;
  cfg: StatusCfg;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Test cases passed</span>
        <span
          className={`text-[13px] font-semibold tabular-nums ${cfg.countClass}`}
        >
          {passed} / {total}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const segClass =
            i < passed
              ? cfg.passSegClass
              : i === passed && passed < total
                ? cfg.failSegClass
                : "bg-secondary";
          return (
            <div
              key={i}
              className={`h-[5px] flex-1 rounded-full transition-colors duration-300 ${segClass}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats footer ─────────────────────────────────────────────────────────────

function StatsFooter({
  runtime,
  memory,
  language,
  passRate,
  avgRuntime,
  submittedAt,
}: {
  runtime: number | null;
  memory: number | null;
  language: string;
  passRate?: string;
  avgRuntime?: number;
  submittedAt?: string;
}) {
  const items: { label: string; value: string }[] = [];
  if (runtime != null) items.push({ label: "Runtime", value: runtime + "ms" });
  if (memory != null) {
    const v = formatMemoryMB(memory);
    if (v) items.push({ label: "Memory", value: v });
  }
  if (language)
    items.push({ label: "Language", value: LANG_LABELS[language] ?? language });
  if (passRate != null)
    items.push({ label: "Pass Rate", value: passRate + "%" });
  if (avgRuntime != null)
    items.push({ label: "Avg Runtime", value: avgRuntime + "ms" });
  if (submittedAt)
    items.push({ label: "Submitted", value: formatTimestamp(submittedAt) });
  if (!items.length) return null;
  return (
    <div className="flex gap-x-6 gap-y-3 pt-3.5 border-t border-border/10 flex-wrap">
      {items.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <span className="text-[13px] font-medium text-foreground">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Per-test-case table ──────────────────────────────────────────────────────

function TestCaseTable({
  testCaseResults,
}: {
  testCaseResults: TestCaseResult[];
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!testCaseResults || testCaseResults.length === 0) return null;

  return (
    <div className="flex flex-col gap-0">
      <SectionLabel>Test Cases</SectionLabel>
      <div className="rounded-lg overflow-hidden border border-border/10">
        {testCaseResults.map((tc, i) => {
          const isPass = tc.status === "accepted";
          const isOpen = expanded === i;
          return (
            <div key={i} className="border-b border-border/10 last:border-b-0">
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
              >
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isPass ? "bg-[#1D9E75]/15 text-[#1D9E75]" : "bg-destructive/15 text-destructive"}`}
                >
                  {isPass ? "✓" : "✗"}
                </span>
                <span className="text-xs font-medium text-foreground w-20 flex-shrink-0">
                  Case {tc.index}
                </span>
                <span
                  className={`text-xs flex-1 ${isPass ? "text-[#1D9E75]" : "text-destructive"}`}
                >
                  {isPass ? "Accepted" : "Wrong Answer"}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                  {tc.runtimeInMilliseconds}ms
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums w-16 text-right">
                  {tc.memoryInMegabytes.toFixed(1)} MB
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="flex-shrink-0 text-muted-foreground transition-transform duration-200"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 flex flex-col gap-2.5 bg-secondary/20">
                  {tc.input && (
                    <div>
                      <SectionLabel>Input</SectionLabel>
                      <PlainCodeBlock>{tc.input}</PlainCodeBlock>
                    </div>
                  )}
                  {tc.expectedOutput && (
                    <div>
                      <SectionLabel>Expected Output</SectionLabel>
                      <PlainCodeBlock>{tc.expectedOutput}</PlainCodeBlock>
                    </div>
                  )}
                  {tc.actualOutput != null && (
                    <div>
                      <SectionLabel>Your Output</SectionLabel>
                      <PlainCodeBlock variant={isPass ? "default" : "wrong"}>
                        {tc.actualOutput}
                      </PlainCodeBlock>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/20 bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground mb-0.5">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value} submission{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

function RuntimeDistributionChart({
  distribution,
  percentile,
  language,
}: {
  distribution: RuntimeBucket[];
  percentile: number;
  language: string;
}) {
  if (!distribution || distribution.length === 0) return null;
  const chartData = distribution.map((b, i) => ({
    ...b,
    shortLabel: String(i + 1),
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <SectionLabel>Runtime Distribution</SectionLabel>
        <span className="text-xs text-[#1D9E75] font-medium">
          Faster than {percentile}% of {LANG_LABELS[language] ?? language}{" "}
          submissions
        </span>
      </div>
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer width="99%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
            barCategoryGap="30%"
          >
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--secondary))" }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.isUserBucket
                      ? "#1D9E75"
                      : "hsl(var(--muted-foreground) / 0.3)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend row showing bucket labels below the chart */}
      <div className="flex justify-between px-1">
        {distribution.map((b, i) => (
          <span
            key={i}
            className={`text-[9px] text-center flex-1 ${b.isUserBucket ? "text-[#1D9E75] font-semibold" : "text-muted-foreground"}`}
          >
            {b.bucketLabel}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Green bar = your runtime · Numbers 1–8 correspond to the ranges above
      </p>
    </div>
  );
}

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

// ─── Result card ──────────────────────────────────────────────────────────────

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
  // isSuccess is passed in directly — no derivation needed here
  const success = result as SubmitCodeSuccess;
  const failure = result as SubmitCodeError;
  const ft: FailedTestCase | null = isSuccess ? null : failure.failedTestCase;

  const ftStatus = ft?.status ?? "wrong_answer";
  const ftDesc = ft?.statusDescription ?? null;
  const cfg = getStatusCfg(isSuccess ? "accepted" : ftStatus, ftDesc);

  const passed = result.testCasesPassed ?? 0;
  const total = result.totalTestCases ?? 0;
  const failedIdx = passed + 1;

  const langLabel = LANG_LABELS[result.language] ?? result.language;
  const hlLang = LANG_HL[result.language] ?? "cpp";
  const code = result.code ?? "";

  const errorContent = ft?.compile_output ?? ft?.stderr ?? null;
  const errorLabel = ft?.compile_output ? "Compiler Output" : "Error (stderr)";
  const showError = !isSuccess && errorContent != null;
  const showIO = ft && (ft.input || ft.expectedOutput);
  const showActualOutput = ft?.actualOutput != null;

  const hasDistribution = isSuccess && success.runtimeDistribution?.length > 0;

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
              className={`text-[18px] font-semibold tracking-tight ${cfg.textClass}`}
            >
              {cfg.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground pl-4">
            {isSuccess ? "All test cases passed" : (ftDesc ?? "")}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border/15 bg-secondary text-muted-foreground">
            {langLabel}
          </span>
          {!isSuccess && (
            <span className="text-[11px] px-2.5 py-1 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              Failed on test case {failedIdx} of {total}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        <ProgressBar passed={passed} total={total} cfg={cfg} />

        {isSuccess && (
          <div className="flex gap-2 flex-wrap">
            <InfoChip
              label="Runtime"
              value={success.runtimeInMilliseconds + "ms"}
            />
            <InfoChip
              label="Memory"
              value={formatMemoryMB(success.memoryInMegabytes) ?? ""}
            />
          </div>
        )}

        {hasDistribution && (
          <>
            <Divider />
            <RuntimeDistributionChart
              distribution={success.runtimeDistribution}
              percentile={success.percentile}
              language={result.language}
            />
          </>
        )}

        {result.testCaseResults && result.testCaseResults.length > 0 && (
          <>
            <Divider />
            <TestCaseTable testCaseResults={result.testCaseResults} />
          </>
        )}

        {showIO && (
          <>
            <Divider />
            <div className="flex flex-col gap-2.5">
              <SectionLabel>Failed Test Case Detail</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ft!.input && (
                  <div>
                    <SectionLabel>Input</SectionLabel>
                    <PlainCodeBlock>{ft!.input}</PlainCodeBlock>
                  </div>
                )}
                {ft!.expectedOutput && (
                  <div>
                    <SectionLabel>Expected Output</SectionLabel>
                    <PlainCodeBlock>{ft!.expectedOutput}</PlainCodeBlock>
                  </div>
                )}
                {showActualOutput && (
                  <div className="sm:col-span-2">
                    <SectionLabel>Your Output</SectionLabel>
                    <PlainCodeBlock variant="wrong">
                      {ft!.actualOutput}
                    </PlainCodeBlock>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {showError && (
          <div>
            <SectionLabel>{errorLabel}</SectionLabel>
            <PlainCodeBlock variant="error">{errorContent}</PlainCodeBlock>
          </div>
        )}

        <Divider />
        <StatsFooter
          runtime={result.runtimeInMilliseconds ?? null}
          memory={result.memoryInMegabytes ?? null}
          language={result.language}
          passRate={result.passRate}
          avgRuntime={result.avgRuntimeInMilliseconds}
          submittedAt={result.submittedAt}
        />

        <Divider />

        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Submitted Code</SectionLabel>
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
                maxHeight: "420px",
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
          <div className="p-4 mb-16">
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

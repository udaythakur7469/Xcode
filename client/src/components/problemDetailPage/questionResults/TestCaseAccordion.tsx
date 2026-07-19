import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TestCaseResult } from "@/features/submissionStore";
import {
  PlainCodeBlock,
  SectionLabel,
} from "../helperComponents/codeSubmission/ResultAtoms";

const PASS_COLOR = "#22C55E";
const FAIL_COLOR = "#EF4444";

export function TestCaseAccordion({
  testCaseResults,
  totalTestCases,
  totalTestCasesEvaluated,
}: {
  testCaseResults: TestCaseResult[];
  totalTestCases: number;
  totalTestCasesEvaluated: number;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!testCaseResults || testCaseResults.length === 0) return null;

  const notEvaluated = totalTestCases - totalTestCasesEvaluated;

  return (
    <div className="flex flex-col gap-0">
      <SectionLabel>Test Cases</SectionLabel>
      <div className="rounded-lg overflow-hidden border border-border/10">
        {testCaseResults.map((tc, i) => {
          const isPass = tc.status === "accepted";
          const isOpen = expanded === i;
          const color = isPass ? PASS_COLOR : FAIL_COLOR;
          return (
            <div key={i} className="border-b border-border/10 last:border-b-0">
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: `${color}26`, color }}
                >
                  {isPass ? "✓" : "✗"}
                </span>
                <span className="text-xs font-medium text-foreground w-20 flex-shrink-0">
                  Case {tc.index}
                </span>
                <span className="text-xs flex-1" style={{ color }}>
                  {isPass ? "Accepted" : "Wrong Answer"}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                  {tc.runtimeInMilliseconds}ms
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums w-16 text-right">
                  {(tc.memoryInMegabytes ?? 0).toFixed(1)} MB
                </span>
                <ChevronDown
                  size={14}
                  className="flex-shrink-0 text-muted-foreground transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
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

      {notEvaluated > 0 && (
        <p className="text-[11px] text-muted-foreground mt-2">
          {notEvaluated} more test case{notEvaluated !== 1 ? "s" : ""}{" "}
          {notEvaluated !== 1 ? "were" : "was"} not evaluated — fix the
          failure above and resubmit to continue checking.
        </p>
      )}
    </div>
  );
}

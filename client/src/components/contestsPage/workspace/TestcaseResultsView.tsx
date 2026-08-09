"use client";

import React from "react";
import QuestionResults from "@/components/problemDetailPage/questionResults/QuestionResults";
import ResultsPanel from "@/components/problemDetailPage/testCases/resultsPanel/ResultsPanel";

type TestcaseResultsViewProps = {
  lastAction: "run" | "submit" | null;
};

export default function TestcaseResultsView({ lastAction }: TestcaseResultsViewProps) {
  if (lastAction === "run") return <ResultsPanel />;
  if (lastAction === "submit") return <QuestionResults />;
  return (
    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
      Run or Submit to see results here.
    </div>
  );
}

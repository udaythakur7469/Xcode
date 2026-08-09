"use client";

import React from "react";
import TestcasePanelHeader from "./TestcasePanelHeader";
import TestcaseExamplesList from "./TestcaseExamplesList";
import TestcaseResultsView from "./TestcaseResultsView";

type Example = { id: number; input: string; output: string };

type WorkspaceProblemDetail = {
  problem: { examples: Example[] };
};

type TestcasePanelProps = {
  bottomTab: "testcase" | "result";
  onTabChange: (tab: "testcase" | "result") => void;
  selectedProblem: WorkspaceProblemDetail | undefined;
  lastAction: "run" | "submit" | null;
  isMaximized: boolean;
  onToggleMaximize: () => void;
};

export default function TestcasePanel({ bottomTab, onTabChange, selectedProblem, lastAction, isMaximized, onToggleMaximize }: TestcasePanelProps) {
  return (
    <>
      <TestcasePanelHeader bottomTab={bottomTab} onTabChange={onTabChange} isMaximized={isMaximized} onToggleMaximize={onToggleMaximize} />
      <div className="flex-1 relative overflow-hidden">
        {bottomTab === "testcase" && selectedProblem && <TestcaseExamplesList examples={selectedProblem.problem.examples} />}
        {bottomTab === "result" && <TestcaseResultsView lastAction={lastAction} />}
      </div>
    </>
  );
}

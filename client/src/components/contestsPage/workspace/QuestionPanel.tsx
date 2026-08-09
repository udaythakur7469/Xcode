"use client";

import React from "react";
import QuestionPanelHeader from "./QuestionPanelHeader";
import QuestionContent from "./QuestionContent";

type Example = { id: number; input: string; output: string; explanation?: string };

type WorkspaceProblemDetail = {
  label: string;
  points: number;
  problem: {
    title: string;
    difficulty: string;
    description: string;
    examples: Example[];
    constraints?: string[];
  };
};

type QuestionPanelProps = {
  selectedProblem: WorkspaceProblemDetail | undefined;
  isMaximized: boolean;
  onToggleMaximize: () => void;
};

export default function QuestionPanel({ selectedProblem, isMaximized, onToggleMaximize }: QuestionPanelProps) {
  return (
    <>
      <QuestionPanelHeader isMaximized={isMaximized} onToggleMaximize={onToggleMaximize} />
      <QuestionContent selectedProblem={selectedProblem} />
    </>
  );
}

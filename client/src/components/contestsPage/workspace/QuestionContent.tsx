"use client";

import React from "react";

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

type QuestionContentProps = {
  selectedProblem: WorkspaceProblemDetail | undefined;
};

export default function QuestionContent({ selectedProblem }: QuestionContentProps) {
  if (!selectedProblem) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-xl font-bold mb-3">
        {selectedProblem.label}. {selectedProblem.problem.title}
      </h2>
      <div className="flex gap-2 mb-4">
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize">
          {selectedProblem.problem.difficulty}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
          {selectedProblem.points} pts
        </span>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {selectedProblem.problem.description}
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Examples</h3>
        {selectedProblem.problem.examples.map((ex) => (
          <div key={ex.id} className="mb-3 bg-secondary rounded-md p-3">
            <p className="text-sm"><span className="font-semibold">Input:</span> {ex.input}</p>
            <p className="text-sm mt-1"><span className="font-semibold">Output:</span> {ex.output}</p>
            {ex.explanation && (
              <p className="text-sm mt-1"><span className="font-semibold">Explanation:</span> {ex.explanation}</p>
            )}
          </div>
        ))}
      </div>
      {(selectedProblem.problem.constraints?.length ?? 0) > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Constraints</h3>
          <ul className="list-disc list-inside space-y-1 text-sm font-mono">
            {selectedProblem.problem.constraints!.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

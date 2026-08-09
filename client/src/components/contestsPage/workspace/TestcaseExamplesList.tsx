"use client";

import React from "react";

type Example = { id: number; input: string; output: string };

type TestcaseExamplesListProps = {
  examples: Example[];
};

export default function TestcaseExamplesList({ examples }: TestcaseExamplesListProps) {
  return (
    <div className="absolute inset-0 overflow-y-auto p-3 text-xs">
      {examples.slice(0, 3).map((ex) => (
        <div key={ex.id} className="mb-2 rounded-md border p-2 font-mono">
          <div><b>Input:</b> {ex.input}</div>
          <div><b>Expected:</b> {ex.output}</div>
        </div>
      ))}
    </div>
  );
}

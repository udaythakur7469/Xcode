"use client";

import React, { useMemo } from "react";
import RevealOnScroll from "../helperComponents/RevealOnScroll";

const RUN_RESULTS = ["Test Case 1", "Test Case 2", "Test Case 3"];

const HEATMAP_LEVEL_CLASSES = [
  "heatmap-l0",
  "heatmap-l1",
  "heatmap-l2",
  "heatmap-l3",
  "heatmap-l4",
];

const ProductPreviewSection: React.FC = () => {
  // Deterministic-looking but varied mock heatmap cells (84 = 12 weeks x 7 days)
  const heatmapCells = useMemo(() => {
    return Array.from({ length: 84 }, (_, i) => {
      const pseudoRandom = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      if (pseudoRandom < 0.35) return 0;
      if (pseudoRandom < 0.6) return 1;
      if (pseudoRandom < 0.8) return 2;
      if (pseudoRandom < 0.93) return 3;
      return 4;
    });
  }, []);

  return (
    <section id="preview" className="py-[90px]">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col gap-24">
        {/* Row 1 — Run results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <RevealOnScroll>
            <h3 className="text-[1.7rem] font-extrabold mb-4 tracking-tight">
              Every submission, judged instantly.
            </h3>
            <p className="text-muted-foreground mb-[22px] leading-relaxed">
              xCode runs your code against real hidden test cases with
              fail-fast reporting, so you know exactly which case broke and
              why — not just &quot;wrong answer.&quot;
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Per-language runtime & memory benchmarking",
                "Distinct error types for compile, runtime, and TLE",
                "Full history of past submissions per problem",
              ].map((point) => (
                <li key={point} className="flex gap-2.5 items-start text-[0.95rem]">
                  <span className="text-brand font-bold mt-0.5">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1}>
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary">
                <span className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
                <span className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
                <span className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  Run Results
                </span>
              </div>
              <div className="px-5 py-4 text-[0.82rem]">
                {RUN_RESULTS.map((testCase, index) => (
                  <div
                    key={testCase}
                    className={`flex justify-between py-2 ${
                      index !== RUN_RESULTS.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <span>{testCase}</span>
                    <span className="text-[#4ade80]">Passed</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>

        {/* Row 2 — Activity heatmap (reversed layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <RevealOnScroll className="md:order-2">
            <h3 className="text-[1.7rem] font-extrabold mb-4 tracking-tight">
              See your consistency at a glance.
            </h3>
            <p className="text-muted-foreground mb-[22px] leading-relaxed">
              A GitHub-style activity heatmap tracks daily solving streaks,
              while the revision queue makes sure nothing you learned
              quietly fades away.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Daily activity heatmap across the full year",
                "Deduplicated smart revision suggestions",
                "One-click \"mark as revised\" from the editor",
              ].map((point) => (
                <li key={point} className="flex gap-2.5 items-start text-[0.95rem]">
                  <span className="text-brand font-bold mt-0.5">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1} className="md:order-1">
            <div className="border border-border rounded-lg bg-card p-6">
              <div className="font-mono text-sm text-muted-foreground mb-3.5">
                Activity — last 12 weeks
              </div>
              <div className="grid grid-cols-[repeat(20,1fr)] gap-1">
                {heatmapCells.map((level, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-sm ${HEATMAP_LEVEL_CLASSES[level]}`}
                  />
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
};

export default ProductPreviewSection;

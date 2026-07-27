"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import RevealOnScroll from "@/components/landingPage/helperComponents/RevealOnScroll";

const DIFFICULTIES = [
  { label: "Easy", count: 180, barPercent: 62, color: "var(--brand)" },
  { label: "Medium", count: 240, barPercent: 80, color: "#f59e0b" },
  { label: "Hard", count: 80, barPercent: 27, color: "#ef4444" },
];

const DifficultyBar: React.FC<{
  label: string;
  count: number;
  barPercent: number;
  color: string;
}> = ({ label, count, barPercent, color }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="mb-5 last:mb-0">
      <div
        className="flex justify-between font-mono text-[0.85rem] mb-2"
        style={{ color }}
      >
        <span>{label}</span>
        <span className="text-muted-foreground">{count} problems</span>
      </div>
      <div className="h-2.5 rounded-md bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-md"
          style={{ background: color }}
          initial={{ width: "0%" }}
          animate={{ width: isInView ? `${barPercent}%` : "0%" }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};

const DifficultyBreakdownSection: React.FC = () => {
  return (
    <section className="py-20 border-y border-border bg-card">
      <div className="max-w-[1280px] mx-auto px-6">
        <RevealOnScroll className="text-center max-w-[640px] mx-auto mb-12">
          <span className="block font-mono text-xs uppercase tracking-wide text-brand mb-3.5">
            Balanced by design
          </span>
          <h2 className="text-[1.6rem] md:text-[2.2rem] font-extrabold tracking-tight mb-3.5">
            A curve that scales with your skill
          </h2>
          <p className="text-muted-foreground">
            Problems are balanced across difficulty tiers so progress always
            feels earned — never arbitrary, never a wall.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1} className="max-w-[640px] mx-auto">
          <div className="border border-border rounded-xl bg-background p-7">
            {DIFFICULTIES.map((diff) => (
              <DifficultyBar
                key={diff.label}
                label={diff.label}
                count={diff.count}
                barPercent={diff.barPercent}
                color={diff.color}
              />
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};

export default DifficultyBreakdownSection;

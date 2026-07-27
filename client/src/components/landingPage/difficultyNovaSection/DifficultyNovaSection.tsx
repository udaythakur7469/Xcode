"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import RevealOnScroll from "../helperComponents/RevealOnScroll";
import { DIFFICULTY_STATS } from "../landingPageData/statsData";

const DifficultyBar: React.FC<{
  label: string;
  count: number;
  barPercent: number;
  colorVar: string;
  delay: number;
}> = ({ label, count, barPercent, colorVar, delay }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div className="flex items-center gap-4 mb-[22px] last:mb-0" ref={ref}>
      <span
        className="w-[90px] font-mono text-sm font-semibold shrink-0"
        style={{ color: colorVar }}
      >
        {label}
      </span>
      <div className="flex-1 h-2.5 rounded-md bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-md"
          style={{ background: colorVar }}
          initial={{ width: "0%" }}
          animate={{ width: isInView ? `${barPercent}%` : "0%" }}
          transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="w-[70px] text-right font-mono text-sm text-muted-foreground">
        {count}
      </span>
    </div>
  );
};

const NOVA_MESSAGES = [
  { from: "user", text: "Why is my solution getting TLE on large inputs?" },
  {
    from: "nova",
    text: "Your nested loop makes this O(n²). Try using a hash map to check complements in a single pass — that gets you to O(n).",
  },
  { from: "user", text: "Can you point to where exactly?" },
];

const DifficultyNovaSection: React.FC = () => {
  return (
    <section className="py-[90px]">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <RevealOnScroll>
          <h3 className="text-[1.7rem] font-extrabold mb-4 tracking-tight">
            A problem set that scales with you.
          </h3>
          <p className="text-muted-foreground mb-[22px] leading-relaxed">
            Start with fundamentals and work up to hard, interview-grade
            problems — difficulty is balanced so progress always feels
            earned, never arbitrary.
          </p>
          <div className="border border-border rounded-lg bg-card p-7">
            {DIFFICULTY_STATS.map((diff, index) => (
              <DifficultyBar
                key={diff.id}
                label={diff.label}
                count={diff.count}
                barPercent={diff.barPercent}
                colorVar={diff.colorVar}
                delay={index * 0.15}
              />
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-secondary">
              <span className="w-[9px] h-[9px] rounded-full bg-brand animate-pulse-dot" />
              <span className="font-bold text-[0.92rem]">Nova AI Assistant</span>
            </div>
            <div className="px-5 py-[22px] flex flex-col gap-4 max-h-[280px] overflow-y-auto scrollbar-transparent">
              {NOVA_MESSAGES.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[80%] px-4 py-3 rounded-xl text-[0.88rem] leading-relaxed ${
                    msg.from === "user"
                      ? "self-end bg-brand text-brand-foreground rounded-br-[4px]"
                      : "self-start bg-secondary rounded-bl-[4px]"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div className="self-start flex gap-1 bg-secondary px-4 py-3.5 rounded-xl rounded-bl-[4px]">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
};

export default DifficultyNovaSection;

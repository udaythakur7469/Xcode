"use client";

import React from "react";
import RevealOnScroll from "../helperComponents/RevealOnScroll";

const STEPS = [
  {
    number: "1",
    title: "Pick a problem",
    description:
      "Filter by topic, difficulty, or company tag from a constantly refreshed problem set.",
  },
  {
    number: "2",
    title: "Code & submit",
    description:
      "Write in our in-house editor and get judged results in seconds, with full test-case breakdowns.",
  },
  {
    number: "3",
    title: "Review & retain",
    description:
      "Get AI feedback, discuss with the community, and let the revision queue lock it in long-term.",
  },
];

const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-[90px]">
      <div className="max-w-[1280px] mx-auto px-6">
        <RevealOnScroll className="text-center max-w-[640px] mx-auto mb-14">
          <span className="block font-mono text-xs uppercase tracking-wide text-brand mb-3.5">
            The loop
          </span>
          <h2 className="text-[1.7rem] md:text-[2.4rem] font-extrabold tracking-tight">
            From first problem to interview-ready
          </h2>
        </RevealOnScroll>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            className="hidden md:block absolute top-[26px] left-[16.5%] right-[16.5%] h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-glow), transparent)",
            }}
          />
          {STEPS.map((step, index) => (
            <RevealOnScroll key={step.number} delay={index * 0.1}>
              <div className="text-center relative">
                <div className="relative z-10 w-[52px] h-[52px] rounded-full mx-auto mb-5 flex items-center justify-center font-mono font-semibold bg-background border-2 border-brand text-brand">
                  {step.number}
                </div>
                <h4 className="text-[1.05rem] font-bold mb-2.5">
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                  {step.description}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

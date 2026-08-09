"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import JourneyCard, { JOURNEY_TYPE_STYLE } from "./JourneyCard";
import type { JourneyMilestone } from "@/features/contestStore";

type JourneyTimelineProps = {
  journey: JourneyMilestone[];
  selected: number | null;
  onSelect: (index: number) => void;
  rowRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
};

// Rendered newest-first (top) to oldest-last (bottom) — the reverse of
// the Ascent graph's left-to-right chronological order. `position`
// (top-to-bottom slot) drives left/right alternation; `i` (the
// original chronological index) is what the graph's nodes use, so
// clicking a point up there still finds the right row down here.
export default function JourneyTimeline({ journey, selected, onSelect, rowRefs }: JourneyTimelineProps) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ["start center", "end center"] });
  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const reversedOrder = journey.map((m, i) => ({ m, i })).slice().reverse();

  return (
    <div className="mt-12 mb-8">
      <div className="text-sm font-semibold mb-6">Journey Story</div>
      <div className="relative" ref={timelineRef}>
        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-border opacity-25 rounded-full" />
        <motion.div
          className="absolute left-1/2 top-0 w-[3px] -translate-x-1/2 rounded-full"
          style={{
            height: progressHeight,
            background: "linear-gradient(180deg,#22c55e,#16a34a 60%,#22c55e)",
            boxShadow: "0 0 12px rgba(34,197,94,.6)",
          }}
        />
        {reversedOrder.map(({ m, i }, position) => {
          const style = JOURNEY_TYPE_STYLE[m.type];
          const side = position % 2 === 0 ? "left" : "right";
          const isActive = selected === i;
          return (
            <div
              key={i}
              ref={(el) => { rowRefs.current[i] = el; }}
              className="relative grid grid-cols-[56px_1fr] md:grid-cols-[1fr_56px_1fr] items-start mb-11"
            >
              <div className="hidden md:flex col-start-1 justify-end pr-7">
                {side === "left" && <JourneyCard milestone={m} active={isActive} onClick={() => onSelect(i)} align="right" />}
              </div>
              <div className="col-start-1 md:col-start-2 flex justify-center z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.4 }}
                  whileInView={{ opacity: 1, scale: isActive ? 1.18 : 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  onClick={() => onSelect(i)}
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl bg-card border-2 cursor-pointer"
                  style={{ borderColor: style.color, boxShadow: `0 0 0 4px ${style.color}22, 0 4px 18px ${style.color}55` }}
                >
                  {m.icon}
                </motion.div>
              </div>
              <div className="col-start-2 md:col-start-3 pl-5 md:pl-7">
                <div className="md:hidden">
                  <JourneyCard milestone={m} active={isActive} onClick={() => onSelect(i)} align="left" />
                </div>
                <div className="hidden md:block">
                  {side === "right" && <JourneyCard milestone={m} active={isActive} onClick={() => onSelect(i)} align="left" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

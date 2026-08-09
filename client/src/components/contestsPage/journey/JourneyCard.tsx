"use client";

import React from "react";
import { motion } from "framer-motion";
import type { JourneyMilestone } from "@/features/contestStore";

export const JOURNEY_TYPE_STYLE: Record<JourneyMilestone["type"], { label: string; bg: string; color: string }> = {
  start: { label: "Milestone", bg: "rgba(148,163,184,.15)", color: "#94a3b8" },
  title: { label: "Title Unlock", bg: "rgba(34,197,94,.15)", color: "#22c55e" },
  achievement: { label: "Achievement", bg: "rgba(168,85,247,.15)", color: "#a855f7" },
  peak: { label: "Peak Moment", bg: "rgba(249,115,22,.15)", color: "#f97316" },
};

type JourneyCardProps = {
  milestone: JourneyMilestone;
  active: boolean;
  onClick: () => void;
  align: "left" | "right";
};

export default function JourneyCard({ milestone, active, onClick, align }: JourneyCardProps) {
  const style = JOURNEY_TYPE_STYLE[milestone.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: align === "right" ? -24 : 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={onClick}
      className={`card-modern max-w-[340px] w-full p-4 cursor-pointer transition-all ${active ? "shadow-[0_8px_34px_-10px_rgba(34,197,94,.35)] !border-[rgba(34,197,94,.5)] -translate-y-0.5" : ""}`}
    >
      <span
        className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
        style={{ background: style.bg, color: style.color }}
      >
        {style.label}
      </span>
      <div className="text-xs text-muted-foreground font-medium">
        {new Date(milestone.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })} · Rating {milestone.rating}
      </div>
      <div className="font-semibold mt-0.5">{milestone.title}</div>
      <div className="text-sm text-muted-foreground mt-1">{milestone.description}</div>
    </motion.div>
  );
}

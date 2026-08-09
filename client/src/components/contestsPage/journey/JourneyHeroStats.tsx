"use client";

import React from "react";
import type { JourneyMilestone } from "@/features/contestStore";

type JourneyHeroStatsProps = {
  journey: JourneyMilestone[];
};

export default function JourneyHeroStats({ journey }: JourneyHeroStatsProps) {
  const peakRating = Math.max(...journey.map((m) => m.rating));
  const biggestGain = journey.find((m) => m.title === "Biggest Rating Gain");
  const since = new Date(journey[0].date).toLocaleDateString(undefined, { month: "short", year: "numeric" });

  return (
    <div className="card-modern hero-mesh p-7 mt-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 text-[140px] font-bold leading-none opacity-[0.03] select-none pointer-events-none">∞</div>
      <div className="text-xs uppercase tracking-widest text-brand font-semibold mb-1">Your story so far</div>
      <h1 className="text-3xl font-bold">The Ascent</h1>
      <p className="text-sm text-muted-foreground mt-1 max-w-lg">
        Your rating climb through every tier, and the moments along the way.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <div className="stat-chip p-3">
          <div className="text-xs text-muted-foreground">Peak Rating</div>
          <div className="text-lg font-bold font-mono">{peakRating}</div>
        </div>
        <div className="stat-chip p-3">
          <div className="text-xs text-muted-foreground">Milestones</div>
          <div className="text-lg font-bold font-mono">{journey.length}</div>
        </div>
        <div className="stat-chip p-3">
          <div className="text-xs text-muted-foreground">Biggest Gain</div>
          <div className="text-lg font-bold font-mono text-brand">
            {biggestGain ? biggestGain.description.match(/\+\d+/)?.[0] ?? "—" : "—"}
          </div>
        </div>
        <div className="stat-chip p-3">
          <div className="text-xs text-muted-foreground">Since</div>
          <div className="text-lg font-bold font-mono">{since}</div>
        </div>
      </div>
    </div>
  );
}

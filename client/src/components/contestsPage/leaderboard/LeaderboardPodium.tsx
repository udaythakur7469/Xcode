"use client";

import React from "react";
import { getTitleForRating } from "@/lib/titles";
import type { LeaderboardRow } from "@/features/contestStore";

const PODIUM_ORDER = [1, 0, 2]; // visual order: 2nd, 1st, 3rd
const HEIGHTS = ["h-24", "h-32", "h-20"];
const MEDALS = ["🥈", "🥇", "🥉"];

export default function LeaderboardPodium({ rows }: { rows: LeaderboardRow[] }) {
  const top3 = rows.slice(0, 3);
  if (top3.length < 3) return null;

  return (
    <div className="flex items-end justify-center gap-4 mb-8">
      {PODIUM_ORDER.map((originalIdx, visualIdx) => {
        const row = top3[originalIdx];
        if (!row) return null;
        const tier = getTitleForRating(row.rating);
        return (
          <div key={row.userId} className="flex flex-col items-center w-36">
            <div className="text-2xl mb-1">{MEDALS[visualIdx]}</div>
            <div className="text-sm font-semibold truncate max-w-full">{row.name}</div>
            <div className="text-xs font-medium mb-2" style={{ color: tier.color }}>
              {tier.icon} {row.rating}
            </div>
            <div className={`w-full bg-muted rounded-t-lg ${HEIGHTS[visualIdx]} flex items-start justify-center pt-2`}>
              <span className="font-mono font-bold text-lg">#{row.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

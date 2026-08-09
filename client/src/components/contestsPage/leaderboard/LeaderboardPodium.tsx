"use client";

import React from "react";
import { getTitleForRating } from "@/lib/titles";
import type { LeaderboardRow } from "@/features/contestStore";

type LeaderboardPodiumProps = {
  top3: LeaderboardRow[];
};

const PODIUM_ORDER = [1, 0, 2];
const PODIUM_STYLE = ["podium-2", "podium-1", "podium-3"];
const PODIUM_HEIGHT = ["h-28", "h-36", "h-24"];
const MEDALS = ["🥈", "🥇", "🥉"];

export default function LeaderboardPodium({ top3 }: LeaderboardPodiumProps) {
  if (top3.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {PODIUM_ORDER.map((idx, i) => {
        const r = top3[idx];
        if (!r) return <div key={i} />;
        const t = getTitleForRating(r.rating);
        return (
          <div
            key={r.userId}
            className={`rounded-2xl p-5 flex flex-col items-center justify-end ${PODIUM_HEIGHT[i]} ${PODIUM_STYLE[i]}`}
          >
            <div className="text-2xl mb-1">{MEDALS[i]}</div>
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mb-2">
              {r.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-sm font-semibold">{r.name}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: t.color }}>
              {t.icon} {t.name} · {r.rating}
            </div>
          </div>
        );
      })}
    </div>
  );
}

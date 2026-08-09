"use client";

import React from "react";
import { getTitleForRating } from "@/lib/titles";
import type { RatingHistoryPoint } from "@/features/contestStore";

type RatingGraphCardProps = {
  history: RatingHistoryPoint[];
};

const W = 640;
const H = 220;
const PAD = 30;

export default function RatingGraphCard({ history }: RatingGraphCardProps) {
  const ratings = history.map((h) => h.rating);
  const min = ratings.length ? Math.min(...ratings) - 40 : 1100;
  const max = ratings.length ? Math.max(...ratings) + 40 : 1300;
  const points = history.map((point, i) => {
    const x = PAD + i * ((W - 2 * PAD) / Math.max(1, history.length - 1));
    const y = H - PAD - ((point.rating - min) / (max - min)) * (H - 2 * PAD);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  return (
    <div className="card-modern p-5">
      <div className="text-sm font-semibold mb-3">Rating Graph</div>
      {history.length > 0 ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52">
          <path d={path} fill="none" stroke="#22c55e" strokeWidth={2.5} opacity={0.9} />
          {points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={getTitleForRating(history[i].rating).color} />
          ))}
        </svg>
      ) : (
        <div className="text-sm text-muted-foreground py-10 text-center">No rated contests yet.</div>
      )}
    </div>
  );
}

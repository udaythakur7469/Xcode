"use client";

import React from "react";
import { getTitleForRating } from "@/lib/titles";
import type { LeaderboardRow } from "@/features/contestStore";
import { useUserStore } from "@/features/userStore";

type LeaderboardTableRowProps = {
  row: LeaderboardRow;
  problemLabels: string[];
};

export default function LeaderboardTableRow({ row, problemLabels }: LeaderboardTableRowProps) {
  const { userData } = useUserStore();
  const tier = getTitleForRating(row.rating);
  const solvedByLabel = new Map(row.solvedProblems.map((s) => [s.label, s.submittedAtMins]));
  const isMe = userData?.id === row.userId;

  return (
    <tr className={`border-b last:border-0 ${isMe ? "bg-brand/5" : "hover:bg-muted/40"}`}>
      <td className="py-3 px-4 font-mono font-semibold text-sm">#{row.rank ?? "—"}</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold flex-shrink-0">
            {row.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="text-sm font-medium">
              {row.name} {isMe && <span className="text-brand text-xs">(you)</span>}
            </div>
            <div className="text-[11px] font-medium" style={{ color: tier.color }}>
              {tier.icon} {tier.name} · {row.rating}
            </div>
          </div>
        </div>
      </td>
      {problemLabels.map((label) => {
        const solvedAt = solvedByLabel.get(label);
        return (
          <td key={label} className="py-3 px-2 text-center">
            {solvedAt !== undefined ? (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-500 mx-auto text-[10px] font-mono font-semibold">
                {solvedAt}m
              </span>
            ) : (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-muted/30 text-muted-foreground/40 mx-auto text-xs">
                —
              </span>
            )}
          </td>
        );
      })}
      <td className="py-3 px-4 text-center font-mono text-sm">{row.penaltyMins}m</td>
      <td className="py-3 px-4 text-right font-mono text-sm">{row.totalPoints}</td>
      <td className="py-3 px-4 text-right font-mono text-sm">
        {row.ratingDelta !== null ? (
          <span className={row.ratingDelta >= 0 ? "text-emerald-500" : "text-destructive"}>
            {row.ratingDelta >= 0 ? "+" : ""}
            {row.ratingDelta}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

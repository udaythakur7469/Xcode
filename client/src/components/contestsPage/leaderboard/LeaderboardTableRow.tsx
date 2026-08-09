"use client";

import React from "react";
import { motion } from "framer-motion";
import { getTitleForRating } from "@/lib/titles";
import type { LeaderboardRow } from "@/features/contestStore";

type LeaderboardTableRowProps = {
  row: LeaderboardRow;
};

// Note: framer-motion's `layout` animation works by applying a CSS
// transform, and transform on <tr> has historically had inconsistent
// browser support (fine in current Chrome/Firefox/Safari, flaky in
// older ones). If rows don't visibly slide on your target browsers,
// swap LeaderboardTable's <table> for a CSS Grid layout (motion.div
// rows instead of motion.tr) — same approach, just without the
// table-row transform caveat.
export default function LeaderboardTableRow({ row }: LeaderboardTableRowProps) {
  const t = getTitleForRating(row.rating);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ layout: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } }}
      className="border-b last:border-0 row-hover"
    >
      <td className="py-3 px-4 rank-badge">#{row.rank ?? "—"}</td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
            {row.name.slice(0, 2).toUpperCase()}
          </span>
          {row.name}
          <span style={{ color: t.color }} className="text-xs font-semibold ml-1">
            {t.icon} {t.name}
          </span>
        </span>
      </td>
      <td className="py-3 px-4 text-center font-mono">{row.solvedCount}</td>
      <td className="py-3 px-4 text-center font-mono">{row.penaltyMins}m</td>
      <td className="py-3 px-4 text-right font-mono" style={{ color: t.color }}>
        {row.rating}
      </td>
      <td
        className={`py-3 px-4 text-right font-mono ${
          (row.ratingDelta ?? 0) > 0 ? "text-brand" : (row.ratingDelta ?? 0) < 0 ? "text-red-500" : "text-muted-foreground"
        }`}
      >
        {row.ratingDelta != null ? (row.ratingDelta >= 0 ? `+${row.ratingDelta}` : row.ratingDelta) : "—"}
      </td>
    </motion.tr>
  );
}

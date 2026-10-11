"use client";

import React from "react";
import moment from "moment";
import type { ContestProfile } from "@/features/contestStore";

export default function ContestHistoryCard({ history }: { history: ContestProfile["ratingHistory"] }) {
  return (
    <div className="bg-card border rounded-xl p-6">
      <h2 className="text-base font-semibold mb-4">Contest history</h2>
      {history.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">No contests played yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {[...history].reverse().map((h, i) => (
            <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
              <div>
                <div className="font-medium">{h.contestTitle}</div>
                <div className="text-xs text-muted-foreground">{moment(h.date).format("MMM D, YYYY")}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono">{h.rating}</span>
                <span className={`font-mono text-xs font-semibold w-12 text-right ${h.delta >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {h.delta >= 0 ? "+" : ""}
                  {h.delta}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

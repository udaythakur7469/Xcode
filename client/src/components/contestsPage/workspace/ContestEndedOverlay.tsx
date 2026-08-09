"use client";

import React from "react";
import { TimerOff } from "lucide-react";

export default function ContestEndedOverlay() {
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
      <div className="bg-card border rounded-xl p-8 max-w-sm text-center">
        <TimerOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <h2 className="text-lg font-bold">Contest has ended</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Submissions are closed. Your final standing and rating update will
          be posted to the leaderboard shortly.
        </p>
        <p className="text-xs text-muted-foreground mt-4">Returning to the lobby…</p>
      </div>
    </div>
  );
}

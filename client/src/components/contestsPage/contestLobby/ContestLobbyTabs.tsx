"use client";

import React, { useState } from "react";

const TABS = ["Overview", "Rules"] as const;

export default function ContestLobbyTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]>("Overview");

  return (
    <>
      <div className="flex gap-6 border-b mt-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === t ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {active === "Overview" && (
        <div className="mt-6 bg-card border rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4">How this contest works</h2>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <b className="text-foreground">Problems stay hidden until start.</b> You'll see every problem — title,
              difficulty, and point value — the moment the contest goes live, inside the workspace. Nothing is
              revealed here in the lobby.
            </p>
            <p>
              <b className="text-foreground">Scoring.</b> Each problem is worth points based on difficulty. Your
              total is the sum of points from problems you solve, ranked by total points, then by penalty time
              (lower is better) as a tiebreaker.
            </p>
            <p>
              <b className="text-foreground">Penalty time.</b> Every wrong submission before you solve a problem
              adds 10 minutes to that problem's penalty. Unsolved problems don't add any penalty.
            </p>
            <p>
              <b className="text-foreground">Standings freeze at 75%.</b> The leaderboard stops updating live near
              the end — your rank stays hidden until the contest ends.
            </p>
          </div>
        </div>
      )}

      {active === "Rules" && (
        <div className="mt-6 bg-card border rounded-xl p-6 text-sm text-muted-foreground leading-relaxed">
          <ul className="list-disc list-inside space-y-2">
            <li>One account per participant — no sharing solutions during the contest window.</li>
            <li>You can use any supported language; switching languages mid-problem doesn't reset your penalty.</li>
            <li>Once the contest ends, you can still open it to practice — nothing you do afterward affects your rank or rating.</li>
          </ul>
        </div>
      )}
    </>
  );
}

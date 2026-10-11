"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ContestDetail } from "@/features/contestStore";

function useCountdown(target: string) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setLabel(days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [target]);
  return label;
}

type ContestLobbyHeroProps = {
  contest: ContestDetail;
  canEnterWorkspace: boolean;
  onRegister: () => void;
  onEnterWorkspace: () => void;
  isRegistering: boolean;
};

export default function ContestLobbyHero({
  contest,
  canEnterWorkspace,
  onRegister,
  onEnterWorkspace,
  isRegistering,
}: ContestLobbyHeroProps) {
  const countdown = useCountdown(contest.startTime);

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-8">
      <div className="flex justify-between items-start gap-8 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground bg-muted px-2.5 py-1 rounded-full mb-3">
            {contest.type} {contest.rated && `· Rated · ${contest.ratingWeight}× weight`}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{contest.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Standings freeze at the 75% mark — you won't see your final rank until the clock runs out.
          </p>
          <div className="flex gap-6 mt-4 flex-wrap">
            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide">Starts</div>
              <div className="font-mono font-semibold mt-1 text-sm">
                {new Date(contest.startTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide">Registered</div>
              <div className="font-mono font-semibold mt-1 text-sm">{contest.participantCount}</div>
            </div>
          </div>
        </div>

        <div className="text-right">
          {contest.status !== "ENDED" && (
            <>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">
                {contest.status === "LIVE" ? "Live now" : "Starts in"}
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-brand">
                {contest.status === "LIVE" ? "LIVE" : countdown}
              </div>
            </>
          )}
          {contest.status === "ENDED" && (
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Ended</div>
          )}

          {contest.status === "SCHEDULED" && !contest.isRegistered && (
            <Button className="mt-3" onClick={onRegister} disabled={isRegistering}>
              {isRegistering ? "Registering…" : "Register now →"}
            </Button>
          )}
          {contest.status === "SCHEDULED" && contest.isRegistered && (
            <div className="mt-3 text-sm text-emerald-500 font-medium">✓ You're registered</div>
          )}
          {canEnterWorkspace && (
            <Button className="mt-3" onClick={onEnterWorkspace}>
              {contest.status === "ENDED" ? "Practice this contest →" : "Enter Workspace →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

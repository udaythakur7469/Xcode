"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ContestSummary } from "@/features/contestStore";

function useCountdown(target: string) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [target]);
  return remaining;
}

export default function NextContestHero({ contest }: { contest: ContestSummary }) {
  const router = useRouter();
  const countdown = useCountdown(contest.startTime);
  const isLive = contest.status === "LIVE";

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-8 mb-9">
      <div className="flex justify-between items-end gap-8 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-brand bg-brand/10 border border-brand/20 px-2.5 py-1 rounded-full mb-3">
            ● {isLive ? "Live now" : "Next up"} — {contest.title.split(" ").slice(0, 2).join(" ")}
          </div>
          <h1 className="text-2xl font-bold tracking-tight max-w-lg">{contest.title}</h1>
          <div className="flex gap-6 mt-4 flex-wrap">
            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide">Problems</div>
              <div className="font-mono font-semibold mt-1">{contest.problemCount}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide">Rating weight</div>
              <div className="font-mono font-semibold mt-1">{contest.ratingWeight}×</div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide">Registered</div>
              <div className="font-mono font-semibold mt-1">{contest.participantCount}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          {!isLive && (
            <div className="flex gap-2">
              {[
                { v: countdown.days, l: "days" },
                { v: countdown.hours, l: "hrs" },
                { v: countdown.minutes, l: "min" },
              ].map((b) => (
                <div key={b.l} className="bg-background border rounded-lg px-3.5 py-2.5 text-center min-w-[62px]">
                  <div className="font-mono font-bold text-xl text-brand leading-none">{String(b.v).padStart(2, "0")}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide mt-1.5">{b.l}</div>
                </div>
              ))}
            </div>
          )}
          <Button className="w-full" onClick={() => router.push(`/contests/${contest.slug}`)}>
            {isLive ? "Enter contest →" : "View contest →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

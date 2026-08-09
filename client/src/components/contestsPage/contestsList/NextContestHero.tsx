"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";
import type { Contest } from "@/features/contestStore";

type NextContestHeroProps = {
  contest: Contest;
};

export default function NextContestHero({ contest }: NextContestHeroProps) {
  const router = useRouter();
  const countdown = useCountdown(contest.startTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-modern hero-mesh p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-widest text-brand font-semibold">
              Next up
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-soft text-brand">
              <span className="h-1.5 w-1.5 rounded-full live-dot-brand" /> Registration open
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{contest.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {new Date(contest.startTime).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">
            Starts in
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-brand">{countdown}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-5">
        <Button className="btn-brand" onClick={() => router.push(`/contests/${contest.slug}`)}>
          View contest page
        </Button>
        <span className="text-xs text-muted-foreground">
          {contest._count.participants.toLocaleString()} registered
        </span>
      </div>
    </motion.div>
  );
}

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";
import type { Contest } from "@/features/contestStore";

type ContestLobbyHeroProps = {
  contest: Contest;
  onRegister: () => void;
  onEnterWorkspace: () => void;
  canEnterWorkspace: boolean;
};

export default function ContestLobbyHero({ contest, onRegister, onEnterWorkspace, canEnterWorkspace }: ContestLobbyHeroProps) {
  const countdown = useCountdown(contest.status === "SCHEDULED" ? contest.startTime : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-modern hero-mesh p-7 mt-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-brand font-semibold mb-1">
            {contest.type}
          </div>
          <h1 className="text-3xl font-bold">{contest.title}</h1>
          <div className="text-sm text-muted-foreground mt-2">
            {contest._count.participants.toLocaleString()} participants registered
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
          {contest.status === "SCHEDULED" && (
            <Button className="mt-3 btn-brand" onClick={onRegister} disabled={contest.isRegistered}>
              {contest.isRegistered ? "Registered ✓" : "Register"}
            </Button>
          )}
          {canEnterWorkspace && (
            <Button className="mt-3 btn-brand" onClick={onEnterWorkspace}>
              Enter Workspace →
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

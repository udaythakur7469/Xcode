"use client";

import React, { useEffect, useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Activity, CircleCheckBig } from "lucide-react";
import { toTwoDecimals } from "@/services/acceptanceRateService";
import { formatCount } from "@/services/countService";

type StatsDialogProps = {
  stats: {
    totalSolved: number;
    totalAttempts: number;
    acceptanceRate: number;
  };
};

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const StatsDialog: React.FC<StatsDialogProps> = ({ stats }) => {
  const rate = Math.min(100, Math.max(0, Number(stats?.acceptanceRate) || 0));
  const ringColor =
    rate >= 60
      ? "text-green-500"
      : rate >= 30
        ? "text-yellow-400"
        : "text-red-500";

  // Start empty, then fill after mount so the ring animates on open
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const dashOffset = RING_CIRCUMFERENCE * (1 - (animated ? rate : 0) / 100);

  return (
    <DialogContent className="flex flex-col justify-center max-w-md">
      <DialogHeader>
        <DialogTitle className="flex justify-center m-0 p-0">
          <span className="text-4xl flex justify-center">Statistics</span>
        </DialogTitle>
        <DialogDescription className="flex justify-center items-center m-3 text-md">
          How the community is performing on this problem
        </DialogDescription>
      </DialogHeader>

      {/* Acceptance ring */}
      <div className="flex justify-center py-2">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="10"
              className="stroke-secondary"
            />
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className={`stroke-current transition-all duration-700 ease-out ${ringColor}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">
              {toTwoDecimals(stats?.acceptanceRate)}%
            </span>
            <span className="text-xs text-muted-foreground">Acceptance</span>
          </div>
        </div>
      </div>

      {/* Attempts & Accepted */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg border bg-secondary p-4">
          <Activity className="h-5 w-5 text-blue-500" />
          <span className="text-2xl font-semibold">
            {formatCount(stats?.totalAttempts ?? 0)}
          </span>
          <span className="text-xs text-muted-foreground">Attempts</span>
        </div>

        <div className="flex flex-col items-center gap-1 rounded-lg border bg-secondary p-4">
          <CircleCheckBig className="h-5 w-5 text-green-500" />
          <span className="text-2xl font-semibold">
            {formatCount(stats?.totalSolved ?? 0)}
          </span>
          <span className="text-xs text-muted-foreground">Accepted</span>
        </div>
      </div>
    </DialogContent>
  );
};

export default StatsDialog;

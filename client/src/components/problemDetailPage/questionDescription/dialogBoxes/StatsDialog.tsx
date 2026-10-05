"use client";

import React from "react";
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

const StatsDialog: React.FC<StatsDialogProps> = ({ stats }) => {
  const rate = Math.min(100, Math.max(0, Number(stats?.acceptanceRate) || 0));
  const barColor =
    rate >= 60 ? "bg-green-500" : rate >= 30 ? "bg-yellow-400" : "bg-red-500";

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

      {/* Acceptance rate */}
      <div className="rounded-lg border bg-secondary/50 p-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm text-muted-foreground">Acceptance rate</span>
          <span className="text-2xl font-bold">
            {toTwoDecimals(stats?.acceptanceRate)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* Attempts & Accepted */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg border bg-secondary/50 p-4">
          <Activity className="h-5 w-5 text-blue-500" />
          <span className="text-2xl font-semibold">
            {formatCount(stats?.totalAttempts)}
          </span>
          <span className="text-xs text-muted-foreground">Attempts</span>
        </div>

        <div className="flex flex-col items-center gap-1 rounded-lg border bg-secondary/50 p-4">
          <CircleCheckBig className="h-5 w-5 text-green-500" />
          <span className="text-2xl font-semibold">
            {formatCount(stats?.totalSolved)}
          </span>
          <span className="text-xs text-muted-foreground">Accepted</span>
        </div>
      </div>
    </DialogContent>
  );
};

export default StatsDialog;

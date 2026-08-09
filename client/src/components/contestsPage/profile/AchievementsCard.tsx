"use client";

import React from "react";
import type { Achievement } from "@/features/contestStore";

type AchievementsCardProps = {
  achievements: Achievement[];
};

export default function AchievementsCard({ achievements }: AchievementsCardProps) {
  return (
    <div className="card-modern p-5">
      <div className="text-sm font-semibold mb-3">Achievements</div>
      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
        {achievements.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full">No achievements unlocked yet.</div>
        )}
        {achievements.map((a) => (
          <div key={a.key} className="flex flex-col items-center gap-1 p-2 rounded-md border" title={a.category}>
            <div className="text-xl">{a.icon}</div>
            <div className="text-[10px] text-center leading-tight">{a.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

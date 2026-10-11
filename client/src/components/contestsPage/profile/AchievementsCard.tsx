"use client";

import React, { useEffect, useState } from "react";
import { useContestStore } from "@/features/contestStore";

type AchievementsCardProps = {
  achievements: { key: string; name: string; icon: string; category: string; unlockedAt: string }[];
};

export default function AchievementsCard({ achievements }: AchievementsCardProps) {
  const fetchAchievementCatalog = useContestStore((s) => s.fetchAchievementCatalog);
  const [loadedCatalog, setLoadedCatalog] = useState<
    { key: string; name: string; icon: string; category: string }[]
  >([]);

  useEffect(() => {
    fetchAchievementCatalog().then(setLoadedCatalog);
  }, [fetchAchievementCatalog]);

  const unlockedKeys = new Set(achievements.map((a) => a.key));
  const displayList = loadedCatalog.length > 0 ? loadedCatalog : achievements;

  return (
    <div className="bg-card border rounded-xl p-6">
      <h2 className="text-base font-semibold mb-4">
        Achievements
        <span className="text-muted-foreground font-normal text-sm ml-1.5">
          {achievements.length}/{loadedCatalog.length || achievements.length}
        </span>
      </h2>
      <div className="grid grid-cols-4 gap-2.5">
        {displayList.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full">No achievements unlocked yet.</div>
        )}
        {displayList.map((a) => {
          const isUnlocked = unlockedKeys.has(a.key);
          return (
            <div
              key={a.key}
              title={a.name}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border bg-muted/20 ${
                isUnlocked ? "" : "opacity-30 grayscale"
              }`}
            >
              <div className="text-xl">{a.icon}</div>
              <div className="text-[10px] text-center leading-tight">{a.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

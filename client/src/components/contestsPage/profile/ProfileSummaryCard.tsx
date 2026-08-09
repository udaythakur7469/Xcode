"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTitleForRating } from "@/lib/titles";
import type { ContestProfileData } from "@/features/contestStore";

type ProfileSummaryCardProps = {
  profile: ContestProfileData;
  userId: string;
};

export default function ProfileSummaryCard({ profile, userId }: ProfileSummaryCardProps) {
  const router = useRouter();
  const title = getTitleForRating(profile.user.contestRating);

  return (
    <div className="card-modern hero-mesh p-5 h-fit">
      <div className="flex flex-col items-center text-center">
        <div
          className="h-20 w-20 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold border-2"
          style={{ borderColor: title.color }}
        >
          {profile.user.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="mt-3 font-semibold text-lg">{profile.user.name}</div>
        <div className="text-sm font-semibold mt-0.5" style={{ color: title.color }}>
          {title.icon} {title.name}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5 text-center">
        <div className="stat-chip p-2.5">
          <div className="text-xs text-muted-foreground">Rating</div>
          <div className="text-lg font-bold font-mono">{profile.user.contestRating}</div>
        </div>
        <div className="stat-chip p-2.5">
          <div className="text-xs text-muted-foreground">Peak</div>
          <div className="text-lg font-bold font-mono">{profile.user.peakRating}</div>
        </div>
        <div className="stat-chip p-2.5 col-span-2">
          <div className="text-xs text-muted-foreground">Contests Played</div>
          <div className="text-lg font-bold font-mono">{profile.contestsPlayed}</div>
        </div>
      </div>
      <Button className="w-full mt-4 btn-brand" onClick={() => router.push(`/contests/journey/${userId}`)}>
        View Contest Journey →
      </Button>
    </div>
  );
}

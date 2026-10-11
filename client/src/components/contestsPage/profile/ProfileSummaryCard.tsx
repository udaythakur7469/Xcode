"use client";

import React from "react";
import { getTitleForRating } from "@/lib/titles";
import type { ContestProfile } from "@/features/contestStore";

export default function ProfileSummaryCard({ profile }: { profile: ContestProfile }) {
  const tier = getTitleForRating(profile.user.contestRating);

  return (
    <div className="flex items-center gap-5 bg-card border rounded-xl p-6 mb-6">
      <div className="w-[74px] h-[74px] rounded-full bg-gradient-to-br from-muted to-background border-2 flex-shrink-0" />
      <div className="flex-1">
        <div className="text-lg font-bold">{profile.user.name}</div>
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold mt-1" style={{ color: tier.color }}>
          {tier.icon} {tier.name} · Peak {profile.user.peakRating}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono font-extrabold text-4xl leading-none" style={{ color: tier.color }}>
          {profile.user.contestRating}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1.5">{profile.contestsPlayed} contests played</div>
      </div>
    </div>
  );
}

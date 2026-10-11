"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useContestStore } from "@/features/contestStore";
import ProfileSummaryCard from "./ProfileSummaryCard";
import RatingGraphCard from "./RatingGraphCard";
import AchievementsCard from "./AchievementsCard";
import ContestHistoryCard from "./ContestHistoryCard";

export default function ContestProfile() {
  const params = useParams();
  const userId = Number(params.userId);

  const { profile, loadingProfile, fetchProfile } = useContestStore();

  useEffect(() => {
    if (userId) fetchProfile(userId);
  }, [userId, fetchProfile]);

  if (loadingProfile || !profile) {
    return <div className="max-w-5xl mx-auto px-6 py-16 text-center text-muted-foreground">Loading profile…</div>;
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-9">
      <ProfileSummaryCard profile={profile} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <RatingGraphCard history={profile.ratingHistory} />
          <ContestHistoryCard history={profile.ratingHistory} />
        </div>
        <AchievementsCard achievements={profile.achievements} />
      </div>
    </main>
  );
}

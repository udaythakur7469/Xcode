"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useContestStore } from "@/features/contestStore";
import ProfileSummaryCard from "./ProfileSummaryCard";
import RatingGraphCard from "./RatingGraphCard";
import AchievementsCard from "./AchievementsCard";
import ContestHistoryCard from "./ContestHistoryCard";

export default function ContestProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { profile, fetchProfile } = useContestStore();

  useEffect(() => {
    if (userId) fetchProfile(parseInt(userId, 10));
  }, [userId, fetchProfile]);

  if (!profile) {
    return <div className="w-full px-5 pt-10 text-muted-foreground">Loading profile…</div>;
  }

  return (
    <div className="w-full px-5 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 pt-8">
        <ProfileSummaryCard profile={profile} userId={userId} />

        <div className="flex flex-col gap-6">
          <RatingGraphCard history={profile.ratingHistory} />
          <AchievementsCard achievements={profile.achievements} />
          <ContestHistoryCard history={profile.ratingHistory} />
        </div>
      </div>
    </div>
  );
}

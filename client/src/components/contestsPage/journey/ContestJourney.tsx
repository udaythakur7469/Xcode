"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContestStore } from "@/features/contestStore";
import JourneyHeroStats from "./JourneyHeroStats";
import AscentGraph from "./AscentGraph";
import JourneyTimeline from "./JourneyTimeline";

export default function ContestJourney() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { journey, fetchJourney } = useContestStore();
  const [selected, setSelected] = useState<number | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (userId) fetchJourney(parseInt(userId, 10));
  }, [userId, fetchJourney]);

  const selectMilestone = (index: number) => {
    setSelected(index);
    rowRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (journey.length === 0) {
    return (
      <div className="w-full px-5 pb-24">
        <button onClick={() => router.push(`/contests/profile/${userId}`)} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back to profile
        </button>
        <div className="text-sm text-muted-foreground mt-8">
          No milestones yet — play a rated contest to start the journey.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-5 pb-24">
      <button onClick={() => router.push(`/contests/profile/${userId}`)} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        ← Back to profile
      </button>

      <JourneyHeroStats journey={journey} />

      <AscentGraph journey={journey} selected={selected} onSelect={selectMilestone} />

      <JourneyTimeline journey={journey} selected={selected} onSelect={selectMilestone} rowRefs={rowRefs} />
    </div>
  );
}

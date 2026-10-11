"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import moment from "moment";
import { useContestStore } from "@/features/contestStore";

export default function ContestJourney() {
  const params = useParams();
  const userId = Number(params.userId);

  const { journey, loadingJourney, fetchJourney } = useContestStore();

  useEffect(() => {
    if (userId) fetchJourney(userId);
  }, [userId, fetchJourney]);

  if (loadingJourney) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-center text-muted-foreground">Loading journey…</div>;
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-9">
      <h1 className="text-xl font-bold mb-6">Journey</h1>
      {journey.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-16">No milestones yet — play a rated contest to start your journey.</div>
      ) : (
        <div className="relative pl-7">
          <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-border" />
          {journey.map((m, i) => (
            <div key={i} className="relative pb-7 last:pb-0">
              <div className="absolute -left-7 top-0.5 w-[18px] h-[18px] rounded-full bg-card border-2 border-brand" />
              <div className="text-xs font-mono text-muted-foreground">{moment(m.date).format("MMM YYYY")}</div>
              <div className="text-sm font-semibold mt-1">{m.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.description}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

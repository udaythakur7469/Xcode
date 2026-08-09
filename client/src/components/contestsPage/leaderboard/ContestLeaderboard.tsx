"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContestStore } from "@/features/contestStore";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useLiveLeaderboard } from "@/hooks/useLiveLeaderboard";
import LeaderboardHeader from "./LeaderboardHeader";
import LeaderboardPodium from "./LeaderboardPodium";
import LeaderboardTable from "./LeaderboardTable";

export default function ContestLeaderboard() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const {
    activeContest,
    fetchContestBySlug,
    leaderboard,
    leaderboardHasMore,
    leaderboardFrozen,
    fetchLeaderboard,
  } = useContestStore();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (slug) fetchContestBySlug(slug);
  }, [slug, fetchContestBySlug]);

  useEffect(() => {
    if (activeContest?.id) {
      setPage(1);
      fetchLeaderboard(activeContest.id, 1, q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContest?.id, q]);

  const loadMore = () => {
    if (!activeContest?.id) return;
    const next = page + 1;
    setPage(next);
    fetchLeaderboard(activeContest.id, next, q, true);
  };
  const sentinelRef = useInfiniteScroll(leaderboardHasMore, loadMore);

  const liveRows = useLiveLeaderboard(activeContest?.id, leaderboard, () => {
    if (activeContest?.id) fetchLeaderboard(activeContest.id, 1, q);
  });

  return (
    <div className="w-full px-5 pb-24">
      <button
        onClick={() => router.push(activeContest ? `/contests/${slug}` : "/contests")}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        ← Back
      </button>

      <LeaderboardHeader
        contest={activeContest}
        rowCount={liveRows.length}
        frozen={leaderboardFrozen}
        query={q}
        onQueryChange={setQ}
      />

      <LeaderboardPodium top3={liveRows.slice(0, 3)} />

      <LeaderboardTable rows={liveRows} hasMore={leaderboardHasMore} sentinelRef={sentinelRef} />
    </div>
  );
}

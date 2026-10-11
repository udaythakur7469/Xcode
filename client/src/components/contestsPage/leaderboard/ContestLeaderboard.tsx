"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useContestStore } from "@/features/contestStore";
import LeaderboardHeader from "./LeaderboardHeader";
import LeaderboardPodium from "./LeaderboardPodium";
import LeaderboardTable from "./LeaderboardTable";

export default function ContestLeaderboard() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    activeContest,
    fetchContestBySlug,
    leaderboardRows,
    leaderboardTotal,
    leaderboardIsFrozen,
    leaderboardProblemLabels,
    fetchLeaderboard,
  } = useContestStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (slug) fetchContestBySlug(slug);
  }, [slug, fetchContestBySlug]);

  useEffect(() => {
    if (!activeContest) return;
    setPage(1);
    const id = setTimeout(() => fetchLeaderboard(activeContest.id, 1, search), search ? 300 : 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContest?.id, search]);

  const handleLoadMore = () => {
    if (!activeContest) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeaderboard(activeContest.id, nextPage, search);
  };

  if (!activeContest) {
    return <div className="max-w-5xl mx-auto px-6 py-16 text-center text-muted-foreground">Loading leaderboard…</div>;
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-9">
      <LeaderboardHeader
        title={activeContest.title}
        total={leaderboardTotal}
        isFrozen={leaderboardIsFrozen}
        search={search}
        onSearchChange={setSearch}
      />
      {page === 1 && !search && <LeaderboardPodium rows={leaderboardRows} />}
      <LeaderboardTable
        rows={leaderboardRows}
        problemLabels={leaderboardProblemLabels}
        hasMore={leaderboardRows.length < leaderboardTotal}
        onLoadMore={handleLoadMore}
      />
    </main>
  );
}

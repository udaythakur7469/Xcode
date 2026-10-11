"use client";

import React, { useEffect, useState } from "react";
import { useContestStore } from "@/features/contestStore";
import NextContestHero from "./NextContestHero";
import ContestTabsSearch from "./ContestTabsSearch";
import ContestListItem from "./ContestListItem";
import MyRatingSidebar from "./MyRatingSidebar";

export default function ContestsList() {
  const { contests, nextContest, userRating, loadingList, fetchContests } = useContestStore();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => fetchContests(tab, search), search ? 300 : 0);
    return () => clearTimeout(id);
  }, [tab, search, fetchContests]);

  return (
    <main className="max-w-5xl mx-auto px-6 py-9">
      {nextContest && <NextContestHero contest={nextContest} />}
      <MyRatingSidebar rating={userRating} />
      <ContestTabsSearch tab={tab} onTabChange={setTab} search={search} onSearchChange={setSearch} />
      <div className="flex flex-col gap-2.5">
        {loadingList && contests.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">Loading contests…</div>
        ) : contests.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">No contests match your search.</div>
        ) : (
          contests.map((c) => <ContestListItem key={c.id} contest={c} />)
        )}
      </div>
    </main>
  );
}

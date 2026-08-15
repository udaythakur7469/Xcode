"use client";

import React, { useEffect, useState } from "react";
import { useContestStore } from "@/features/contestStore";
import { useUserStore } from "@/features/userStore";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Navbar from "@/components/landingPage/navbar/Navbar";
import NextContestHero from "./NextContestHero";
import ContestTabsSearch from "./ContestTabsSearch";
import ContestListItem from "./ContestListItem";
import MyRatingSidebar from "./MyRatingSidebar";
import { ContestsListSkeleton } from "./ContestsListSkeleton";

export default function ContestsList() {
  const { userData } = useUserStore();
  const {
    upcoming,
    past,
    upcomingHasMore,
    pastHasMore,
    loadingList,
    fetchContests,
  } = useContestStore();

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [q, setQ] = useState("");
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  useEffect(() => {
    fetchContests("upcoming", 1, q);
    fetchContests("past", 1, q);
    setUpcomingPage(1);
    setPastPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const loadMore = () => {
    if (tab === "upcoming") {
      const next = upcomingPage + 1;
      setUpcomingPage(next);
      fetchContests("upcoming", next, q, true);
    } else {
      const next = pastPage + 1;
      setPastPage(next);
      fetchContests("past", next, q, true);
    }
  };

const list = tab === "upcoming" ? upcoming : past;
const hasMore = tab === "upcoming" ? upcomingHasMore : pastHasMore;
const sentinelRef = useInfiniteScroll(hasMore, loadMore);
const nextContest = upcoming[0];

if (loadingList) {
  return (
    <>
      <Navbar
        buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]}
      />
      <ContestsListSkeleton />
    </>
  );
}

return (
  <>
    <Navbar buttons={["Explore Xcode", "Solve Problems", "Mock Interviews"]} />

    <div className="w-full px-5 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pt-8">
        <div>
          {nextContest && <NextContestHero contest={nextContest} />}

          <div className="mt-8">
            <ContestTabsSearch
              tab={tab}
              onTabChange={setTab}
              query={q}
              onQueryChange={setQ}
            />

            <div className="flex flex-col gap-3">
              {list.map((c) => (
                <ContestListItem key={c.id} contest={c} />
              ))}
              <div
                ref={sentinelRef}
                className="text-center text-xs text-muted-foreground py-4"
              >
                {hasMore
                  ? "Loading more…"
                  : list.length
                    ? "You've reached the end"
                    : "No contests match your search"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <MyRatingSidebar userData={userData} />
        </div>
      </div>
    </div>
  </>
);
}

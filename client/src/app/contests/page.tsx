"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useContestStore } from "@/features/contestStore";
import { useUserStore } from "@/features/userStore";
import { getTitleForRating } from "@/lib/titles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function useCountdown(target: string | null) {
  const [label, setLabel] = useState("--:--:--");
  useEffect(() => {
    if (!target) return;
    const targetMs = new Date(target).getTime();
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      const s = Math.floor(diff / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setLabel(`${h}:${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return label;
}

export default function ContestsHomePage() {
  const router = useRouter();
  const { userData } = useUserStore();
  const {
    upcoming,
    past,
    upcomingHasMore,
    pastHasMore,
    fetchContests,
  } = useContestStore();

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [q, setQ] = useState("");
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchContests("upcoming", 1, q);
    fetchContests("past", 1, q);
    setUpcomingPage(1);
    setPastPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const loadMore = useCallback(() => {
    if (tab === "upcoming" && upcomingHasMore) {
      const next = upcomingPage + 1;
      setUpcomingPage(next);
      fetchContests("upcoming", next, q, true);
    } else if (tab === "past" && pastHasMore) {
      const next = pastPage + 1;
      setPastPage(next);
      fetchContests("past", next, q, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, upcomingHasMore, pastHasMore, upcomingPage, pastPage, q]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const nextContest = upcoming[0];
  const countdown = useCountdown(nextContest?.startTime ?? null);

  const myRating = userData?.contestRating ?? 1200;
  const myTitle = getTitleForRating(myRating);

  const list = tab === "upcoming" ? upcoming : past;
  const hasMore = tab === "upcoming" ? upcomingHasMore : pastHasMore;

  return (
    <div className="max-w-[1400px] mx-auto px-5 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pt-8">
        <div>
          {nextContest && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-modern hero-mesh p-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs uppercase tracking-widest text-brand font-semibold">
                      Next up
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                      <span className="h-1.5 w-1.5 rounded-full live-dot-brand" /> Registration open
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold">{nextContest.title}</h1>
                  <div className="text-sm text-muted-foreground mt-1">
                    {new Date(nextContest.startTime).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">
                    Starts in
                  </div>
                  <div className="text-3xl font-bold font-mono tabular-nums text-brand">{countdown}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <Button className="btn-brand" onClick={() => router.push(`/contests/${nextContest.slug}`)}>
                  View contest page
                </Button>
                <span className="text-xs text-muted-foreground">
                  {nextContest._count.participants.toLocaleString()} registered
                </span>
              </div>
            </motion.div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex gap-1 border-b flex-1 min-w-0">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "upcoming" ? "border-brand" : "border-transparent text-muted-foreground"}`}
                  onClick={() => setTab("upcoming")}
                >
                  Upcoming Contests
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "past" ? "border-brand" : "border-transparent text-muted-foreground"}`}
                  onClick={() => setTab("past")}
                >
                  Past Contests
                </button>
              </div>
              <Input
                placeholder="Search contests…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-56"
              />
            </div>

            <div className="flex flex-col gap-3">
              {list.map((c) => (
                <motion.div
                  layout
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-modern card-modern-hover p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => router.push(`/contests/${c.slug}`)}
                >
                  <div>
                    <div className="text-xs text-brand font-medium">{c.type}</div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(c.startTime).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">View →</div>
                </motion.div>
              ))}
              <div ref={sentinelRef} className="text-center text-xs text-muted-foreground py-4">
                {hasMore ? "Loading more…" : list.length ? "You've reached the end" : "No contests match your search"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card-modern p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
              My Rating
            </div>
            {userData ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 rounded-lg border-2 flex items-center justify-center text-lg"
                    style={{ borderColor: myTitle.color }}
                  >
                    <span style={{ color: myTitle.color }}>{myTitle.icon}</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono">{myRating}</div>
                    <div className="text-sm font-semibold" style={{ color: myTitle.color }}>
                      {myTitle.icon} {myTitle.name}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push(`/contests/profile/${userData.id}`)}
                >
                  View full profile
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Sign up to get your first rating.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

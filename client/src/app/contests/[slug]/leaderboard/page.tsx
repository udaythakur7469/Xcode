"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useContestStore, LeaderboardRow } from "@/features/contestStore";
import { useSocket } from "@/context/socketContext";
import { getTitleForRating } from "@/lib/titles";
import { Input } from "@/components/ui/input";

export default function ContestLeaderboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { socket } = useSocket();
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
  const [liveRows, setLiveRows] = useState<LeaderboardRow[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    setLiveRows(leaderboard);
  }, [leaderboard]);

  const loadMore = useCallback(() => {
    if (!activeContest?.id || !leaderboardHasMore) return;
    const next = page + 1;
    setPage(next);
    fetchLeaderboard(activeContest.id, next, q, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContest?.id, leaderboardHasMore, page, q]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // Real-time updates: merge each incoming row into whatever page of the
  // leaderboard is currently loaded. framer-motion's `layout` prop on
  // each row (below) handles the FLIP-style slide animation whenever
  // this reorders the array — no manual position math needed client-side.
  useEffect(() => {
    if (!socket || !activeContest?.id) return;
    socket.emit("contest:join", activeContest.id);

    const onUpdate = (payload: LeaderboardRow & { name: string; rating: number }) => {
      setLiveRows((prev) => {
        const exists = prev.some((r) => r.userId === payload.userId);
        const updated = exists
          ? prev.map((r) => (r.userId === payload.userId ? { ...r, ...payload } : r))
          : prev; // a participant outside the currently-loaded page — ignore rather than guess their position
        return [...updated].sort(
          (a, b) => b.totalPoints - a.totalPoints || a.penaltyMins - b.penaltyMins,
        );
      });
    };
    socket.on("contest:leaderboard:update", onUpdate);
    const onFrozen = () => {
      if (activeContest?.id) fetchLeaderboard(activeContest.id, 1, q);
    };
    socket.on("contest:frozen", onFrozen);

    return () => {
      socket.emit("contest:leave", activeContest.id);
      socket.off("contest:leaderboard:update", onUpdate);
      socket.off("contest:frozen", onFrozen);
    };
  }, [socket, activeContest?.id]);

  const top3 = liveRows.slice(0, 3);
  const podiumOrder = [1, 0, 2];
  const podiumStyle = ["podium-2", "podium-1", "podium-3"];
  const podiumHeight = ["h-28", "h-36", "h-24"];
  const medals = ["🥈", "🥇", "🥉"];

  return (
    <div className="max-w-5xl mx-auto px-5 pb-24">
      <button
        onClick={() => router.push(activeContest ? `/contests/${slug}` : "/contests")}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="card-modern hero-mesh p-6 mt-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">
              {activeContest?.title ?? "Leaderboard"}
            </h1>
            {leaderboardFrozen ? (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                🔒 Frozen
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                <span className="h-1.5 w-1.5 rounded-full live-dot-brand live-pulse" /> live
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {leaderboardFrozen
              ? "Standings are frozen for the final stretch — real final results reveal when the contest ends."
              : `${activeContest?._count.participants.toLocaleString() ?? 0} competing · showing ${liveRows.length.toLocaleString()}`}
          </div>
        </div>
        <Input placeholder="Find a user…" value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
      </div>

      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6">
          {podiumOrder.map((idx, i) => {
            const r = top3[idx];
            if (!r) return <div key={i} />;
            const t = getTitleForRating(r.rating);
            return (
              <div
                key={r.userId}
                className={`rounded-2xl p-5 flex flex-col items-center justify-end ${podiumHeight[i]} ${podiumStyle[i]}`}
              >
                <div className="text-2xl mb-1">{medals[i]}</div>
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mb-2">
                  {r.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: t.color }}>
                  {t.icon} {t.name} · {r.rating}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card-modern mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium py-3 px-4">Rank</th>
              <th className="text-left font-medium py-3 px-4">User</th>
              <th className="text-center font-medium py-3 px-4">Solved</th>
              <th className="text-center font-medium py-3 px-4">Penalty</th>
              <th className="text-right font-medium py-3 px-4">Rating</th>
              <th className="text-right font-medium py-3 px-4">Δ Rating</th>
            </tr>
          </thead>
          <tbody className="max-h-[60vh] overflow-y-auto">
            {/* Note: framer-motion's `layout` animation works by applying a
                CSS transform, and transform on <tr> has historically had
                inconsistent browser support (fine in current Chrome/Firefox/
                Safari, flaky in older ones). If rows don't visibly slide on
                your target browsers, swap this table for a CSS Grid layout
                (motion.div rows instead of motion.tr) — same approach, just
                without the table-row transform caveat. */}
            <AnimatePresence initial={false}>
              {liveRows.map((r) => {
                const t = getTitleForRating(r.rating);
                return (
                  <motion.tr
                    layout
                    key={r.userId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ layout: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } }}
                    className="border-b last:border-0 row-hover"
                  >
                    <td className="py-3 px-4 rank-badge">#{r.rank ?? "—"}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-semibold">
                          {r.name.slice(0, 2).toUpperCase()}
                        </span>
                        {r.name}
                        <span style={{ color: t.color }} className="text-xs font-semibold ml-1">
                          {t.icon} {t.name}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{r.solvedCount}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.penaltyMins}m</td>
                    <td className="py-3 px-4 text-right font-mono" style={{ color: t.color }}>
                      {r.rating}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono ${
                        (r.ratingDelta ?? 0) > 0 ? "text-brand" : (r.ratingDelta ?? 0) < 0 ? "text-red-500" : "text-muted-foreground"
                      }`}
                    >
                      {r.ratingDelta != null ? (r.ratingDelta >= 0 ? `+${r.ratingDelta}` : r.ratingDelta) : "—"}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        <div ref={sentinelRef} className="text-center text-xs text-muted-foreground py-4">
          {leaderboardHasMore ? "Loading more…" : liveRows.length ? "You've reached the end" : "No users match your search"}
        </div>
      </div>
    </div>
  );
}

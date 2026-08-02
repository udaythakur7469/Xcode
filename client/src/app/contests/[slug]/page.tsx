"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useContestStore } from "@/features/contestStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TABS = ["rules", "prizes", "rating", "faq"] as const;
type Tab = (typeof TABS)[number];

export default function ContestLobbyPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { activeContest, loadingContest, fetchContestBySlug, registerForContest } =
    useContestStore();
  const [tab, setTab] = useState<Tab>("rules");
  const [countdown, setCountdown] = useState("--:--:--");

  useEffect(() => {
    if (slug) fetchContestBySlug(slug);
  }, [slug, fetchContestBySlug]);

  useEffect(() => {
    if (!activeContest) return;
    const targetMs = new Date(activeContest.startTime).getTime();
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      const s = Math.floor(diff / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setCountdown(`${h}:${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeContest]);

  if (loadingContest || !activeContest) {
    return <div className="max-w-4xl mx-auto px-5 pt-10 text-muted-foreground">Loading contest…</div>;
  }

  const handleRegister = async () => {
    const ok = await registerForContest(activeContest.id);
    if (ok) toast.success("Registered — we'll notify you before it starts.");
    else toast.error("Couldn't register — please sign in first.");
  };

  const canEnterWorkspace = activeContest.status === "LIVE" && activeContest.isRegistered;

  return (
    <div className="max-w-4xl mx-auto px-5 pb-24">
      <button
        onClick={() => router.push("/contests")}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        ← Back to Contests
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-modern hero-mesh p-7 mt-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand font-semibold mb-1">
              {activeContest.type}
            </div>
            <h1 className="text-3xl font-bold">{activeContest.title}</h1>
            <div className="text-sm text-muted-foreground mt-2">
              {activeContest._count.participants.toLocaleString()} participants registered
            </div>
          </div>
          <div className="text-right">
            {activeContest.status !== "ENDED" && (
              <>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">
                  {activeContest.status === "LIVE" ? "Live now" : "Starts in"}
                </div>
                <div className="text-3xl font-bold font-mono tabular-nums text-brand">
                  {activeContest.status === "LIVE" ? "LIVE" : countdown}
                </div>
              </>
            )}
            {activeContest.status === "SCHEDULED" && (
              <Button
                className="mt-3 btn-brand"
                onClick={handleRegister}
                disabled={activeContest.isRegistered}
              >
                {activeContest.isRegistered ? "Registered ✓" : "Register"}
              </Button>
            )}
            {canEnterWorkspace && (
              <Button
                className="mt-3 btn-brand"
                onClick={() => router.push(`/contests/${slug}/workspace`)}
              >
                Enter Workspace →
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="flex gap-1 border-b mt-6">
        {TABS.map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize ${tab === t ? "border-brand" : "border-transparent text-muted-foreground"}`}
            onClick={() => setTab(t)}
          >
            {t === "faq" ? "FAQ" : t === "rating" ? "Rating Changes" : t}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === "rules" && (
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>{activeContest.problems.length} problems, increasing difficulty.</li>
            <li>Wrong submissions add a +5 minute penalty against a problem, applied only once it's solved.</li>
            <li>Ranking is by total points, then by earliest last-accepted time.</li>
            <li>Plagiarism or multi-accounting results in disqualification and rating rollback.</li>
          </ul>
        )}
        {tab === "prizes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-modern card-modern-hover p-4">
              <div className="text-xs text-muted-foreground">Top 10</div>
              <div className="text-lg font-semibold mt-1 text-brand">Contest Winner badge + XP</div>
            </div>
            <div className="card-modern card-modern-hover p-4">
              <div className="text-xs text-muted-foreground">Top 100</div>
              <div className="text-lg font-semibold mt-1">Top 100 badge + XP</div>
            </div>
            <div className="card-modern card-modern-hover p-4">
              <div className="text-xs text-muted-foreground">All finishers</div>
              <div className="text-lg font-semibold mt-1">Participation XP + rating update</div>
            </div>
          </div>
        )}
        {tab === "rating" && (
          <p className="text-sm text-muted-foreground max-w-2xl">
            {activeContest.rated
              ? "Rated for everyone — there's no placement floor. Your rating moves based on how your rank compares to what your current rating predicted; beating higher-rated players moves you up faster. Deltas are published shortly after the contest ends."
              : "This contest is unrated — it won't affect your rating."}
          </p>
        )}
        {tab === "faq" && (
          <div className="space-y-3 max-w-2xl text-sm">
            <div>
              <div className="font-medium">What happens if I don't finish?</div>
              <div className="text-muted-foreground">Partial credit — you're ranked on what you solved.</div>
            </div>
            <div>
              <div className="font-medium">Is this contest rated?</div>
              <div className="text-muted-foreground">
                {activeContest.rated ? "Yes." : "No — practice/virtual contests are unrated."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useContestStore, JourneyMilestone } from "@/features/contestStore";
import { TITLES } from "@/lib/titles";

const TYPE_STYLE: Record<JourneyMilestone["type"], { label: string; bg: string; color: string }> = {
  start: { label: "Milestone", bg: "rgba(148,163,184,.15)", color: "#94a3b8" },
  title: { label: "Title Unlock", bg: "rgba(34,197,94,.15)", color: "#22c55e" },
  achievement: { label: "Achievement", bg: "rgba(168,85,247,.15)", color: "#a855f7" },
  peak: { label: "Peak Moment", bg: "rgba(249,115,22,.15)", color: "#f97316" },
};

const W = 900;
const H = 340;
const PAD_X = 30;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

export default function ContestJourneyPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { journey, fetchJourney } = useContestStore();
  const [selected, setSelected] = useState<number | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const timelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (userId) fetchJourney(parseInt(userId, 10));
  }, [userId, fetchJourney]);

  // ── Ascent graph geometry ────────────────────────────────────────────
  const { linePath, fillPath, points, tierBands } = useMemo(() => {
    if (journey.length === 0) {
      return { linePath: "", fillPath: "", points: [] as [number, number][], tierBands: [] as JSX.Element[] };
    }
    const ratings = journey.map((m) => m.rating);
    const minR = Math.min(...ratings) - 60;
    const maxR = Math.max(...ratings) + 60;
    const xFor = (i: number) => PAD_X + i * ((W - 2 * PAD_X) / Math.max(1, journey.length - 1));
    const yFor = (r: number) => H - PAD_BOTTOM - ((r - minR) / (maxR - minR)) * (H - PAD_TOP - PAD_BOTTOM);

    const points: [number, number][] = journey.map((m, i) => [xFor(i), yFor(m.rating)]);
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const fillPath =
      linePath +
      ` L${points[points.length - 1][0].toFixed(1)},${H - PAD_BOTTOM} L${points[0][0].toFixed(1)},${H - PAD_BOTTOM} Z`;

    const tierBands = TITLES.filter((t) => t.max > minR && t.min < maxR).map((t) => {
      const yTop = yFor(Math.min(t.max, maxR));
      const yBottom = yFor(Math.max(t.min, minR));
      return (
        <g key={t.name}>
          <rect x={PAD_X} y={yTop} width={W - 2 * PAD_X} height={yBottom - yTop} fill={t.color} opacity={0.05} />
          <text x={W - PAD_X - 6} y={yTop + 12} textAnchor="end" fontSize={10} fontFamily="monospace" opacity={0.55} fill={t.color}>
            {t.name}
          </text>
        </g>
      );
    });

    return { linePath, fillPath, points, tierBands };
  }, [journey]);

  // ── Progress line, driven by real scroll position through the timeline ──
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end center"],
  });
  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const selectMilestone = (index: number) => {
    setSelected(index);
    rowRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (journey.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-5 pb-24">
        <button onClick={() => router.push(`/contests/profile/${userId}`)} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back to profile
        </button>
        <div className="text-sm text-muted-foreground mt-8">
          No milestones yet — play a rated contest to start the journey.
        </div>
      </div>
    );
  }

  const peakRating = Math.max(...journey.map((m) => m.rating));
  const biggestGain = journey.find((m) => m.title === "Biggest Rating Gain");
  const since = new Date(journey[0].date).toLocaleDateString(undefined, { month: "short", year: "numeric" });

  // Rendered newest-first (top) to oldest-last (bottom) — the reverse of
  // the Ascent graph's left-to-right chronological order. `position`
  // (top-to-bottom slot) drives left/right alternation; `i` (the
  // original chronological index) is what the graph's nodes use, so
  // clicking a point up there still finds the right row down here.
  const reversedOrder = journey.map((m, i) => ({ m, i })).slice().reverse();

  return (
    <div className="max-w-4xl mx-auto px-5 pb-24">
      <button onClick={() => router.push(`/contests/profile/${userId}`)} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
        ← Back to profile
      </button>

      <div className="card-modern hero-mesh p-7 mt-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-[140px] font-bold leading-none opacity-[0.03] select-none pointer-events-none">∞</div>
        <div className="text-xs uppercase tracking-widest text-brand font-semibold mb-1">Your story so far</div>
        <h1 className="text-3xl font-bold">The Ascent</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-lg">
          Your rating climb through every tier, and the moments along the way.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="stat-chip p-3">
            <div className="text-xs text-muted-foreground">Peak Rating</div>
            <div className="text-lg font-bold font-mono">{peakRating}</div>
          </div>
          <div className="stat-chip p-3">
            <div className="text-xs text-muted-foreground">Milestones</div>
            <div className="text-lg font-bold font-mono">{journey.length}</div>
          </div>
          <div className="stat-chip p-3">
            <div className="text-xs text-muted-foreground">Biggest Gain</div>
            <div className="text-lg font-bold font-mono text-brand">
              {biggestGain ? biggestGain.description.match(/\+\d+/)?.[0] ?? "—" : "—"}
            </div>
          </div>
          <div className="stat-chip p-3">
            <div className="text-xs text-muted-foreground">Since</div>
            <div className="text-lg font-bold font-mono">{since}</div>
          </div>
        </div>
      </div>

      {/* ── The Ascent graph ──────────────────────────────────────────── */}
      <div className="card-modern p-5 md:p-7 mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Rating climb</div>
          <div className="text-xs text-muted-foreground">Tap a point for details</div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs>
            <linearGradient id="ascentFillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          {tierBands}
          <path d={fillPath} fill="url(#ascentFillGradient)" opacity={0.5} />
          <motion.path
            d={linePath}
            fill="none"
            stroke="#22c55e"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(34,197,94,.55))" }}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
          />
          {points.map(([x, y], i) => {
            const style = TYPE_STYLE[journey[i].type];
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={13}
                  fill="none"
                  stroke={style.color}
                  strokeWidth={2}
                  opacity={selected === i ? 0.55 : 0}
                  style={{ transition: "opacity .25s" }}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={selected === i ? 9 : 7}
                  fill={style.color}
                  className="cursor-pointer"
                  style={{ transition: "r .2s", filter: selected === i ? `drop-shadow(0 0 8px ${style.color})` : "none" }}
                  onClick={() => selectMilestone(i)}
                />
              </g>
            );
          })}
          <text x={points[points.length - 1][0]} y={points[points.length - 1][1] - 16} textAnchor="middle" fontSize={18}>
            🚩
          </text>
        </svg>
      </div>

      {/* ── Vertical timeline, newest at top ─────────────────────────── */}
      <div className="mt-12 mb-8">
        <div className="text-sm font-semibold mb-6">Journey Story</div>
        <div className="relative" ref={timelineRef}>
          <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-border opacity-25 rounded-full" />
          <motion.div
            className="absolute left-1/2 top-0 w-[3px] -translate-x-1/2 rounded-full"
            style={{
              height: progressHeight,
              background: "linear-gradient(180deg,#22c55e,#16a34a 60%,#22c55e)",
              boxShadow: "0 0 12px rgba(34,197,94,.6)",
            }}
          />
          {reversedOrder.map(({ m, i }, position) => {
            const style = TYPE_STYLE[m.type];
            const side = position % 2 === 0 ? "left" : "right";
            const isActive = selected === i;
            return (
              <div
                key={i}
                ref={(el) => { rowRefs.current[i] = el; }}
                className="relative grid grid-cols-[56px_1fr] md:grid-cols-[1fr_56px_1fr] items-start mb-11"
              >
                <div className="hidden md:flex col-start-1 justify-end pr-7">
                  {side === "left" && (
                    <JourneyCard m={m} style={style} active={isActive} onClick={() => selectMilestone(i)} align="right" />
                  )}
                </div>
                <div className="col-start-1 md:col-start-2 flex justify-center z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: isActive ? 1.18 : 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    onClick={() => selectMilestone(i)}
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl bg-card border-2 cursor-pointer"
                    style={{ borderColor: style.color, boxShadow: `0 0 0 4px ${style.color}22, 0 4px 18px ${style.color}55` }}
                  >
                    {m.icon}
                  </motion.div>
                </div>
                <div className="col-start-2 md:col-start-3 pl-5 md:pl-7">
                  <div className="md:hidden">
                    <JourneyCard m={m} style={style} active={isActive} onClick={() => selectMilestone(i)} align="left" />
                  </div>
                  <div className="hidden md:block">
                    {side === "right" && (
                      <JourneyCard m={m} style={style} active={isActive} onClick={() => selectMilestone(i)} align="left" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JourneyCard({
  m,
  style,
  active,
  onClick,
  align,
}: {
  m: JourneyMilestone;
  style: { label: string; bg: string; color: string };
  active: boolean;
  onClick: () => void;
  align: "left" | "right";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: align === "right" ? -24 : 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={onClick}
      className={`card-modern max-w-[340px] w-full p-4 cursor-pointer transition-all ${active ? "shadow-[0_8px_34px_-10px_rgba(34,197,94,.35)] !border-[rgba(34,197,94,.5)] -translate-y-0.5" : ""}`}
    >
      <span
        className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
        style={{ background: style.bg, color: style.color }}
      >
        {style.label}
      </span>
      <div className="text-xs text-muted-foreground font-medium">
        {new Date(m.date).toLocaleDateString(undefined, { month: "short", year: "numeric" })} · Rating {m.rating}
      </div>
      <div className="font-semibold mt-0.5">{m.title}</div>
      <div className="text-sm text-muted-foreground mt-1">{m.description}</div>
    </motion.div>
  );
}

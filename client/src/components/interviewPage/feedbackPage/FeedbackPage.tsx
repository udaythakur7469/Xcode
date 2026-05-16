"use client";

import React from "react";
import {
  Feedback,
  Interview,
  FeedbackHistoryData,
} from "@/features/interviewStore";
import moment from "moment";
import { House, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Sub-components
import { ScoreRing } from "./ScoreRing";
import { RadarChartComponent } from "./RadarChart";
import { HistoryChart } from "./HistoryChart";
import { TalkTimeRatio } from "./TalkTimeRatio";
import { ConfidenceTimeline } from "./ConfidenceTimeline";
import { QuestionHeatmap } from "./QuestionHeatmap";
import { KeyMoments } from "./KeyMoments";
import { RecommendedTopics } from "./RecommendedTopics";
import { AttemptComparison } from "./AttemptComparison";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackPageProps = {
  feedback: Feedback | null;
  interview: Interview | null;
  feedbackHistory: FeedbackHistoryData | null;
};

// ─── Verdict config ───────────────────────────────────────────────────────────

const VERDICT_CONFIG: Record<string, { label: string; chipClass: string }> = {
  MUST_HIRE: {
    label: "Must Hire",
    chipClass:
      "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500",
  },
  RECOMMENDED: {
    label: "Recommended",
    chipClass:
      "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500",
  },
  WORTH_CONSIDERING: {
    label: "Worth Considering",
    chipClass: "bg-amber-500/10 border border-amber-500/30 text-amber-500",
  },
  PREFER_NOT_TO_HIRE: {
    label: "Prefer Not To Hire",
    chipClass: "bg-amber-500/10 border border-amber-500/30 text-amber-500",
  },
  NOT_RECOMMENDED: {
    label: "Not Recommended",
    chipClass: "bg-red-500/10 border border-red-500/30 text-red-500",
  },
  DO_NOT_HIRE: {
    label: "Do Not Hire",
    chipClass: "bg-red-500/10 border border-red-500/30 text-red-500",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryBadge(score: number): {
  label: string;
  badgeClass: string;
} {
  if (score >= 80)
    return {
      label: "Strong",
      badgeClass:
        "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500",
    };
  if (score >= 65)
    return {
      label: "Good",
      badgeClass: "bg-blue-600/10 border border-blue-600/20 text-blue-400",
    };
  if (score >= 50)
    return {
      label: "Moderate",
      badgeClass: "bg-amber-500/10 border border-amber-500/20 text-amber-500",
    };
  return {
    label: "Weak",
    badgeClass: "bg-red-500/10 border border-red-500/20 text-red-500",
  };
}

function getProgressColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 65) return "#2563eb";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

// ─── Section heading shared component ────────────────────────────────────────

function SectionHead({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm flex-shrink-0">
        {icon}
      </div>
      <h2
        className="text-lg font-bold tracking-[-0.02em] text-foreground"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {title}
      </h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const FeedbackPage: React.FC<FeedbackPageProps> = ({
  feedback,
  interview,
  feedbackHistory,
}) => {
  const router = useRouter();
  // ALL hooks must be above any early return — Rules of Hooks
  const avgCategoryScores = React.useMemo(() => {
    if (!feedbackHistory?.history?.length) return undefined;
    const allCats: Record<string, number[]> = {};
    for (const entry of feedbackHistory.history) {
      for (const cat of entry.categoryScores) {
        if (!allCats[cat.name]) allCats[cat.name] = [];
        allCats[cat.name].push(cat.score);
      }
    }
    return Object.entries(allCats).map(([name, scores]) => ({
      name,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
  }, [feedbackHistory]);

  if (!feedback || !interview) return null;

  const formattedDate = moment(feedback.createdAt).format(
    "MMM D, YYYY · h:mm A",
  );
  const totalScore = Math.round(feedback.totalScore ?? 0);
  const verdictKey = feedback.finalVerdict as string;
  const verdictConfig = VERDICT_CONFIG[verdictKey] ?? {
    label: verdictKey,
    chipClass: "bg-secondary border border-border text-muted-foreground",
  };

  const interviewTypeLabel = interview.type ?? "TECHNICAL";
  const techStackStr = interview.techStack?.join(" · ") ?? "";

  // History-derived stats
  const percentile = feedbackHistory?.percentile ?? null;
  const userAvg = feedbackHistory?.userAvg ?? null;
  const avgDiff = userAvg !== null ? totalScore - Math.round(userAvg) : null;

  return (
    <div
      className="w-full px-5 sm:px-5 pt-10 pb-24"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center mb-10 p-8 md:p-10 rounded-2xl border border-border bg-card shadow-sm relative overflow-hidden">
        <div>
          {/* Eyebrow */}
          <div
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            Interview Feedback Report
            <span className="text-muted-foreground/50">#{interview.id}</span>
          </div>

          {/* Title */}
          <h1
            className="text-[clamp(24px,3.5vw,38px)] font-extrabold leading-[1.1] tracking-[-0.04em] text-foreground mb-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {interview.role}
          </h1>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium border bg-blue-600/10 border-blue-600/25 text-blue-400"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              ⬡ {interviewTypeLabel}
            </span>
            {interview.level && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] border bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {interview.level.toUpperCase()} LEVEL
              </span>
            )}
            {techStackStr && (
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] border bg-border/50 border-border text-muted-foreground"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {techStackStr}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] border bg-border/50 border-border text-muted-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Score ring + verdict */}
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={totalScore} />
          <div
            className={cn(
              "px-5 py-2 rounded-full text-[12px] font-bold uppercase tracking-[0.04em] text-center",
              verdictConfig.chipClass,
            )}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {verdictConfig.label}
          </div>
        </div>
      </section>

      {/* ─── Quick stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-10 w-full">
        {[
          {
            val: totalScore,
            label: "Overall Score",
            color: "text-blue-400",
          },
          {
            val: percentile !== null ? `${percentile}th` : "—",
            label: "Percentile Rank",
            color: "text-cyan-400",
          },
          {
            val:
              avgDiff !== null ? `${avgDiff >= 0 ? "+" : ""}${avgDiff}` : "—",
            label: "vs. Your Average",
            color:
              avgDiff === null
                ? "text-muted-foreground"
                : avgDiff >= 0
                  ? "text-emerald-500"
                  : "text-red-500",
          },
        ].map(({ val, label, color }) => (
          <div
            key={label}
            className="text-center p-4 rounded-xl bg-card border border-border shadow-sm"
          >
            <div
              className={cn(
                "text-[26px] font-extrabold leading-none tracking-[-0.04em] mb-1",
                color,
              )}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {val}
            </div>
            <div
              className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Radar + History row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 w-full">
        {/* Radar */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/30 transition-colors">
          <SectionHead icon="📡" title="Skill Radar" />
          <div className="flex gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-[10px] h-[10px] rounded-sm bg-blue-600" />
              This interview
            </div>
            {avgCategoryScores && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-[10px] h-[10px] rounded-sm bg-blue-600/25" />
                Your average
              </div>
            )}
          </div>
          {feedback.categoryScores && (
            <RadarChartComponent
              categoryScores={feedback.categoryScores}
              averageScores={avgCategoryScores}
            />
          )}
        </div>

        {/* History chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/30 transition-colors">
          <SectionHead icon="📈" title="Score History" />
          <div className="flex gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-[10px] h-[10px] rounded-sm bg-blue-600" />
              Your scores
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-[10px] h-[10px] rounded-sm bg-cyan-400/60" />
              Platform avg
            </div>
          </div>
          {feedbackHistory && feedbackHistory.history.length > 0 ? (
            <HistoryChart
              history={feedbackHistory.history}
              platformAvg={feedbackHistory.platformAvg}
              currentInterviewId={interview.id!}
            />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              Complete more interviews to see your history
            </div>
          )}
          <p
            className="text-[11px] text-muted-foreground mt-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {interview.type?.charAt(0) + interview.type?.slice(1).toLowerCase()}{" "}
            roles · {feedbackHistory?.history.length ?? 1} attempt
            {(feedbackHistory?.history.length ?? 1) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ─── Percentile benchmark ─────────────────────────────────────────── */}
      {percentile !== null && (
        <div className="mb-10">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/30 transition-colors">
            <SectionHead icon="🎯" title="Benchmark" />
            <p className="text-[14px] text-muted-foreground mb-1">
              You scored better than{" "}
              <strong
                className="text-cyan-400"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {percentile}%
              </strong>{" "}
              of all candidates for {interviewTypeLabel} interviews on this
              platform.
            </p>
            {/* Bar */}
            <div className="h-[10px] bg-secondary rounded-full overflow-hidden relative mt-4 mb-2">
              <div
                className="h-full rounded-full transition-all duration-[1.4s] ease-out"
                style={{
                  width: `${percentile}%`,
                  background: "linear-gradient(90deg, #2563eb, #22d3ee)",
                }}
              />
            </div>
            <div
              className="flex justify-between text-[11px] text-muted-foreground mb-4"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {["0th", "25th", "50th", "75th", "100th"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <div className="flex gap-6 flex-wrap">
              {[
                {
                  val: feedbackHistory?.platformAvg ?? "—",
                  label: "Platform avg score",
                },
                {
                  val: interviewTypeLabel,
                  label: "Interview type filter",
                },
              ].map(({ val, label }) => (
                <div key={label} className="text-[13px] text-muted-foreground">
                  <span
                    className="text-foreground"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {val}
                  </span>{" "}
                  · {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── #1 Talk-time ratio ───────────────────────────────────────────── */}
      {feedback.candidateTalkRatio != null && (
        <div className="mb-10">
          <TalkTimeRatio
            candidateTalkRatio={Math.round(feedback.candidateTalkRatio)}
          />
        </div>
      )}

      {/* ─── #3 Confidence timeline ───────────────────────────────────────── */}
      {feedback.questionScores && feedback.questionScores.length > 0 && (
        <div className="mb-10">
          <ConfidenceTimeline questionScores={feedback.questionScores} />
        </div>
      )}

      {/* ─── #2 Answer quality heatmap ───────────────────────────────────── */}
      {feedback.questionScores && feedback.questionScores.length > 0 && (
        <div className="mb-10">
          <QuestionHeatmap questionScores={feedback.questionScores} />
        </div>
      )}

      {/* ─── Category breakdown ───────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
            📊
          </div>
          <h2
            className="text-lg font-bold tracking-[-0.02em] text-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Category Breakdown
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {feedback.categoryScores?.map((cat, i) => {
            const badge = getCategoryBadge(cat.score ?? 0);
            const isLast =
              i === (feedback.categoryScores?.length ?? 0) - 1 &&
              (feedback.categoryScores?.length ?? 0) % 2 !== 0;
            return (
              <div
                key={cat.id ?? cat.name}
                className={cn(
                  "rounded-2xl border border-border bg-card p-5 hover:border-blue-600/30 transition-colors",
                  isLast && "md:col-span-2",
                )}
              >
                <div
                  className="text-[14px] font-bold text-foreground mb-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {cat.name}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[22px] font-medium text-blue-400"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {Math.round(cat.score ?? 0)}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] px-3 py-0.5 rounded-full border",
                      badge.badgeClass,
                    )}
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {badge.label}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-[5px] bg-secondary rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-[1.2s]"
                    style={{
                      width: `${cat.score ?? 0}%`,
                      background: getProgressColor(cat.score ?? 0),
                    }}
                  />
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {cat.comment}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── #4 Key moments ───────────────────────────────────────────────── */}
      {feedback.keyMoments && feedback.keyMoments.length > 0 && (
        <div className="mb-10">
          <KeyMoments keyMoments={feedback.keyMoments} />
        </div>
      )}

      {/* ─── Strengths + Improvements ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        {/* Strengths */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/30 transition-colors">
          <SectionHead icon="✦" title="Strengths" />
          <div className="flex flex-col gap-2">
            {feedback.strengths?.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-[10px] bg-emerald-500/[0.08] border border-emerald-500/15 text-[13.5px] text-foreground leading-relaxed"
              >
                <span className="text-emerald-500 text-[14px] mt-0.5 flex-shrink-0">
                  ✓
                </span>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Areas for improvement */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/30 transition-colors">
          <SectionHead icon="⟳" title="Areas for Improvement" />
          <div className="flex flex-col gap-2">
            {feedback.areasForImprovement?.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-[10px] bg-amber-500/[0.08] border border-amber-500/15 text-[13.5px] text-foreground leading-relaxed"
              >
                <span className="text-amber-500 text-[14px] mt-0.5 flex-shrink-0">
                  △
                </span>
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── #5 Recommended topics ────────────────────────────────────────── */}
      {feedback.recommendedTopics && feedback.recommendedTopics.length > 0 && (
        <div className="mb-10">
          <RecommendedTopics topics={feedback.recommendedTopics} />
        </div>
      )}

      {/* ─── Final assessment ─────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
            📝
          </div>
          <h2
            className="text-lg font-bold tracking-[-0.02em] text-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Final Assessment
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="bg-secondary border border-l-[3px] border-blue-600/30 border-l-blue-600 rounded-r-[10px] p-5 text-[14.5px] text-muted-foreground leading-[1.8] italic">
          {feedback.finalAssessment}
        </div>
      </div>

      {/* ─── #6 Attempt comparison ────────────────────────────────────────── */}
      {feedbackHistory && interview.id && (
        <div className="mb-10">
          <AttemptComparison
            historyData={feedbackHistory}
            currentInterviewId={interview.id}
            role={interview.role}
          />
        </div>
      )}

      {/* ─── Verdict banner ───────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center justify-between gap-4 flex-wrap p-6 rounded-2xl border mb-10",
          verdictKey === "MUST_HIRE" || verdictKey === "RECOMMENDED"
            ? "bg-emerald-500/10 border-emerald-500/20"
            : verdictKey === "WORTH_CONSIDERING" ||
                verdictKey === "PREFER_NOT_TO_HIRE"
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-red-500/10 border-red-500/20",
        )}
      >
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-1"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Final Verdict
          </div>
          <div
            className={cn(
              "text-[26px] font-extrabold tracking-[-0.04em]",
              verdictConfig.chipClass
                .split(" ")
                .find((c) => c.startsWith("text-")) ?? "text-foreground",
            )}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {verdictConfig.label}
          </div>
          <div className="text-[13px] text-muted-foreground mt-1">
            Score {totalScore}/100
            {percentile !== null && ` · ${percentile}th percentile`}
            {" · "}
            {interviewTypeLabel} interview
          </div>
        </div>
        <div
          className="text-[13px] text-muted-foreground text-right"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          <div>Generated by AI Interviewer</div>
          <div className="mt-1">
            {moment(feedback.createdAt).format("MMM D, YYYY")}
          </div>
        </div>
      </div>

      {/* ─── Action buttons ───────────────────────────────────────────────── */}
      <div className="flex gap-4 justify-center flex-wrap">
        <button
          onClick={() => router.push("/interview")}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[15px] border-none cursor-pointer hover:bg-[#1D4ED8] transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(37,99,235,0.3)]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <House size={18} />
          Go to Home
        </button>
        <button
          onClick={() =>
            router.push(`/interview/practice-interview/${interview.id}`)
          }
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-[15px] border border-emerald-500/25 cursor-pointer hover:bg-emerald-500/18 transition-all hover:-translate-y-0.5"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <RotateCcw size={18} />
          Retake Interview
        </button>
      </div>
    </div>
  );
};

export default FeedbackPage;

"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";
import { QuestionScore } from "@/features/interviewStore";

interface ConfidenceTimelineProps {
  questionScores: QuestionScore[];
}

interface InsightChip {
  label: string;
  variant: "up" | "down" | "flat";
}

function getInsights(scores: QuestionScore[]): InsightChip[] {
  const chips: InsightChip[] = [];
  if (!scores.length) return chips;

  const early = scores.slice(0, Math.ceil(scores.length / 3));
  const late = scores.slice(-Math.ceil(scores.length / 3));
  const mid = scores.slice(
    Math.ceil(scores.length / 3),
    scores.length - Math.ceil(scores.length / 3),
  );

  const avg = (arr: QuestionScore[]) =>
    arr.reduce((s, q) => s + q.score, 0) / arr.length;

  const earlyAvg = avg(early);
  const midAvg = mid.length ? avg(mid) : earlyAvg;
  const lateAvg = avg(late);

  if (earlyAvg >= 75) chips.push({ label: "↑ Strong start", variant: "up" });
  else if (earlyAvg < 55)
    chips.push({ label: "↓ Slow start", variant: "down" });

  if (midAvg < earlyAvg - 10)
    chips.push({ label: "↓ Mid dip", variant: "down" });
  else if (midAvg > earlyAvg + 10)
    chips.push({ label: "↑ Mid surge", variant: "up" });

  if (lateAvg >= midAvg - 3)
    chips.push({ label: "↑ Recovered well", variant: "up" });
  else chips.push({ label: "↓ Faded late", variant: "down" });

  return chips;
}

const DOT_COLORS = (score: number) => {
  if (score >= 80) return "#10b981";
  if (score >= 65) return "#2563eb";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const color = DOT_COLORS(payload.score);
  return <circle cx={cx} cy={cy} r={5} fill={color} strokeWidth={0} />;
};

export const ConfidenceTimeline: React.FC<ConfidenceTimelineProps> = ({
  questionScores,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#7a7a9a" : "#8888aa";
  const labelColor = isDark ? "#f0f0f8" : "#16162a";
  const bgCard2 = isDark ? "#161622" : "#f0effe";

  const chartData = questionScores.map((q) => ({
    label: `Q${q.questionNumber}`,
    score: Math.round(q.score),
    // quality mirrors score in this chart — same source, different visual treatment
    quality: Math.round(q.score),
  }));

  const insights = useMemo(() => getInsights(questionScores), [questionScores]);

  const chipStyle = {
    up: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500",
    down: "bg-amber-500/10 border border-amber-500/20 text-amber-500",
    flat: "bg-blue-600/10 border border-blue-600/20 text-blue-400",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-blue-600/40 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-[30px] h-[30px] rounded-lg bg-blue-600/15 border border-blue-600/40 flex items-center justify-center text-sm">
          📉
        </div>
        <h2
          className="text-lg font-bold tracking-[-0.02em] text-foreground"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Confidence Timeline
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-[10px] h-[10px] rounded-sm bg-blue-600" />
          Confidence score
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-[10px] h-[10px] rounded-sm bg-cyan-400/60" />
          Answer quality
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
          {/* Danger zone — below 50 */}
          <ReferenceLine
            y={50}
            stroke="rgba(239,68,68,0.2)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <XAxis
            dataKey="label"
            tick={{
              fill: tickColor,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
            }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            domain={[30, 100]}
            tick={{
              fill: tickColor,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
            }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              background: bgCard2,
              border: "1px solid rgba(37,99,235,0.25)",
              borderRadius: 10,
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: labelColor,
            }}
            formatter={(value: number, name: string) => [
              `${value}/100`,
              name === "score" ? "Confidence" : "Answer Quality",
            ]}
          />
          {/* Confidence line with colour-coded dots */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={{ r: 7 }}
            fill="rgba(37,99,235,0.07)"
          />
          {/* Answer quality — dashed overlay */}
          <Line
            type="monotone"
            dataKey="quality"
            stroke="rgba(34,211,238,0.6)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Phase labels */}
      <div
        className="grid text-center text-[10px] uppercase tracking-[0.06em] text-muted-foreground mt-1"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        <span>Early</span>
        <span>Mid</span>
        <span>Late</span>
      </div>

      {/* Insight chips */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {insights.map((chip, i) => (
          <span
            key={i}
            className={`px-3 py-1 rounded-full text-xs border ${chipStyle[chip.variant]}`}
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
};

"use client";

import React from "react";
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
import { FeedbackHistoryEntry } from "@/features/interviewStore";
import moment from "moment";

interface HistoryChartProps {
  history: FeedbackHistoryEntry[];
  platformAvg: number;
  currentInterviewId: number;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({
  history,
  platformAvg,
  currentInterviewId,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#7a7a9a" : "#8888aa";
  const labelColor = isDark ? "#f0f0f8" : "#16162a";
  const bgCard2 = isDark ? "#161622" : "#f0effe";

  const chartData = history.map((entry) => ({
    date: moment(entry.createdAt).format("MMM D"),
    score: Math.round(entry.totalScore),
    isCurrent: entry.interviewId === currentInterviewId,
  }));

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isCurrent) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#2563eb"
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return <circle cx={cx} cy={cy} r={4} fill="#2563eb" />;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
      >
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{
            fill: tickColor,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
          }}
          axisLine={{ stroke: gridColor }}
          tickLine={false}
        />
        <YAxis
          domain={[40, 100]}
          tick={{
            fill: tickColor,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
          }}
          axisLine={{ stroke: gridColor }}
          tickLine={false}
          tickCount={4}
        />
        {/* Platform average reference line */}
        <ReferenceLine
          y={platformAvg}
          stroke="rgba(34,211,238,0.6)"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{
            value: `Avg ${platformAvg}`,
            position: "insideTopRight",
            fill: "rgba(34,211,238,0.8)",
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
          }}
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
          formatter={(value) => [`${value ?? 0}/100`, "Score"]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={<CustomDot />}
          activeDot={{ r: 7, fill: "#2563eb" }}
          fill="rgba(37,99,235,0.08)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

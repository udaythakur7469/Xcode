"use client";

import React from "react";
import {
  RadarChart as RechartsRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useTheme } from "next-themes";
import { CategoryScore } from "@/features/interviewStore";

interface RadarChartProps {
  categoryScores: CategoryScore[];
  // Optional: user's historical average per category for the dashed overlay
  averageScores?: { name: string; score: number }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  "Communication Skills": "Communication",
  "Technical Knowledge": "Technical",
  "Problem Solving": "Problem Solving",
  "Cultural Fit": "Cultural Fit",
  "Confidence and Clarity": "Confidence",
};

export const RadarChartComponent: React.FC<RadarChartProps> = ({
  categoryScores,
  averageScores,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#7a7a9a" : "#8888aa";
  const labelColor = isDark ? "#f0f0f8" : "#16162a";

  const data = categoryScores.map((cat) => {
    const shortName = CATEGORY_LABELS[cat.name] ?? cat.name;
    const avg = averageScores?.find((a) => a.name === cat.name)?.score;
    return {
      subject: shortName,
      current: cat.score ?? 0,
      average: avg ?? null,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadar data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke={gridColor} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: labelColor,
            fontSize: 12,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{
            fill: tickColor,
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
          }}
          tickCount={5}
          stroke={gridColor}
        />
        {/* Current attempt */}
        <Radar
          name="This interview"
          dataKey="current"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.18}
          strokeWidth={2}
          dot={{ r: 4, fill: "#2563eb" }}
          activeDot={{ r: 6 }}
        />
        {/* Average overlay — only if data exists */}
        {averageScores && (
          <Radar
            name="Your average"
            dataKey="average"
            stroke="rgba(37,99,235,0.4)"
            fill="rgba(37,99,235,0.06)"
            fillOpacity={1}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "rgba(37,99,235,0.4)" }}
          />
        )}
        <Tooltip
          contentStyle={{
            background: isDark ? "#161622" : "#f0effe",
            border: "1px solid rgba(37,99,235,0.25)",
            borderRadius: 10,
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: labelColor,
          }}
          formatter={(value, name) => [`${value ?? 0}/100`, String(name)]}
        />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: tickColor,
          }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
};

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  YAxis,
} from "recharts";
import type { RuntimeBucket } from "@/features/submissionStore";
import { getLanguageConfig } from "@/lib/share/languageConfig";
import { SectionLabel } from "../helperComponents/codeSubmission/ResultAtoms";

const USER_BUCKET_COLOR = "#22C55E";
const NEUTRAL_BUCKET_COLOR = "#64748B";

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const bucket: RuntimeBucket = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/20 bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-0.5">
        {bucket.bucketLabel}
      </p>
      <p className="text-muted-foreground">
        {bucket.count} submission{bucket.count !== 1 ? "s" : ""}
      </p>
      {bucket.isUserBucket && (
        <p
          className="mt-1 flex items-center gap-1"
          style={{ color: USER_BUCKET_COLOR }}
        >
          <span>•</span> Your runtime falls here
        </p>
      )}
    </div>
  );
}

function ColoredAxisTick({ x, y, payload }: any) {
  const label = String(payload.value).replace(/ms$/i, " ms");
  return (
    <text
      x={x}
      y={y + 10}
      textAnchor="middle"
      fontSize={9}
      fill={USER_BUCKET_COLOR}
    >
      {label}
    </text>
  );
}

export function RuntimeDistribution({
  distribution,
  percentile,
  language,
}: {
  distribution: RuntimeBucket[];
  percentile: number;
  language: string;
}) {
  if (!distribution || distribution.length === 0) return null;
  const langLabel = getLanguageConfig(language)?.label ?? language;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <SectionLabel>Runtime Distribution</SectionLabel>
        <span
          className="text-xs font-medium"
          style={{ color: USER_BUCKET_COLOR }}
        >
          Faster than {percentile}% of {langLabel} submissions
        </span>
      </div>
      <div className="min-w-[280px]" style={{ width: "100%", height: 150 }}>
        <ResponsiveContainer width="99%" height="100%">
          <BarChart
            data={distribution}
            margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            barCategoryGap="24%"
          >
            <XAxis
              dataKey="bucketLabel"
              tick={<ColoredAxisTick />}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} cursor={false} />
            <Bar dataKey="count" radius={[4, 4, 2, 2]} maxBarSize={34}>
              {distribution.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.isUserBucket
                      ? USER_BUCKET_COLOR
                      : NEUTRAL_BUCKET_COLOR
                  }
                  fillOpacity={entry.isUserBucket ? 1 : 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

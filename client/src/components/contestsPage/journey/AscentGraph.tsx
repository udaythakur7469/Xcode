"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAscentGraphGeometry } from "@/hooks/useAscentGraphGeometry";
import type { JourneyMilestone } from "@/features/contestStore";

const TYPE_COLOR: Record<JourneyMilestone["type"], string> = {
  start: "#94a3b8", title: "#22c55e", achievement: "#a855f7", peak: "#f97316",
};

type AscentGraphProps = {
  journey: JourneyMilestone[];
  selected: number | null;
  onSelect: (index: number) => void;
};

export default function AscentGraph({ journey, selected, onSelect }: AscentGraphProps) {
  const { linePath, fillPath, points, tierBands, W, H } = useAscentGraphGeometry(journey);

  return (
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
        {tierBands.map((band) => (
          <g key={band.name}>
            <rect x={30} y={band.yTop} width={W - 60} height={band.yBottom - band.yTop} fill={band.color} opacity={0.05} />
            <text x={W - 36} y={band.yTop + 12} textAnchor="end" fontSize={10} fontFamily="monospace" opacity={0.55} fill={band.color}>
              {band.name}
            </text>
          </g>
        ))}
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
          const color = TYPE_COLOR[journey[i].type];
          return (
            <g key={i}>
              <circle
                cx={x} cy={y} r={13} fill="none" stroke={color} strokeWidth={2}
                opacity={selected === i ? 0.55 : 0} style={{ transition: "opacity .25s" }}
              />
              <circle
                cx={x} cy={y} r={selected === i ? 9 : 7} fill={color} className="cursor-pointer"
                style={{ transition: "r .2s", filter: selected === i ? `drop-shadow(0 0 8px ${color})` : "none" }}
                onClick={() => onSelect(i)}
              />
            </g>
          );
        })}
        {points.length > 0 && (
          <text x={points[points.length - 1][0]} y={points[points.length - 1][1] - 16} textAnchor="middle" fontSize={18}>
            🚩
          </text>
        )}
      </svg>
    </div>
  );
}

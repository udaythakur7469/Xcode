// Pure lookup — no DB table. Mirrors client/src/lib/titles.ts exactly;
// keep both in sync if the tiers ever change.

export interface Title {
  name: string;
  min: number;
  max: number;
  color: string;
  icon: string;
}

export const TITLES: Title[] = [
  { name: "Spark", min: -Infinity, max: 1199, color: "#9ca3af", icon: "✦" },
  { name: "Pulse", min: 1200, max: 1399, color: "#22c55e", icon: "❖" },
  { name: "Vector", min: 1400, max: 1599, color: "#06b6d4", icon: "➤" },
  { name: "Nexus", min: 1600, max: 1799, color: "#3b82f6", icon: "◆" },
  { name: "Quantum", min: 1800, max: 1999, color: "#6366f1", icon: "✧" },
  { name: "Titan", min: 2000, max: 2199, color: "#3b82f6", icon: "⛰" },
  { name: "Apex", min: 2200, max: 2399, color: "#f97316", icon: "▲" },
  { name: "Infinity", min: 2400, max: 2599, color: "#a855f7", icon: "∞" },
  { name: "X", min: 2600, max: Infinity, color: "#ff3d3d", icon: "✕" },
];

export function getTitleForRating(rating: number): Title {
  return (
    TITLES.find((t) => rating >= t.min && rating <= t.max) ??
    TITLES[TITLES.length - 1]
  );
}

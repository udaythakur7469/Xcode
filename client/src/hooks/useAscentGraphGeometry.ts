"use client";

import { useMemo } from "react";
import { TITLES } from "@/lib/titles";
import type { JourneyMilestone } from "@/features/contestStore";

const W = 900;
const H = 340;
const PAD_X = 30;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

/**
 * Computes the SVG path/points/tier-band geometry for the Ascent graph
 * on the Contest Journey page. Pulled out of the component since it's
 * pure derived data with no rendering concerns of its own.
 */
export function useAscentGraphGeometry(journey: JourneyMilestone[]) {
  return useMemo(() => {
    if (journey.length === 0) {
      return { linePath: "", fillPath: "", points: [] as [number, number][], tierBands: [] as { name: string; color: string; yTop: number; yBottom: number }[], W, H };
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

    const tierBands = TITLES.filter((t) => t.max > minR && t.min < maxR).map((t) => ({
      name: t.name,
      color: t.color,
      yTop: yFor(Math.min(t.max, maxR)),
      yBottom: yFor(Math.max(t.min, minR)),
    }));

    return { linePath, fillPath, points, tierBands, W, H };
  }, [journey]);
}

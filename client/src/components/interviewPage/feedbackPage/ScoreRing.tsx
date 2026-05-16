"use client";

import React, { useEffect, useRef } from "react";
import { Chart, DoughnutController, ArcElement, Tooltip } from "chart.js";

Chart.register(DoughnutController, ArcElement, Tooltip);

// Fixed colours — no CSS var sampling needed
const BLUE = "#2563eb"; // bg-blue-600 — filled arc + score number
const TRACK_DARK = "rgba(255,255,255,0.08)"; // subtle light track on dark bg
const TRACK_LIGHT = "rgba(0,0,0,0.08)"; // subtle dark track on light bg

interface ScoreRingProps {
  score: number; // 0–100
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const getTrackColor = () =>
    document.documentElement.classList.contains("dark")
      ? TRACK_DARK
      : TRACK_LIGHT;

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [score, 100 - score],
            backgroundColor: [BLUE, getTrackColor()],
            borderWidth: 0,
            // @ts-ignore borderRadius is valid in chart.js 4
            borderRadius: [6, 0],
          },
        ],
      },
      options: {
        responsive: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: { animateRotate: true, duration: 1200 },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [score]);

  // Update track colour on theme toggle (filled arc is always BLUE — no update needed)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!chartRef.current) return;
      const ds = chartRef.current.data.datasets[0] as any;
      ds.backgroundColor[1] = getTrackColor();
      chartRef.current.update();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-[140px] h-[140px]">
      <canvas ref={canvasRef} width={140} height={140} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[30px] font-extrabold leading-none tracking-[-0.05em]"
          style={{ fontFamily: "'Inter', sans-serif", color: BLUE }}
        >
          {score}
        </span>
        <span
          className="text-[11px] text-muted-foreground"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          /100
        </span>
      </div>
    </div>
  );
};

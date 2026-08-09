"use client";

import { useEffect, useState } from "react";

/**
 * Ticks down to `target` (an ISO date string) once per second and
 * returns a formatted HH:MM:SS label. Shared by ContestsList (time to
 * the next contest) and ContestLobby (time to the selected contest).
 */
export function useCountdown(target: string | null | undefined) {
  const [label, setLabel] = useState("--:--:--");

  useEffect(() => {
    if (!target) return;
    const targetMs = new Date(target).getTime();
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      const s = Math.floor(diff / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setLabel(`${h}:${m}:${sec}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return label;
}

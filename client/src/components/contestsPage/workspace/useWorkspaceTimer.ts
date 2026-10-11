"use client";

import { useEffect, useRef, useState } from "react";

// ─── useWorkspaceTimer ───────────────────────────────────────────────────
// Ticks every second toward `endTime`. contestJustEnded becomes true the
// moment remaining time hits zero — which is also true immediately, on
// the very first tick, if endTime is already in the past (i.e. opening an
// already-ended contest). ContestWorkspace.tsx is the one that decides
// what that means (a real live-ending overlay vs. quietly entering
// practice mode) — this hook only reports the clock, nothing more.

export function useWorkspaceTimer(endTime: string | undefined) {
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [contestJustEnded, setContestJustEnded] = useState(false);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!endTime) return;
    const end = new Date(endTime).getTime();

    const tick = () => {
      const remaining = end - Date.now();
      setRemainingMs(Math.max(0, remaining));
      if (remaining <= 0 && !endedRef.current) {
        endedRef.current = true;
        setContestJustEnded(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const markEnded = () => {
    endedRef.current = true;
    setContestJustEnded(true);
  };

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const timerLabel = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { remainingMs, timerLabel, contestJustEnded, markEnded };
}

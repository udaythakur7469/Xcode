"use client";

import { useEffect, useState } from "react";

type WorkspaceTimerResult = {
  timerLabel: string;
  contestJustEnded: boolean;
  markEnded: () => void;
};

/**
 * Counts down to `endTime` once per second and exposes a formatted
 * HH:MM:SS label. `markEnded` is exposed so a caller (e.g. a
 * "contest:ended" socket event) can flip contestJustEnded early if the
 * server's authoritative end fires before the local countdown reaches
 * zero. Used by ContestWorkspace.
 */
export function useWorkspaceTimer(endTime: string | undefined): WorkspaceTimerResult {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [contestJustEnded, setContestJustEnded] = useState(false);

  useEffect(() => {
    if (!endTime) return;
    const endMs = new Date(endTime).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.round((endMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setContestJustEnded(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const timerLabel = secondsLeft != null
    ? `${String(Math.floor(secondsLeft / 3600)).padStart(2, "0")}:${String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`
    : "--:--:--";

  return { timerLabel, contestJustEnded, markEnded: () => setContestJustEnded(true) };
}

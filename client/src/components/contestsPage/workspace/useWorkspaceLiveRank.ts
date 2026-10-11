"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/socketContext";

// ─── useWorkspaceLiveRank ────────────────────────────────────────────────
// Joins the contest's socket room for the lifetime of the workspace, and
// keeps a local rank/solved/penalty state in sync with
// "contest:leaderboard:update" broadcasts from
// contestSubmissionService.ts. Deliberately a thin hook, not a store —
// this state is only ever relevant to the one workspace instance
// currently mounted, not shared app-wide.

export interface LiveRankState {
  rank: number | null;
  solvedCount: number;
  penaltyMins: number;
}

export function useWorkspaceLiveRank(
  contestId: number | undefined,
  userId: number | undefined,
  initial: LiveRankState,
  onContestEnded: () => void,
) {
  const { socket } = useSocket();
  const [liveRank, setLiveRank] = useState<LiveRankState>(initial);

  useEffect(() => {
    setLiveRank(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId]);

  useEffect(() => {
    if (!socket || !contestId) return;

    socket.emit("contest:join", contestId);

    const handleUpdate = (payload: {
      contestId: number;
      standings: { userId: number; rank: number; solvedCount: number; penaltyMins: number }[];
    }) => {
      if (payload.contestId !== contestId) return;
      const mine = payload.standings.find((s) => s.userId === userId);
      if (mine) {
        setLiveRank({ rank: mine.rank, solvedCount: mine.solvedCount, penaltyMins: mine.penaltyMins });
      }
    };

    const handleEnded = (payload: { contestId: number }) => {
      if (payload.contestId === contestId) onContestEnded();
    };

    socket.on("contest:leaderboard:update", handleUpdate);
    socket.on("contest:ended", handleEnded);

    return () => {
      socket.emit("contest:leave", contestId);
      socket.off("contest:leaderboard:update", handleUpdate);
      socket.off("contest:ended", handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, contestId, userId]);

  return liveRank;
}

"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/socketContext";

type LiveRank = { rank: number | null; solvedCount: number; penaltyMins: number };

/**
 * Subscribes to the contest room and keeps just the current user's own
 * rank/solved/penalty in sync, plus fires `onEnded` the moment the
 * server actually flips the contest to ENDED (contestLifecycleWorker.ts) —
 * which can lag the client's own countdown by a second or two. Used by
 * ContestWorkspace (which only needs its own row, not the full table).
 */
export function useWorkspaceLiveRank(
  contestId: number | undefined,
  userId: number | undefined,
  initial: LiveRank,
  onEnded: () => void,
) {
  const { socket } = useSocket();
  const [state, setState] = useState<LiveRank>(initial);

  useEffect(() => {
    setState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.rank, initial.solvedCount, initial.penaltyMins]);

  useEffect(() => {
    if (!socket || !contestId) return;
    socket.emit("contest:join", contestId);

    const onUpdate = (payload: { userId: number; rank: number; solvedCount: number; penaltyMins: number }) => {
      if (payload.userId === userId) {
        setState({ rank: payload.rank, solvedCount: payload.solvedCount, penaltyMins: payload.penaltyMins });
      }
    };
    socket.on("contest:leaderboard:update", onUpdate);
    socket.on("contest:ended", onEnded);

    return () => {
      socket.emit("contest:leave", contestId);
      socket.off("contest:leaderboard:update", onUpdate);
      socket.off("contest:ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, contestId, userId]);

  return state;
}

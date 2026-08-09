"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/context/socketContext";
import { LeaderboardRow } from "@/features/contestStore";

/**
 * Subscribes to real-time leaderboard updates for one contest and keeps
 * a locally-sorted copy of the rows in sync. `initialRows` should be the
 * page of rows fetched from the store; this hook merges socket updates
 * into that set without re-fetching. Used by ContestLeaderboard.
 */
export function useLiveLeaderboard(
  contestId: number | undefined,
  initialRows: LeaderboardRow[],
  onFrozenChange: () => void,
) {
  const { socket } = useSocket();
  const [rows, setRows] = useState<LeaderboardRow[]>(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    if (!socket || !contestId) return;
    socket.emit("contest:join", contestId);

    const onUpdate = (payload: LeaderboardRow & { name: string; rating: number }) => {
      setRows((prev) => {
        const exists = prev.some((r) => r.userId === payload.userId);
        // A participant outside the currently-loaded page — ignore
        // rather than guess their position.
        const updated = exists
          ? prev.map((r) => (r.userId === payload.userId ? { ...r, ...payload } : r))
          : prev;
        return [...updated].sort(
          (a, b) => b.totalPoints - a.totalPoints || a.penaltyMins - b.penaltyMins,
        );
      });
    };
    socket.on("contest:leaderboard:update", onUpdate);
    socket.on("contest:frozen", onFrozenChange);

    return () => {
      socket.emit("contest:leave", contestId);
      socket.off("contest:leaderboard:update", onUpdate);
      socket.off("contest:frozen", onFrozenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, contestId]);

  return rows;
}

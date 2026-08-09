"use client";

import React from "react";
import { StickyNote, Play, CloudUpload, Timer as TimerIcon, Trophy, Keyboard } from "lucide-react";
import WorkspaceLayoutMenu from "./WorkspaceLayoutMenu";

type WorkspaceNavbarProps = {
  rank: number | null;
  solvedCount: number;
  totalProblems: number;
  penaltyMins: number;
  contestJustEnded: boolean;
  timerLabel: string;
  isRunningCode: boolean;
  isSubmittingCode: boolean;
  onExit: () => void;
  onRun: () => void;
  onSubmit: () => void;
  onOpenLeaderboard: () => void;
  onResetLayout: () => void;
  onOpenShortcuts: () => void;
};

export default function WorkspaceNavbar({
  rank,
  solvedCount,
  totalProblems,
  penaltyMins,
  contestJustEnded,
  timerLabel,
  isRunningCode,
  isSubmittingCode,
  onExit,
  onRun,
  onSubmit,
  onOpenLeaderboard,
  onResetLayout,
  onOpenShortcuts,
}: WorkspaceNavbarProps) {
  return (
    <div className="w-full bg-black grid grid-cols-3 h-12 flex-shrink-0 text-white flex-none">
      <div className="flex items-center h-full pl-2 gap-2">
        <button
          className="flex items-center justify-center rounded-md h-8 px-3 text-sm bg-secondary text-secondary-foreground hover:opacity-90"
          onClick={onExit}
        >
          ← Exit Contest
        </button>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 ml-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
        </span>
      </div>

      <div className="flex items-center justify-center h-full gap-2">
        <div className="navbar-pill flex items-center justify-center h-8 px-3 rounded-md bg-secondary text-sm cursor-pointer" title="Sticky notes">
          <StickyNote className="w-4 h-4" />
        </div>
        <button
          className="flex items-center justify-center h-8 w-[90px] rounded-md bg-secondary text-sm gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80"
          onClick={onRun}
          disabled={isRunningCode || contestJustEnded}
          title="Run code (Ctrl+')"
        >
          <Play className="h-4 w-4" />
          {isRunningCode ? "Running..." : "Run"}
        </button>
        <button
          className="flex items-center justify-center h-8 px-3 rounded-md bg-secondary text-sm gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80"
          onClick={onSubmit}
          disabled={isSubmittingCode || contestJustEnded}
          title="Submit code (Ctrl+Enter)"
        >
          <CloudUpload className="h-4 w-4 text-green-400" />
          <span className="text-green-400">{isSubmittingCode ? "Submitting..." : "Submit"}</span>
        </button>
        <div className={`flex items-center justify-center h-8 px-3 rounded-md text-sm font-mono gap-1.5 ${contestJustEnded ? "bg-destructive text-destructive-foreground" : "bg-secondary"}`} title="Time remaining in the contest">
          <TimerIcon className="h-3.5 w-3.5" /> {contestJustEnded ? "Ended" : timerLabel}
        </div>
      </div>

      <div className="flex items-center justify-end h-full pr-2 gap-3">
        <div className="flex items-center gap-3 text-xs font-mono mr-1">
          <span>Rank <b>{rank ? `#${rank}` : "—"}</b></span>
          <span>Solved <b>{solvedCount}/{totalProblems}</b></span>
          <span>Penalty <b>{penaltyMins}m</b></span>
        </div>
        <button className="flex items-center justify-center h-8 px-3 rounded-md bg-secondary text-sm gap-1" onClick={onOpenLeaderboard}>
          <Trophy className="w-3.5 h-3.5" /> Leaderboard
        </button>
        <WorkspaceLayoutMenu onResetLayout={onResetLayout} />
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-secondary"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (Alt+/)"
        >
          <Keyboard className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { StickyNote, Play, CloudUpload, Timer as TimerIcon, Trophy, Keyboard } from "lucide-react";

type WorkspaceNavbarProps = {
  rank: number | null;
  solvedCount: number;
  totalProblems: number;
  penaltyMins: number;
  contestJustEnded: boolean;
  practiceMode: boolean;
  timerLabel: string;
  isRunningCode: boolean;
  isSubmittingCode: boolean;
  onExit: () => void;
  onRun: () => void;
  onSubmit: () => void;
  onOpenLeaderboard: () => void;
  onOpenShortcuts: () => void;
};

export default function WorkspaceNavbar({
  rank,
  solvedCount,
  totalProblems,
  penaltyMins,
  contestJustEnded,
  practiceMode,
  timerLabel,
  isRunningCode,
  isSubmittingCode,
  onExit,
  onRun,
  onSubmit,
  onOpenLeaderboard,
  onOpenShortcuts,
}: WorkspaceNavbarProps) {
  return (
    <div className="h-12 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="text-sm font-semibold hover:text-brand transition-colors">
          ← Exit
        </button>
        {practiceMode ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Practice Mode
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
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
          title={practiceMode ? "Submit code — practice only, won't affect your score" : "Submit code (Ctrl+Enter)"}
        >
          <CloudUpload className="h-4 w-4 text-green-400" />
          <span className="text-green-400">{isSubmittingCode ? "Submitting..." : "Submit"}</span>
        </button>
        <div
          className={`flex items-center justify-center h-8 px-3 rounded-md text-sm font-mono gap-1.5 ${
            practiceMode
              ? "bg-secondary text-muted-foreground"
              : contestJustEnded
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary"
          }`}
          title={practiceMode ? "This contest has ended — you're practicing" : "Time remaining in the contest"}
        >
          <TimerIcon className="h-3.5 w-3.5" /> {practiceMode || contestJustEnded ? "Ended" : timerLabel}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-xs font-mono mr-1">
          {practiceMode ? (
            <span className="text-muted-foreground italic">Scores don't count in practice mode</span>
          ) : (
            <>
              <span>
                Rank <b>{rank ? `#${rank}` : "—"}</b>
              </span>
              <span>
                Solved <b>{solvedCount}/{totalProblems}</b>
              </span>
              <span>
                Penalty <b>{penaltyMins}m</b>
              </span>
            </>
          )}
        </div>
        <button onClick={onOpenLeaderboard} className="text-muted-foreground hover:text-foreground" title="Leaderboard">
          <Trophy className="h-4 w-4" />
        </button>
        <button onClick={onOpenShortcuts} className="text-muted-foreground hover:text-foreground" title="Keyboard shortcuts">
          <Keyboard className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import InterviewAmbientBackground from "./InterviewAmbientBackground";
import InterviewBackButton from "./InterviewBackButton";
import InterviewAuthGate from "./InterviewAuthGate";
import { useDisabledShortcutsToast } from "@/hooks/useDisabledShortcutsToast";

type InterviewPageShellProps = { children: React.ReactNode };

/**
 * Wraps /practice-interview and /generate-interview only. Does not touch
 * Agent.tsx's internal call logic/state — purely adds chrome around it:
 * ambient brand background, a back button, a blocking auth gate, and a
 * toast when Ctrl+K / Ctrl+Q are pressed (those shortcuts' real listeners
 * live in the global FAB system, which is unmounted on these two routes).
 */
const InterviewPageShell: React.FC<InterviewPageShellProps> = ({
  children,
}) => {
  useDisabledShortcutsToast();

  return (
    <InterviewAuthGate>
      <div className="relative min-h-screen w-full overflow-hidden bg-background">
        <InterviewAmbientBackground />
        <div className="relative z-10">
          <div className="px-8 pt-6">
            <InterviewBackButton />
          </div>
          {children}
        </div>
      </div>
    </InterviewAuthGate>
  );
};

export default InterviewPageShell;

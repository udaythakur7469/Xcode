"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useContestStore } from "@/features/contestStore";
import { useSubmissionStore } from "@/features/submissionStore";
import { useUserStore } from "@/features/userStore";
import ProblemRail from "./ProblemRail";
import WorkspaceNavbar from "./WorkspaceNavbar";
import ContestCodeEditor from "./ContestCodeEditor";
import ContestEndedOverlay from "./ContestEndedOverlay";
import { useWorkspaceTimer } from "./useWorkspaceTimer";
import { useWorkspaceLiveRank } from "./useWorkspaceLiveRank";

const DEFAULT_LANGUAGE = "cpp";

function draftKey(contestId: number, label: string, language: string) {
  return `xcode_contest_draft:${contestId}:${label}:${language}`;
}

export default function ContestWorkspace() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const { activeContest, workspace, fetchContestBySlug, fetchWorkspace } = useContestStore();
  const { runCode, submitCode, isRunningCode, isSubmittingCode, submitCodeResult, runCodeResult } = useSubmissionStore();
  const { userData } = useUserStore();

  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [solved] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState<Set<string>>(new Set());
  const [firstToSolve, setFirstToSolve] = useState<Set<string>>(new Set());

  const { timerLabel, contestJustEnded, markEnded } = useWorkspaceTimer(workspace?.contest.endTime);

  // Distinguishes "the contest ended while I was sitting in this
  // workspace" (wasLiveOnLoad — should still show the dramatic
  // ContestEndedOverlay + auto-return-to-lobby) from "I opened a
  // workspace for a contest that already ended a while ago" (should
  // just quietly become a practice session instead). Set once, the
  // first time workspace data arrives. See
  // CONTEST_SYSTEM_EXPLAINED.md's practice-mode notes.
  const [wasLiveOnLoad, setWasLiveOnLoad] = useState<boolean | null>(null);
  useEffect(() => {
    if (workspace && wasLiveOnLoad === null) {
      setWasLiveOnLoad(workspace.contest.status === "LIVE");
    }
  }, [workspace, wasLiveOnLoad]);

  const practiceMode = workspace?.contest.status === "ENDED" && !wasLiveOnLoad;
  const showEndedOverlay = contestJustEnded && wasLiveOnLoad === true;

  const liveRank = useWorkspaceLiveRank(
    workspace?.contest.id,
    userData?.id,
    {
      rank: workspace?.participant.rank ?? null,
      solvedCount: workspace?.participant.solvedCount ?? 0,
      penaltyMins: workspace?.participant.penaltyMins ?? 0,
    },
    markEnded,
  );

  useEffect(() => {
    if (slug) fetchContestBySlug(slug);
  }, [slug, fetchContestBySlug]);

  useEffect(() => {
    if (activeContest?.id) fetchWorkspace(activeContest.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContest?.id]);

  useEffect(() => {
    if (workspace?.problems.length && !selectedLabel) {
      setSelectedLabel(workspace.problems[0].label);
    }
  }, [workspace, selectedLabel]);

  const selectedProblem = useMemo(
    () => workspace?.problems.find((p) => p.label === selectedLabel) ?? null,
    [workspace, selectedLabel],
  );

  useEffect(() => {
    if (!selectedProblem) return;
    const saved = localStorage.getItem(draftKey(workspace!.contest.id, selectedProblem.label, language));
    setCode(saved ?? "");
  }, [selectedProblem, language, workspace]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (selectedProblem && workspace) {
      localStorage.setItem(draftKey(workspace.contest.id, selectedProblem.label, language), value);
    }
  };

  // Auto-return to the lobby a few seconds after the contest ends — only
  // when it ended live, during this session. Opening an already-ended
  // contest (practice mode) should never auto-redirect.
  useEffect(() => {
    if (!showEndedOverlay) return;
    const id = setTimeout(() => router.push(`/contests/${slug}`), 6000);
    return () => clearTimeout(id);
  }, [showEndedOverlay, router, slug]);

  const runCodeHandler = async () => {
    if (!selectedProblem || !activeContest || showEndedOverlay) return;
    await runCode(language, code, selectedProblem.problem.title);
  };

  const submitCodeHandler = async () => {
    if (!selectedProblem || !activeContest || showEndedOverlay) return;
    await submitCode(
      language,
      code,
      selectedProblem.problem.title,
      activeContest.status === "LIVE"
        ? { contestId: activeContest.id, contestProblemId: selectedProblem.id }
        : undefined,
    );
    setAttempted((prev) => new Set(prev).add(selectedProblem.label));

    const result = useSubmissionStore.getState().submitCodeResult;
    if (result && "isFirstAccept" in result && result.isFirstAccept) {
      setFirstToSolve((prev) => new Set(prev).add(selectedProblem.label));
    }
    if (result && "success" in result && result.success) {
      solved.add(selectedProblem.label);
    }
  };

  if (!workspace || !activeContest) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading workspace…</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {showEndedOverlay && <ContestEndedOverlay />}
      <WorkspaceNavbar
        rank={liveRank.rank}
        solvedCount={liveRank.solvedCount}
        totalProblems={workspace.problems.length}
        penaltyMins={liveRank.penaltyMins}
        contestJustEnded={showEndedOverlay}
        practiceMode={practiceMode}
        timerLabel={timerLabel}
        isRunningCode={isRunningCode}
        isSubmittingCode={isSubmittingCode}
        onExit={() => router.push(`/contests/${slug}`)}
        onRun={runCodeHandler}
        onSubmit={submitCodeHandler}
        onOpenLeaderboard={() => router.push(`/contests/${slug}/leaderboard`)}
        onOpenShortcuts={() => {}}
      />
      <div className="flex flex-1 min-h-0">
        <ProblemRail
          problems={workspace.problems}
          selectedLabel={selectedLabel}
          solved={solved}
          attempted={attempted}
          firstToSolve={firstToSolve}
          onSelect={setSelectedLabel}
        />
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={45} minSize={25}>
            <div className="h-full overflow-y-auto p-6">
              {selectedProblem && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-7 h-7 rounded-md bg-muted flex items-center justify-center font-mono text-xs font-bold">
                      {selectedProblem.label}
                    </span>
                    <h2 className="text-lg font-semibold">{selectedProblem.problem.title}</h2>
                    <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                      {selectedProblem.points} pts
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedProblem.problem.description}
                  </p>
                  {selectedProblem.problem.constraints.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Constraints</div>
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                        {selectedProblem.problem.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <ContestCodeEditor code={code} onChange={handleCodeChange} language={language} />
              </div>
              {(submitCodeResult || runCodeResult) && (
                <div className="border-t p-3 text-xs font-mono max-h-40 overflow-y-auto">
                  {submitCodeResult && "success" in submitCodeResult && submitCodeResult.success ? (
                    <div className="text-emerald-500">✓ Accepted — {submitCodeResult.testCasesPassed}/{submitCodeResult.totalTestCases} test cases passed</div>
                  ) : submitCodeResult && "message" in submitCodeResult ? (
                    <div className="text-destructive">{submitCodeResult.message}</div>
                  ) : null}
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useContestStore } from "@/features/contestStore";
import { useSubmissionStore } from "@/features/submissionStore";
import { toast } from "sonner";
import { useWorkspaceTimer } from "@/hooks/useWorkspaceTimer";
import { useResizableWorkspaceLayout } from "@/hooks/useResizableWorkspaceLayout";
import { useWorkspaceKeyboardShortcuts } from "@/hooks/useWorkspaceKeyboardShortcuts";
import { useWorkspaceLiveRank } from "@/hooks/useWorkspaceLiveRank";
import { useCodeDraftAutosave } from "@/hooks/useCodeDraftAutosave";
import WorkspaceNavbar from "./WorkspaceNavbar";
import ProblemRail from "./ProblemRail";
import QuestionPanel from "./QuestionPanel";
import EditorPanel from "./EditorPanel";
import TestcasePanel from "./TestcasePanel";
import ShortcutsDialog from "./ShortcutsDialog";
import ContestEndedOverlay from "./ContestEndedOverlay";

export default function ContestWorkspace() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { activeContest, fetchContestBySlug, workspace, loadingWorkspace, fetchWorkspace } = useContestStore();
  const {
    runCode: storeRunCode,
    submitCode: storeSubmitCode,
    isRunningCode,
    isSubmittingCode,
    clearRunCodeResult,
    clearSubmitCodeResult,
  } = useSubmissionStore();

  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [language, setLanguage] = useState("python");
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState(14);
  const [solved] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState<Set<string>>(new Set());
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");
  const [lastAction, setLastAction] = useState<"run" | "submit" | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const { code, saveIndicator, loadDraft, updateCode, resetDraft } = useCodeDraftAutosave();
  const layout = useResizableWorkspaceLayout();
  const { timerLabel, contestJustEnded, markEnded } = useWorkspaceTimer(workspace?.contest.endTime);

  useEffect(() => {
    if (slug) fetchContestBySlug(slug);
  }, [slug, fetchContestBySlug]);

  useEffect(() => {
    if (activeContest?.id) fetchWorkspace(activeContest.id);
  }, [activeContest?.id, fetchWorkspace]);

  const selectedProblem = useMemo(
    () => workspace?.problems.find((p) => p.label === selectedLabel) ?? workspace?.problems[0],
    [workspace, selectedLabel],
  );

  useEffect(() => {
    if (workspace?.problems.length && !selectedLabel) {
      setSelectedLabel(workspace.problems[0].label);
    }
  }, [workspace, selectedLabel]);

  const liveRank = useWorkspaceLiveRank(
    activeContest?.id,
    workspace?.participant.userId,
    workspace?.participant
      ? { rank: workspace.participant.rank, solvedCount: workspace.participant.solvedCount, penaltyMins: workspace.participant.penaltyMins }
      : { rank: null, solvedCount: 0, penaltyMins: 0 },
    markEnded,
  );

  // Auto-return to the lobby a few seconds after the contest ends, so
  // nobody's left staring at a locked workspace indefinitely.
  useEffect(() => {
    if (!contestJustEnded) return;
    const id = setTimeout(() => router.push(`/contests/${slug}`), 6000);
    return () => clearTimeout(id);
  }, [contestJustEnded, router, slug]);

  const selectProblem = useCallback(
    (label: string) => {
      setSelectedLabel(label);
      const problem = workspace?.problems.find((p) => p.label === label);
      const baseCodes = problem?.problem.baseCodes as Record<string, string> | undefined;
      const draftKey = problem ? `${problem.problem.title}:${language}` : "";
      loadDraft(draftKey, baseCodes?.[language] ?? "");
      clearRunCodeResult();
      clearSubmitCodeResult();
      setLastAction(null);
      setBottomTab("testcase");
    },
    [workspace, language, loadDraft, clearRunCodeResult, clearSubmitCodeResult],
  );

  useEffect(() => {
    if (selectedProblem) selectProblem(selectedProblem.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProblem?.problem.id, language]);

  const handleCodeChange = (value: string) => {
    if (!selectedProblem) return;
    updateCode(`${selectedProblem.problem.title}:${language}`, value);
  };

  const confirmReset = () => {
    setIsResetConfirmOpen(false);
    if (!selectedProblem) return;
    const baseCodes = selectedProblem.problem.baseCodes as Record<string, string> | undefined;
    resetDraft(`${selectedProblem.problem.title}:${language}`, baseCodes?.[language] ?? "");
    toast.success("Reset to starter code");
  };

  const runCode = async () => {
    if (!selectedProblem || !activeContest || contestJustEnded) return;
    setBottomTab("result");
    setLastAction("run");
    if (!layout.isTestcaseMaximized) {
      layout.testcasePanelRef.current?.resize(50);
      layout.editorPanelRef.current?.resize(50);
    }
    await storeRunCode(language, code, selectedProblem.problem.title, {
      contestId: activeContest.id,
      contestProblemId: selectedProblem.id,
    });
  };

  const submitCode = async () => {
    if (!selectedProblem || !activeContest || contestJustEnded) return;
    setBottomTab("result");
    setLastAction("submit");
    await storeSubmitCode(language, code, selectedProblem.problem.title, {
      contestId: activeContest.id,
      contestProblemId: selectedProblem.id,
    });
    // Optimistic local update — the authoritative rank/solved/penalty
    // comes from the live-rank socket hook above; this just gives
    // immediate pill-rail feedback without waiting on it.
    setAttempted((prev) => new Set(prev).add(selectedProblem.label));
  };

  useWorkspaceKeyboardShortcuts({
    onRun: runCode,
    onSubmit: submitCode,
    onOpenResetConfirm: () => setIsResetConfirmOpen(true),
    onCloseDialogs: () => { setIsResetConfirmOpen(false); setShortcutsOpen(false); },
    onToggleLeftMaximize: layout.toggleLeftMaximize,
    onToggleRightMaximize: layout.toggleRightMaximize,
    onToggleTestcaseMaximize: layout.toggleTestcaseMaximize,
    onMinimizeTestcase: layout.toggleTestcaseMaximize,
    onResetLayout: layout.resetLayout,
    onSwitchToTestcaseTab: () => setBottomTab("testcase"),
    onSwitchToResultsTab: () => setBottomTab("result"),
    onOpenShortcuts: () => setShortcutsOpen(true),
    isLeftMaximized: layout.isLeftMaximized,
    isRightMaximized: layout.isRightMaximized,
    isTestcaseMaximized: layout.isTestcaseMaximized,
  });

  if (loadingWorkspace || !workspace) {
    return <div className="w-full px-5 pt-10 text-muted-foreground">Loading workspace…</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <WorkspaceNavbar
        rank={liveRank.rank}
        solvedCount={liveRank.solvedCount}
        totalProblems={workspace.problems.length}
        penaltyMins={liveRank.penaltyMins}
        contestJustEnded={contestJustEnded}
        timerLabel={timerLabel}
        isRunningCode={isRunningCode}
        isSubmittingCode={isSubmittingCode}
        onExit={() => {
          toast.success("Your progress is saved — come back anytime before the contest ends");
          router.push(`/contests/${slug}`);
        }}
        onRun={runCode}
        onSubmit={submitCode}
        onOpenLeaderboard={() => router.push(`/contests/${slug}/leaderboard`)}
        onResetLayout={layout.resetLayout}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      <div className="flex-1 flex min-h-0">
        <ProblemRail
          problems={workspace.problems}
          selectedLabel={selectedLabel}
          solved={solved}
          attempted={attempted}
          onSelect={selectProblem}
        />

        <ResizablePanelGroup direction="horizontal" className="flex-1 p-2">
          <ResizablePanel ref={layout.leftPanelRef} defaultSize={50} minSize={5} className="flex flex-col border rounded-lg overflow-hidden">
            <QuestionPanel
              selectedProblem={selectedProblem}
              isMaximized={layout.isLeftMaximized}
              onToggleMaximize={layout.toggleLeftMaximize}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel ref={layout.rightPanelRef} defaultSize={50} minSize={5}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel ref={layout.editorPanelRef} defaultSize={88} minSize={7} className="flex flex-col border rounded-lg overflow-hidden">
                <EditorPanel
                  code={code}
                  onCodeChange={handleCodeChange}
                  language={language}
                  onLanguageChange={setLanguage}
                  theme={theme}
                  onThemeChange={setTheme}
                  onFontSizeChange={setFontSize}
                  fontSize={fontSize}
                  onRun={runCode}
                  onSubmit={submitCode}
                  isRunningCode={isRunningCode}
                  isSubmittingCode={isSubmittingCode}
                  contestJustEnded={contestJustEnded}
                  saveIndicator={saveIndicator}
                  isResetConfirmOpen={isResetConfirmOpen}
                  onOpenResetConfirm={() => setIsResetConfirmOpen(true)}
                  onResetConfirmOpenChange={setIsResetConfirmOpen}
                  onConfirmReset={confirmReset}
                  isMaximized={layout.isRightMaximized}
                  onToggleMaximize={layout.toggleRightMaximize}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel ref={layout.testcasePanelRef} defaultSize={12} minSize={7} className="flex flex-col border rounded-lg overflow-hidden">
                <TestcasePanel
                  bottomTab={bottomTab}
                  onTabChange={setBottomTab}
                  selectedProblem={selectedProblem}
                  lastAction={lastAction}
                  isMaximized={layout.isTestcaseMaximized}
                  onToggleMaximize={layout.toggleTestcaseMaximize}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Server already rejects late submissions on its own; this just
          makes sure the user isn't left guessing why Submit stopped
          responding. */}
      {contestJustEnded && <ContestEndedOverlay />}
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { githubDark, githubLight, dracula } from "@uiw/codemirror-themes-all";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Maximize, Minimize, History, Trophy, StickyNote, Keyboard, Grid2x2 } from "lucide-react";
import LangDropdown from "@/components/problemDetailPage/codePanel/dropdowns/LangDropdown";
import ThemeDropdown from "@/components/problemDetailPage/codePanel/dropdowns/ThemeDropdown";
import FontSizeDropdown from "@/components/problemDetailPage/codePanel/dropdowns/FontSizeDropdown";
import QuestionResults from "@/components/problemDetailPage/questionResults/QuestionResults";
import ResultsPanel from "@/components/problemDetailPage/testCases/resultsPanel/ResultsPanel";
import { useContestStore } from "@/features/contestStore";
import { useSubmissionStore } from "@/features/submissionStore";
import { useSocket } from "@/context/socketContext";
import { toast } from "sonner";

const LANG_EXTENSIONS: Record<string, () => unknown> = {
  python, cpp, java, javascript,
};
const THEME_MAP: Record<string, unknown> = {
  dark: githubDark, light: githubLight, dracula,
  "github-light": githubLight, "github-dark": githubDark,
};

export default function ContestWorkspacePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { socket } = useSocket();
  const {
    activeContest,
    fetchContestBySlug,
    workspace,
    loadingWorkspace,
    fetchWorkspace,
  } = useContestStore();
  const {
    runCode: storeRunCode,
    submitCode: storeSubmitCode,
    isRunningCode,
    isSubmittingCode,
    clearRunCodeResult,
    clearSubmitCodeResult,
  } = useSubmissionStore();

  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState(14);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [attempted, setAttempted] = useState<Set<string>>(new Set());
  const [rank, setRank] = useState<number | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [penaltyMins, setPenaltyMins] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  // Purely a UX signal — the server is the real authority (submitCode
  // already rejects once contest.status !== "LIVE"). This just tells the
  // user clearly what happened instead of leaving them submitting into
  // a silent rejection once the countdown hits zero.
  const [contestJustEnded, setContestJustEnded] = useState(false);
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");
  const [lastAction, setLastAction] = useState<"run" | "submit" | null>(null);

  // Autosave indicator + reset-confirm — same pattern as the real
  // CodeEditor.tsx toolbar, duplicated here since this editor is
  // intentionally NOT the same coupled component (see the implementation
  // guide for why).
  const [saveIndicator, setSaveIndicator] = useState<"saved" | "saving">("saved");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const codeDraftsRef = useRef<Record<string, string>>({});

  // Resizable panels — imperative refs drive the maximize buttons,
  // mirroring the real ResizablePanels.tsx pattern but scoped to just
  // what this page needs (no AI panel / comments integration).
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);
  const testcasePanelRef = useRef<ImperativePanelHandle>(null);
  const [isLeftMaximized, setIsLeftMaximized] = useState(false);
  const [isRightMaximized, setIsRightMaximized] = useState(false);
  const [isTestcaseMaximized, setIsTestcaseMaximized] = useState(false);

  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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

  useEffect(() => {
    if (workspace?.participant) {
      setRank(workspace.participant.rank);
      setSolvedCount(workspace.participant.solvedCount);
      setPenaltyMins(workspace.participant.penaltyMins);
    }
  }, [workspace?.participant]);

  useEffect(() => {
    if (!workspace?.contest) return;
    const endMs = new Date(workspace.contest.endTime).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.round((endMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setContestJustEnded(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [workspace]);

  // Auto-return to the lobby a few seconds after the contest ends, so
  // nobody's left staring at a locked workspace indefinitely.
  useEffect(() => {
    if (!contestJustEnded) return;
    const id = setTimeout(() => router.push(`/contests/${slug}`), 6000);
    return () => clearTimeout(id);
  }, [contestJustEnded, router, slug]);

  // Live leaderboard — join the contest room, update just our own row.
  useEffect(() => {
    if (!socket || !activeContest?.id) return;
    socket.emit("contest:join", activeContest.id);
    const onUpdate = (payload: { userId: number; rank: number; solvedCount: number; penaltyMins: number }) => {
      if (payload.userId === workspace?.participant.userId) {
        setRank(payload.rank);
        setSolvedCount(payload.solvedCount);
        setPenaltyMins(payload.penaltyMins);
      }
    };
    // Authoritative signal from contestLifecycleWorker.ts — fires the
    // moment the server actually flips status to ENDED, which can lag
    // the client's own countdown by a second or two (job-processing
    // latency). Either this or the countdown hitting zero triggers the
    // same end-of-contest UX; whichever happens first wins.
    const onEnded = () => setContestJustEnded(true);
    socket.on("contest:leaderboard:update", onUpdate);
    socket.on("contest:ended", onEnded);
    return () => {
      socket.emit("contest:leave", activeContest.id);
      socket.off("contest:leaderboard:update", onUpdate);
      socket.off("contest:ended", onEnded);
    };
  }, [socket, activeContest?.id, workspace]);

  const selectProblem = useCallback(
    (label: string) => {
      setSelectedLabel(label);
      const problem = workspace?.problems.find((p) => p.label === label);
      const baseCodes = problem?.problem.baseCodes as Record<string, string> | undefined;
      const draftKey = problem ? `${problem.problem.title}:${language}` : "";
      setCode(codeDraftsRef.current[draftKey] ?? baseCodes?.[language] ?? "");
      setSaveIndicator("saved");
      clearRunCodeResult();
      clearSubmitCodeResult();
      setLastAction(null);
      setBottomTab("testcase");
    },
    [workspace, language, clearRunCodeResult, clearSubmitCodeResult],
  );

  useEffect(() => {
    if (selectedProblem) selectProblem(selectedProblem.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProblem?.problem.id, language]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (!selectedProblem) return;
    const draftKey = `${selectedProblem.problem.title}:${language}`;
    codeDraftsRef.current[draftKey] = value;
    setSaveIndicator("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveIndicator("saved"), 400);
  };

  const confirmReset = () => {
    setIsResetConfirmOpen(false);
    if (!selectedProblem) return;
    const baseCodes = selectedProblem.problem.baseCodes as Record<string, string> | undefined;
    const draftKey = `${selectedProblem.problem.title}:${language}`;
    delete codeDraftsRef.current[draftKey];
    setCode(baseCodes?.[language] ?? "");
    setSaveIndicator("saved");
    toast.success("Reset to starter code");
  };

  const runCode = async () => {
    if (!selectedProblem || !activeContest || contestJustEnded) return;
    setBottomTab("result");
    setLastAction("run");
    if (!isTestcaseMaximized && testcasePanelRef.current) {
      testcasePanelRef.current.resize(50);
      editorPanelRef.current?.resize(50);
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
    // comes from the contest:leaderboard:update socket event above;
    // this just gives immediate pill-rail feedback without waiting on it.
    setAttempted((prev) => new Set(prev).add(selectedProblem.label));
  };

  // ── Maximize toggles (mirrors ResizablePanels.tsx's approach) ─────────
  const toggleLeftMaximize = () => {
    const next = !isLeftMaximized;
    setIsLeftMaximized(next);
    setIsRightMaximized(false);
    leftPanelRef.current?.resize(next ? 95 : 50);
    rightPanelRef.current?.resize(next ? 5 : 50);
  };
  const toggleRightMaximize = () => {
    const next = !isRightMaximized;
    setIsRightMaximized(next);
    setIsLeftMaximized(false);
    rightPanelRef.current?.resize(next ? 95 : 50);
    leftPanelRef.current?.resize(next ? 5 : 50);
  };
  const toggleTestcaseMaximize = () => {
    const next = !isTestcaseMaximized;
    setIsTestcaseMaximized(next);
    testcasePanelRef.current?.resize(next ? 93 : 12);
    editorPanelRef.current?.resize(next ? 7 : 88);
  };
  const resetLayout = () => {
    setIsLeftMaximized(false);
    setIsRightMaximized(false);
    setIsTestcaseMaximized(false);
    leftPanelRef.current?.resize(50);
    rightPanelRef.current?.resize(50);
    editorPanelRef.current?.resize(88);
    testcasePanelRef.current?.resize(12);
    setLayoutMenuOpen(false);
    toast.success("Panel layout reset");
  };

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "'") { e.preventDefault(); runCode(); }
      else if (ctrl && e.key === "Enter") { e.preventDefault(); submitCode(); }
      else if (ctrl && e.key === "Backspace") { e.preventDefault(); setIsResetConfirmOpen(true); }
      else if (ctrl && e.key === "ArrowRight") { e.preventDefault(); if (!isLeftMaximized) toggleLeftMaximize(); }
      else if (ctrl && e.key === "ArrowLeft") { e.preventDefault(); if (!isRightMaximized) toggleRightMaximize(); }
      else if (ctrl && e.key === "ArrowUp") { e.preventDefault(); if (!isTestcaseMaximized) toggleTestcaseMaximize(); }
      else if (ctrl && e.key === "ArrowDown") { e.preventDefault(); if (isTestcaseMaximized) toggleTestcaseMaximize(); }
      else if (ctrl && e.key === " ") { e.preventDefault(); resetLayout(); }
      else if (e.shiftKey && e.key === "1") { setBottomTab("testcase"); }
      else if (e.shiftKey && e.key === "2") { setBottomTab("result"); }
      else if (e.altKey && e.key === "/") { e.preventDefault(); setShortcutsOpen(true); }
      else if (e.key === "Escape") { setIsResetConfirmOpen(false); setShortcutsOpen(false); setLayoutMenuOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeftMaximized, isRightMaximized, isTestcaseMaximized, code, language, selectedProblem, activeContest, contestJustEnded]);

  if (loadingWorkspace || !workspace) {
    return <div className="px-5 pt-10 text-muted-foreground">Loading workspace…</div>;
  }

  const timerLabel = secondsLeft != null
    ? `${String(Math.floor(secondsLeft / 3600)).padStart(2, "0")}:${String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`
    : "--:--:--";

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* ── Navbar — dark, 3-section, mirrors the real ProblemNavbar ── */}
      <div className="w-full bg-black grid grid-cols-3 h-12 flex-shrink-0 text-white flex-none">
        <div className="flex items-center h-full pl-2 gap-2">
          <button
            className="flex items-center justify-center rounded-md h-8 px-3 text-sm bg-secondary text-secondary-foreground hover:opacity-90"
            onClick={() => {
              toast.success("Your progress is saved — come back anytime before the contest ends");
              router.push(`/contests/${slug}`);
            }}
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
            className="flex items-center justify-center h-8 px-3 rounded-md bg-secondary text-sm gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={runCode}
            disabled={isRunningCode || contestJustEnded}
            title="Run code (Ctrl+')"
          >
            ▶ Run
          </button>
          <button
            className="flex items-center justify-center h-8 px-3 rounded-md text-sm gap-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
            onClick={submitCode}
            disabled={isSubmittingCode || contestJustEnded}
            title="Submit code (Ctrl+Enter)"
          >
            ⇪ Submit
          </button>
          <div className={`flex items-center justify-center h-8 px-3 rounded-md text-sm font-mono ${contestJustEnded ? "bg-destructive text-destructive-foreground" : "bg-secondary"}`} title="Time remaining in the contest">
            ⏱ {contestJustEnded ? "Ended" : timerLabel}
          </div>
        </div>

        <div className="flex items-center justify-end h-full pr-2 gap-3">
          <div className="flex items-center gap-3 text-xs font-mono mr-1">
            <span>Rank <b>{rank ? `#${rank}` : "—"}</b></span>
            <span>Solved <b>{solvedCount}/{workspace.problems.length}</b></span>
            <span>Penalty <b>{penaltyMins}m</b></span>
          </div>
          <button
            className="flex items-center justify-center h-8 px-3 rounded-md bg-secondary text-sm gap-1"
            onClick={() => router.push(`/contests/${slug}/leaderboard`)}
          >
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </button>
          <div className="relative">
            <div
              className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-secondary"
              onClick={() => setLayoutMenuOpen((v) => !v)}
              title="Layout"
            >
              <Grid2x2 className="w-4 h-4" />
            </div>
            {layoutMenuOpen && (
              <div className="absolute right-0 top-9 w-52 rounded-md border shadow-lg py-1 bg-card text-foreground z-50">
                <div
                  className="px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center gap-2"
                  onClick={resetLayout}
                >
                  ↺ Reset panel layout
                  <kbd className="ml-auto text-[10px] border rounded px-1">Ctrl+Space</kbd>
                </div>
              </div>
            )}
          </div>
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-secondary"
            onClick={() => setShortcutsOpen(true)}
            title="Keyboard shortcuts (Alt+/)"
          >
            <Keyboard className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Problem-pill rail + resizable panel workspace ── */}
      <div className="flex-1 flex min-h-0">
        <div className="border-r flex flex-col items-center py-4 gap-2 flex-shrink-0 w-16">
          {workspace.problems.map((p) => (
            <HoverCard key={p.label} openDelay={150}>
              <HoverCardTrigger asChild>
                <button
                  onClick={() => selectProblem(p.label)}
                  className={`w-[38px] h-[38px] rounded-lg border flex items-center justify-center font-semibold text-sm transition-colors
                    ${selectedLabel === p.label ? "bg-primary text-primary-foreground" : ""}
                    ${solved.has(p.label) ? "!bg-emerald-500 !border-emerald-500 !text-white" : ""}
                    ${attempted.has(p.label) && !solved.has(p.label) ? "ring-2 ring-destructive" : ""}
                  `}
                >
                  {p.label}
                </button>
              </HoverCardTrigger>
              <HoverCardContent side="right" className="text-xs p-2 w-auto">
                {p.points} pts · {p.problem.difficulty}
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>

        <ResizablePanelGroup direction="horizontal" className="flex-1 p-2">
          {/* LEFT: question details, no tabs, bare maximize control bar */}
          <ResizablePanel ref={leftPanelRef} defaultSize={50} minSize={5} className="flex flex-col border rounded-lg overflow-hidden">
            <div className="h-10 flex items-center justify-end px-2 flex-shrink-0 bg-secondary">
              <div
                className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-accent"
                onClick={toggleLeftMaximize}
                title={isLeftMaximized ? "Minimize" : "Maximize"}
              >
                {isLeftMaximized ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedProblem && (
                <>
                  <h2 className="text-xl font-bold mb-3">
                    {selectedProblem.label}. {selectedProblem.problem.title}
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium capitalize">
                      {selectedProblem.problem.difficulty}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {selectedProblem.points} pts
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedProblem.problem.description}
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-3">Examples</h3>
                    {(selectedProblem.problem.examples as { id: number; input: string; output: string; explanation: string }[]).map((ex) => (
                      <div key={ex.id} className="mb-3 bg-secondary rounded-md p-3">
                        <p className="text-sm"><span className="font-semibold">Input:</span> {ex.input}</p>
                        <p className="text-sm mt-1"><span className="font-semibold">Output:</span> {ex.output}</p>
                        {ex.explanation && (
                          <p className="text-sm mt-1"><span className="font-semibold">Explanation:</span> {ex.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {(selectedProblem.problem.constraints as string[])?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">Constraints</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm font-mono">
                        {(selectedProblem.problem.constraints as string[]).map((c, i) => (
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

          {/* RIGHT: editor (upper) + testcase/results (lower) */}
          <ResizablePanel ref={rightPanelRef} defaultSize={50} minSize={5}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel ref={editorPanelRef} defaultSize={88} minSize={7} className="flex flex-col border rounded-lg overflow-hidden">
                <div className="h-10 flex items-center justify-between px-2 flex-shrink-0 bg-secondary">
                  <div className="flex items-center gap-1.5">
                    <LangDropdown selectedLanguage={language} onLanguageChange={setLanguage} />
                    <ThemeDropdown selectedTheme={theme} onThemeChange={setTheme} />
                    <FontSizeDropdown onFontSizeChange={setFontSize} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center justify-center h-7 px-3 rounded-md bg-secondary text-sm gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={runCode}
                      disabled={isRunningCode || contestJustEnded}
                      title="Run code (Ctrl+')"
                    >
                      ▶ Run
                    </button>
                    <button
                      className="flex items-center justify-center h-7 px-3 rounded-md text-sm gap-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
                      onClick={submitCode}
                      disabled={isSubmittingCode || contestJustEnded}
                      title="Submit code (Ctrl+Enter)"
                    >
                      ⇪ Submit
                    </button>
                    <span className="text-xs text-muted-foreground w-12 text-right select-none">
                      {saveIndicator === "saving" ? "Saving…" : "Saved"}
                    </span>
                    <AlertDialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <History
                            className="w-4 h-4 text-yellow-500 cursor-pointer"
                            onClick={() => setIsResetConfirmOpen(true)}
                          />
                        </HoverCardTrigger>
                        <HoverCardContent className="text-xs p-2 w-auto">Reset code</HoverCardContent>
                      </HoverCard>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset to starter code?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your current code will be lost and replaced with the starter template. This can&apos;t be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmReset}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <div
                      className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-accent"
                      onClick={toggleRightMaximize}
                      title={isRightMaximized ? "Minimize" : "Maximize"}
                    >
                      {isRightMaximized ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
                <CodeMirror
                  value={code}
                  height="100%"
                  theme={THEME_MAP[theme] ?? githubDark}
                  extensions={[LANG_EXTENSIONS[language]?.() ?? python()]}
                  onChange={handleCodeChange}
                  style={{ fontSize: `${fontSize}px`, flex: 1 }}
                  className="flex-1"
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel ref={testcasePanelRef} defaultSize={12} minSize={7} className="flex flex-col border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-2 border-b flex-shrink-0">
                  <div className="flex">
                    <button
                      className={`px-3 py-2 text-sm font-medium border-b-2 ${bottomTab === "testcase" ? "border-emerald-500 text-foreground" : "border-transparent text-muted-foreground"}`}
                      onClick={() => setBottomTab("testcase")}
                    >
                      Test Cases
                    </button>
                    <button
                      className={`px-3 py-2 text-sm font-medium border-b-2 ${bottomTab === "result" ? "border-emerald-500 text-foreground" : "border-transparent text-muted-foreground"}`}
                      onClick={() => setBottomTab("result")}
                    >
                      Results
                    </button>
                  </div>
                  <div
                    className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-accent"
                    onClick={toggleTestcaseMaximize}
                    title={isTestcaseMaximized ? "Minimize" : "Maximize"}
                  >
                    {isTestcaseMaximized ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  {bottomTab === "testcase" && selectedProblem && (
                    <div className="absolute inset-0 overflow-y-auto p-3 text-xs">
                      {(selectedProblem.problem.examples as { id: number; input: string; output: string }[])
                        .slice(0, 3)
                        .map((ex) => (
                          <div key={ex.id} className="mb-2 rounded-md border p-2 font-mono">
                            <div><b>Input:</b> {ex.input}</div>
                            <div><b>Expected:</b> {ex.output}</div>
                          </div>
                        ))}
                    </div>
                  )}
                  {bottomTab === "result" && lastAction === "run" && <ResultsPanel />}
                  {bottomTab === "result" && lastAction === "submit" && <QuestionResults />}
                  {bottomTab === "result" && !lastAction && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                      Run or Submit to see results here.
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Shortcuts dialog */}
      <AlertDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Keyboard Shortcuts</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto text-sm">
            {[
              { label: "Code Execution", items: [
                ["Run code", "Ctrl+'"], ["Submit code", "Ctrl+Enter"], ["Reset code (confirm required)", "Ctrl+Backspace"],
              ]},
              { label: "Panel Layout", items: [
                ["Maximize left panel", "Ctrl+→"], ["Maximize right panel", "Ctrl+←"],
                ["Maximize bottom panel", "Ctrl+↑"], ["Minimize bottom panel", "Ctrl+↓"], ["Reset panel layout", "Ctrl+Space"],
              ]},
              { label: "Bottom Panel Tabs", items: [
                ["Switch to Test Cases", "Shift+1"], ["Switch to Results", "Shift+2"],
              ]},
            ].map((group) => (
              <div key={group.label}>
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">{group.label}</div>
                <div className="flex flex-col gap-1.5">
                  {group.items.map(([name, keys]) => (
                    <div key={name} className="flex items-center justify-between">
                      <span>{name}</span>
                      <kbd className="text-[10px] border rounded px-1.5 py-0.5 bg-secondary">{keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShortcutsOpen(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End-of-contest overlay — server already rejects late submissions
          on its own; this just makes sure the user isn't left guessing
          why Submit stopped responding. */}
      {contestJustEnded && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center">
          <div className="bg-card border rounded-xl p-8 max-w-sm text-center">
            <div className="text-2xl mb-2">⏱</div>
            <h2 className="text-lg font-bold">Contest has ended</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Submissions are closed. Your final standing and rating update will
              be posted to the leaderboard shortly.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Returning to the lobby…</p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import QuestionTabs from "../tabs/QuestionTabs";
import CodeEditor from "../codePanel/editor/CodeEditor";
import TestCasesTabs from "../tabs/TestCasesTabs";
import {
  useSubmissionStore,
  getSubmitTabOpenKey,
} from "@/features/submissionStore";
import { useCommentPanel } from "@/context/commentPanelContext";
import PostComments from "../questionDiscussion/bottomSection/postCard/fullPostPanel/PostComments";
import { useAiAnalysisPanel } from "@/context/aiAnalysisPanelContext";
import AIAnalysisPanel from "../questionResults/aiAnalysisPanel/AIAnalysisPanel";
import { motion } from "framer-motion";

type ResizablePanelsProps = {
  resetLayoutTrigger?: number;
  runCodeTrigger?: number;
  submitCodeTrigger?: number;
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
};

const ResizablePanels: React.FC<ResizablePanelsProps> = ({
  resetLayoutTrigger,
  runCodeTrigger,
  submitCodeTrigger,
  code,
  setCode,
  language,
  setLanguage,
}) => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title");
  const {
    hydrateRunCodeResult,
    hydrateSubmitCodeResult,
    clearRunCodeResult,
    clearSubmitCodeResult,
  } = useSubmissionStore();

  const { isOpen: isCommentPanelOpen, setIsOpen: setIsCommentPanelOpen } =
    useCommentPanel();
  const { isOpen: isAiPanelOpen, setIsOpen: setIsAiPanelOpen } =
    useAiAnalysisPanel();

  const [showResultsTab, setShowResultsTab] = useState(false);
  // Increments on every submit — forces QuestionTabs to snap focus onto the
  // "results" tab even if it was already open in the background.
  const [resultsFocusTrigger, setResultsFocusTrigger] = useState(0);
  const [showTestCasesResultsTab, setShowTestCasesResultsTab] = useState(false);
  const [verticalSizes, setVerticalSizes] = useState([93, 7]);
  const [shouldResize, setShouldResize] = useState(false);
  const [isLeftMaximized, setIsLeftMaximized] = useState(false);
  const [isRightMaximized, setIsRightMaximized] = useState(false);
  const [isTestCasesMaximized, setIsTestCasesMaximized] = useState(false);
  const [isAiPanelFullscreen, setIsAiPanelFullscreen] = useState(false);
  // Transient: remembers whether the AI panel was in Fullscreen mode at
  // the exact moment it was closed (from ANY call site — its own "Back to
  // editor" button, the Comments mutual-exclusion effect, or the Part 4
  // navbar Run/Submit auto-close). This is the only thing that decides
  // which of the two possible zero-width "closed" resting positions the
  // overlay collapses toward — see the effect in 7f and the `animate`
  // values in 7i below. It's reset back to `false` as soon as the panel
  // opens again.
  const [aiPanelClosedFromFullscreen, setAiPanelClosedFromFullscreen] =
    useState(false);
  // Same shape as the two flags above, for PostComments' own Fullscreen
  // feature — deliberately a SEPARATE pair of flags, not shared with the
  // AI panel's. The two overlays are mutually exclusive (never open at the
  // same time — Part 2 §7b), but each remembers its own fullscreen history
  // independently: e.g. if Comments was closed while fullscreen, then AI
  // Analysis is opened and closed normally, then Comments is reopened, it
  // must NOT still think it's "closed from fullscreen" from two panels ago.
  const [isCommentPanelFullscreen, setIsCommentPanelFullscreen] =
    useState(false);
  const [
    commentPanelClosedFromFullscreen,
    setCommentPanelClosedFromFullscreen,
  ] = useState(false);
  const [shouldMaximizeHorizontal, setShouldMaximizeHorizontal] =
    useState(false);
  const [shouldMaximizeVertical, setShouldMaximizeVertical] = useState(false);
  const [horizontalSizes, setHorizontalSizes] = useState([50, 50]);
  const [shouldResetLayout, setShouldResetLayout] = useState(false);

  // Outer relative wrapper (contains ResizablePanelGroup + both overlays) —
  // the containing block both overlays are positioned against.
  const panelGroupContainerRef = useRef<HTMLDivElement>(null);
  // Plain, unstyled measurement div rendered directly inside the right
  // ResizablePanel. `rightPanelRef` itself (from react-resizable-panels)
  // is an imperative handle (resize()/getSize()), NOT a DOM node, so it
  // can't be measured with getBoundingClientRect — this ref exists purely
  // so we have a real DOM element that always exactly matches the right
  // panel's rendered box.
  const rightPanelDomRef = useRef<HTMLDivElement>(null);

  // The right panel's real, measured left edge and the panel group's real
  // width, in pixels — kept in sync with the actual DOM via ResizeObserver
  // below. Both AI Analysis and Post Comments overlays position themselves
  // from these numbers instead of a percentage + guessed margin.
  const [rightPanelLeftPx, setRightPanelLeftPx] = useState(0);
  const [panelGroupWidthPx, setPanelGroupWidthPx] = useState(0);

  // CodeEditor/TestCasesTabs are rendered with "ml-1" (4px) inside the raw
  // right ResizablePanel, so their real bordered box starts 4px to the
  // right of rightPanelLeftPx (which measures the raw, unmargined panel
  // edge). The overlays must match that same 4px inset on their left side
  // or they sit 4px further left than the panel they're supposed to cover.
  const RIGHT_PANEL_LEFT_INSET = 4;

  // Whether the NEXT left/right change on the overlays should be CSS-
  // animated (true) or applied instantly (false). Set true only when
  // isOpen/isFullscreen actually change (see the effect below); set false
  // every time the ResizeObserver fires, since a resize-driven position
  // update should track the real panel with zero extra lag — the real
  // panel's own motion (drag, or the 500ms animateResize rAF loop) is
  // already the only animation that should be visible.
  const [overlayPositionAnimated, setOverlayPositionAnimated] = useState(false);

  // Whether each overlay should still be rendered/visible. Unlike
  // isAiPanelOpen/isCommentPanelOpen (which flip instantly), these stay
  // `true` for the duration of the 0.5s closing animation and only drop
  // to `false` once framer-motion actually finishes animating the panel
  // off-screen (see onAnimationComplete below). Without this, the
  // `visibility: hidden` / `pointerEvents: none` styles used to flip the
  // instant isOpen state changed, which hid the panel in the very same
  // frame the close animation started — making the animation invisible.
  const [isAiPanelVisible, setIsAiPanelVisible] = useState(isAiPanelOpen);
  const [isCommentPanelVisible, setIsCommentPanelVisible] =
    useState(isCommentPanelOpen);

  useEffect(() => {
    if (isAiPanelOpen) setIsAiPanelVisible(true);
  }, [isAiPanelOpen]);

  useEffect(() => {
    if (isCommentPanelOpen) setIsCommentPanelVisible(true);
  }, [isCommentPanelOpen]);
  // Measures the right panel's real position/size and keeps the two state
  // values above in sync.
  //
  // Called from TWO places, deliberately:
  //  1. Synchronously from handleHorizontalLayoutChange below — the path
  //     that actually matters. react-resizable-panels invokes onLayout in
  //     the SAME synchronous call stack as the DOM style change, for both
  //     a manual drag AND every rAF tick of animateResize (Maximize/
  //     Minimize/Reset). Measuring here means the overlay updates in the
  //     exact same frame the real panel moved.
  //  2. As a ResizeObserver fallback below — for size changes that do NOT
  //     go through onLayout, e.g. the browser window itself resizing.
  //
  // Why the fallback alone caused visible trailing: ResizeObserver is
  // specced to fire one animation frame AFTER the DOM change it reports,
  // never in the same frame. Relying on it for drag/animateResize meant
  // the overlay was always exactly one frame behind the real panel edge.
  // Calling measure() directly from onLayout removes that delay entirely.
  const measure = () => {
    if (!panelGroupContainerRef.current || !rightPanelDomRef.current) return;
    const groupRect = panelGroupContainerRef.current.getBoundingClientRect();
    const rightRect = rightPanelDomRef.current.getBoundingClientRect();
    // flushSync forces this re-render (and browser paint) to happen in the
    // SAME frame the real panel's size just changed in.
    flushSync(() => {
      setOverlayPositionAnimated(false);
      setRightPanelLeftPx(rightRect.left - groupRect.left);
      setPanelGroupWidthPx(groupRect.width);
    });
  };

  useEffect(() => {
    measure();

    // Fallback only — covers size changes NOT caused by our own drag or
    // animateResize handlers, e.g. the browser window resizing. Every
    // resize WE cause is already covered synchronously via
    // handleHorizontalLayoutChange calling measure() directly.
    const resizeObserver = new ResizeObserver(measure);
    if (rightPanelDomRef.current)
      resizeObserver.observe(rightPanelDomRef.current);
    if (panelGroupContainerRef.current)
      resizeObserver.observe(panelGroupContainerRef.current);

    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detects isOpen/isFullscreen changes for EITHER overlay (as opposed to
  // resize-driven changes) and turns the CSS transition back on for
  // exactly that state flip. This is the only case that should ever be
  // animated — see overlayPositionAnimated's comment above.
  const prevOverlayFlagsRef = useRef({
    isAiPanelOpen,
    isCommentPanelOpen,
    isAiPanelFullscreen,
    isCommentPanelFullscreen,
  });
  useEffect(() => {
    const prev = prevOverlayFlagsRef.current;
    const changed =
      prev.isAiPanelOpen !== isAiPanelOpen ||
      prev.isCommentPanelOpen !== isCommentPanelOpen ||
      prev.isAiPanelFullscreen !== isAiPanelFullscreen ||
      prev.isCommentPanelFullscreen !== isCommentPanelFullscreen;
    if (changed) setOverlayPositionAnimated(true);
    prevOverlayFlagsRef.current = {
      isAiPanelOpen,
      isCommentPanelOpen,
      isAiPanelFullscreen,
      isCommentPanelFullscreen,
    };
  }, [
    isAiPanelOpen,
    isCommentPanelOpen,
    isAiPanelFullscreen,
    isCommentPanelFullscreen,
  ]);

  // Mutual exclusion: opening one of these two right-panel overlays must
  // close the other. Handled centrally here (rather than at each panel's
  // own open-trigger call site) since this is the one place that already
  // consumes both contexts — avoids having to duplicate this rule in
  // BottomSection.tsx (comments) and SubmittedCode.tsx (AI) separately.
  useEffect(() => {
    if (isCommentPanelOpen) {
      setIsAiPanelOpen(false);
    }
  }, [isCommentPanelOpen, setIsAiPanelOpen]);

  useEffect(() => {
    if (isAiPanelOpen) {
      setIsCommentPanelOpen(false);
    }
  }, [isAiPanelOpen, setIsCommentPanelOpen]);

  // Detects the exact moment isAiPanelOpen flips true → false, regardless
  // of which of the several call sites triggered it (this panel's own
  // Back button, the Comments-opened mutual-exclusion effect from §7b, or
  // the Part 4 navbar Run/Submit auto-close). At that moment, capture
  // whatever isAiPanelFullscreen currently is — BEFORE resetting it — so
  // updateAiPanelPosition (via the `animate` values in 7i) knows which
  // edge to collapse the now-closing overlay toward. Also handles the
  // reverse transition (false → true): a fresh open always starts from the
  // normal, non-fullscreen resting position.
  const wasAiPanelOpenRef = useRef(isAiPanelOpen);
  useEffect(() => {
    const wasOpen = wasAiPanelOpenRef.current;
    if (wasOpen && !isAiPanelOpen) {
      setAiPanelClosedFromFullscreen(isAiPanelFullscreen);
      setIsAiPanelFullscreen(false);
    } else if (!wasOpen && isAiPanelOpen) {
      setAiPanelClosedFromFullscreen(false);
    }
    wasAiPanelOpenRef.current = isAiPanelOpen;
  }, [isAiPanelOpen, isAiPanelFullscreen]);

  // Identical logic to the effect above, for PostComments. Covers every
  // call site that can close Comments: its own "Back to editor" button
  // (via context, same as AI panel's), the AI-panel-opened mutual-exclusion
  // effect from §7b, and the Part 4 navbar Run/Submit auto-close.
  const wasCommentPanelOpenRef = useRef(isCommentPanelOpen);
  useEffect(() => {
    const wasOpen = wasCommentPanelOpenRef.current;
    if (wasOpen && !isCommentPanelOpen) {
      setCommentPanelClosedFromFullscreen(isCommentPanelFullscreen);
      setIsCommentPanelFullscreen(false);
    } else if (!wasOpen && isCommentPanelOpen) {
      setCommentPanelClosedFromFullscreen(false);
    }
    wasCommentPanelOpenRef.current = isCommentPanelOpen;
  }, [isCommentPanelOpen, isCommentPanelFullscreen]);

  // AI Analysis panel fullscreen toggle. Distinct from the regular
  // Maximize/Minimize button (handleRightMaximize/isRightMaximized), which
  // resizes the real ResizablePanels to a 5/95 split. This toggles a
  // purely visual overlay state instead — see the `animate` values in 7i
  // — and never calls setHorizontalSizes, never touches isLeftMaximized/
  // isRightMaximized, and never resizes any ResizablePanel. Completely
  // independent of Maximize: if the user maximizes the right panel first
  // and then goes Fullscreen, the AI panel's left edge still travels all
  // the way to the group's true 0% regardless of the current
  // horizontalSizes — and if they exit Fullscreen afterward, the real
  // panels (and the AI panel's normal-state left edge) are exactly where
  // Maximize left them, with no drift.
  const handleAiPanelFullscreen = () => {
    if (!isAiPanelOpen) return; // fullscreen only makes sense while open
    setIsAiPanelFullscreen((prev) => !prev);
  };

  // Identical to handleAiPanelFullscreen above, for PostComments. Same
  // independence from Maximize/Minimize and from real ResizablePanel
  // sizing — see the comment on handleAiPanelFullscreen in Part 5 §7f,
  // which applies here unchanged.
  const handleCommentPanelFullscreen = () => {
    if (!isCommentPanelOpen) return;
    setIsCommentPanelFullscreen((prev) => !prev);
  };

  // Default sizes for reset
  const DEFAULT_HORIZONTAL_SIZES = [50, 50];
  const DEFAULT_VERTICAL_SIZES = [93, 7];

  // Refs for imperative control
  const codeEditorPanelRef = useRef<any>(null);
  const testCasesPanelRef = useRef<any>(null);
  const leftPanelRef = useRef<any>(null);
  const rightPanelRef = useRef<any>(null);

  // Track active animations per panel
  const activeAnimations = useRef<Map<any, number>>(new Map());

  // Flag to prevent layout callbacks during programmatic animations
  const isAnimatingRef = useRef(false);

  // Promise-based smooth animation function
  const animateResize = (
    panelRef: any,
    targetSize: number,
    duration: number = 500,
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!panelRef.current) {
        resolve();
        return;
      }

      // Cancel any ongoing animation for this specific panel
      const existingAnimation = activeAnimations.current.get(panelRef);
      if (existingAnimation) {
        cancelAnimationFrame(existingAnimation);
        activeAnimations.current.delete(panelRef);
      }

      const startSize = panelRef.current.getSize();
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth cubic easing function (ease-in-out)
        const easeProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentSize = startSize + (targetSize - startSize) * easeProgress;

        if (panelRef.current) {
          panelRef.current.resize(currentSize);
        }

        if (progress < 1) {
          const animationId = requestAnimationFrame(animate);
          activeAnimations.current.set(panelRef, animationId);
        } else {
          activeAnimations.current.delete(panelRef);
          resolve();
        }
      };

      const animationId = requestAnimationFrame(animate);
      activeAnimations.current.set(panelRef, animationId);
    });
  };

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      activeAnimations.current.forEach((animationId) => {
        cancelAnimationFrame(animationId);
      });
      activeAnimations.current.clear();
    };
  }, []);

  // Add useEffect to handle run code trigger from navbar
  useEffect(() => {
    if (runCodeTrigger && runCodeTrigger > 0) {
      handleCodeRun();
      // Running code from the top navbar should back out of whichever
      // right-panel overlay (Comments / AI Analysis) is currently open, so
      // the user lands back on the editor + results they just triggered.
      setIsCommentPanelOpen(false);
      setIsAiPanelOpen(false);
    }
  }, [runCodeTrigger, setIsCommentPanelOpen, setIsAiPanelOpen]);

  // Add useEffect to handle submit code trigger from navbar
  useEffect(() => {
    if (submitCodeTrigger && submitCodeTrigger > 0) {
      handleCodeSubmit();
      // Same reasoning as the run-code effect above.
      setIsCommentPanelOpen(false);
      setIsAiPanelOpen(false);
    }
  }, [submitCodeTrigger, setIsCommentPanelOpen, setIsAiPanelOpen]);

  // Reset layout when trigger changes
  useEffect(() => {
    if (resetLayoutTrigger && resetLayoutTrigger > 0) {
      setHorizontalSizes(DEFAULT_HORIZONTAL_SIZES);
      setVerticalSizes(DEFAULT_VERTICAL_SIZES);
      setIsLeftMaximized(false);
      setIsRightMaximized(false);
      setIsTestCasesMaximized(false);
      setIsAiPanelFullscreen(false);
      setIsCommentPanelFullscreen(false);
      setShouldResetLayout(true);
    }
  }, [resetLayoutTrigger]);

  // Handle layout reset with smooth animations
  useEffect(() => {
    if (shouldResetLayout) {
      isAnimatingRef.current = true;
      const animations = [];

      if (leftPanelRef.current && rightPanelRef.current) {
        animations.push(
          animateResize(leftPanelRef, DEFAULT_HORIZONTAL_SIZES[0], 500),
        );
        animations.push(
          animateResize(rightPanelRef, DEFAULT_HORIZONTAL_SIZES[1], 500),
        );
      }

      if (codeEditorPanelRef.current && testCasesPanelRef.current) {
        animations.push(
          animateResize(codeEditorPanelRef, DEFAULT_VERTICAL_SIZES[0], 500),
        );
        animations.push(
          animateResize(testCasesPanelRef, DEFAULT_VERTICAL_SIZES[1], 500),
        );
      }

      Promise.all(animations).then(() => {
        setShouldResetLayout(false);
        isAnimatingRef.current = false;
      });
    }
  }, [shouldResetLayout]);

  // Add keyboard shortcut for reset layout
  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      const isSpace = e.key === " ";

      // Exclude Shift so this doesn't also fire on Ctrl/Cmd+Shift+Space,
      // which is the AI Analysis / Post Comments full-close shortcut.
      if (isControl && isSpace && !e.shiftKey) {
        e.preventDefault();
        setHorizontalSizes(DEFAULT_HORIZONTAL_SIZES);
        setVerticalSizes(DEFAULT_VERTICAL_SIZES);
        setIsLeftMaximized(false);
        setIsRightMaximized(false);
        setIsTestCasesMaximized(false);
        setIsAiPanelFullscreen(false);
        setIsCommentPanelFullscreen(false);
        setShouldResetLayout(true);
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, []);

  // Ctrl/Cmd+Shift+← : whichever overlay (AI Analysis or Post Comments) is
  // currently open goes fullscreen. Ctrl/Cmd+Shift+→ : that overlay exits
  // fullscreen but stays open. Ctrl/Cmd+Shift+Space : that overlay closes
  // fully, from either state. No-op if neither overlay is open.
  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      if (!isControl || !e.shiftKey) return;

      const activePanel = isAiPanelOpen
        ? "ai"
        : isCommentPanelOpen
          ? "comments"
          : null;
      if (!activePanel) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activePanel === "ai") setIsAiPanelFullscreen(true);
        else setIsCommentPanelFullscreen(true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (activePanel === "ai") setIsAiPanelFullscreen(false);
        else setIsCommentPanelFullscreen(false);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsAiPanelOpen(false);
        setIsCommentPanelOpen(false);
      }
    };

    window.addEventListener("keydown", keyboardShortcut);
    return () => window.removeEventListener("keydown", keyboardShortcut);
  }, [
    isAiPanelOpen,
    isCommentPanelOpen,
    setIsAiPanelOpen,
    setIsCommentPanelOpen,
  ]);

  const handleCodeSubmit = () => {
    setShowResultsTab(true);
    // Always bump the trigger, even if showResultsTab was already true —
    // this is what forces the tab back into focus on a resubmit.
    setResultsFocusTrigger((prev) => prev + 1);
  };

  // Reload-proof AND problem-switch-proof: whenever the current problem
  // changes — whether from a full page load/reload, or a client-side
  // navigation that doesn't remount anything (e.g. picking a different
  // problem from the ProblemSidebar overlay, which just changes the `title`
  // query param on the same page) — first clear whatever run/submit result
  // and results-tab state is currently live, THEN hydrate from this
  // problem's own sessionStorage entry if one exists.
  //
  // The clear step matters even though hydrate*Result already exists: hydrate
  // only overwrites state when something IS saved for the new problem. If
  // the new problem has no saved result (the common case), hydrate is a
  // no-op and the previous problem's result would otherwise stay on screen.
  useEffect(() => {
    if (!problemTitle) return;

    clearRunCodeResult();
    clearSubmitCodeResult();
    setShowResultsTab(false);
    setShowTestCasesResultsTab(false);

    hydrateRunCodeResult(problemTitle);
    hydrateSubmitCodeResult(problemTitle);
    const savedOpen = sessionStorage.getItem(getSubmitTabOpenKey(problemTitle));
    if (savedOpen === "true") {
      setShowResultsTab(true);
    }
  }, [
    problemTitle,
    hydrateRunCodeResult,
    hydrateSubmitCodeResult,
    clearRunCodeResult,
    clearSubmitCodeResult,
  ]);

  // Keep the "results tab open?" flag persisted per problem, so a reload
  // remembers whether it was open, but it never leaks into another problem.
  useEffect(() => {
    if (!problemTitle) return;
    sessionStorage.setItem(
      getSubmitTabOpenKey(problemTitle),
      showResultsTab ? "true" : "false",
    );
  }, [showResultsTab, problemTitle]);

  const handleCodeRun = () => {
    console.log("handleCodeRun clicked");
    setShowTestCasesResultsTab(true);
    setVerticalSizes([50, 50]);
    setShouldResize(true);
  };

  // Left panel (QuestionTabs) maximize function
  const handleLeftMaximize = () => {
    if (isLeftMaximized) {
      // Minimize: restore to normal sizes
      setHorizontalSizes([50, 50]);
      setIsRightMaximized(false);
    } else {
      // Maximize: left panel to max, right panel to min
      setHorizontalSizes([95, 5]);
      setIsRightMaximized(false);
    }
    setIsLeftMaximized(!isLeftMaximized);
    setShouldMaximizeHorizontal(true);
  };

  // Right panel (CodeEditor) maximize function
  const handleRightMaximize = () => {
    if (isRightMaximized) {
      // Minimize: restore to normal sizes
      setHorizontalSizes([50, 50]);
      setIsLeftMaximized(false);
    } else {
      // Maximize: right panel to max, left panel to min
      setHorizontalSizes([5, 95]);
      setIsLeftMaximized(false);
    }
    setIsRightMaximized(!isRightMaximized);
    setShouldMaximizeHorizontal(true);
  };

  const handleTestCasesMaximize = () => {
    if (isTestCasesMaximized) {
      setVerticalSizes([93, 7]);
    } else {
      setVerticalSizes([7, 93]);
    }
    setIsTestCasesMaximized(!isTestCasesMaximized);
    setShouldMaximizeVertical(true);
  };

  useEffect(() => {
    if (shouldResize) {
      isAnimatingRef.current = true;
      Promise.all([
        animateResize(codeEditorPanelRef, 50, 500),
        animateResize(testCasesPanelRef, 50, 500),
      ]).then(() => {
        setShouldResize(false);
        isAnimatingRef.current = false;
      });
    }
  }, [shouldResize]);

  useEffect(() => {
    if (shouldMaximizeHorizontal) {
      isAnimatingRef.current = true;
      Promise.all([
        animateResize(leftPanelRef, horizontalSizes[0], 500),
        animateResize(rightPanelRef, horizontalSizes[1], 500),
      ]).then(() => {
        setShouldMaximizeHorizontal(false);
        isAnimatingRef.current = false;
      });
    }
  }, [shouldMaximizeHorizontal, horizontalSizes]);

  useEffect(() => {
    if (shouldMaximizeVertical) {
      isAnimatingRef.current = true;
      Promise.all([
        animateResize(codeEditorPanelRef, verticalSizes[0], 500),
        animateResize(testCasesPanelRef, verticalSizes[1], 500),
      ]).then(() => {
        setShouldMaximizeVertical(false);
        isAnimatingRef.current = false;
      });
    }
  }, [shouldMaximizeVertical, verticalSizes]);

  const handleCloseSubmissionTab = () => {
    setShowResultsTab(false);
    // The AI panel analyzes the submitted code shown in the Results tab —
    // if that tab is closed, there's nothing left for it to be floating
    // over, so close it too.
    setIsAiPanelOpen(false);
  };

  const handleVerticalLayoutChange = (sizes: number[]) => {
    // Ignore layout changes during programmatic animations
    if (isAnimatingRef.current) return;

    setVerticalSizes(sizes);

    // Update maximize states based on actual sizes for vertical panels
    if (sizes[1] > 90) {
      setIsTestCasesMaximized(true);
    } else if (sizes[0] > 90) {
      setIsTestCasesMaximized(false);
    } else if (Math.abs(sizes[0] - 93) < 10 && Math.abs(sizes[1] - 7) < 10) {
      setIsTestCasesMaximized(false);
    }
  };

  const handleHorizontalLayoutChange = (sizes: number[]) => {
    // Track the overlay's position in the SAME synchronous call stack as
    // this real size change — covers both manual drag and every rAF tick
    // of the animateResize loop (Maximize/Minimize/Reset). Must run
    // unconditionally, even while isAnimatingRef.current is true — that's
    // exactly the case where the one-frame ResizeObserver delay was most
    // visible as trailing.
    measure();

    // Ignore maximize-state bookkeeping during programmatic animations —
    // unrelated to overlay tracking, kept as before.
    if (isAnimatingRef.current) return;

    setHorizontalSizes(sizes);

    // Update maximize states based on actual sizes
    // This handles manual resizing by the user
    if (sizes[0] > 90) {
      setIsLeftMaximized(true);
      setIsRightMaximized(false);
    } else if (sizes[1] > 90) {
      setIsRightMaximized(true);
      setIsLeftMaximized(false);
    } else if (Math.abs(sizes[0] - 50) < 10 && Math.abs(sizes[1] - 50) < 10) {
      setIsLeftMaximized(false);
      setIsRightMaximized(false);
    }
  };

  return (
    <div
      ref={panelGroupContainerRef}
      className="relative flex-1 h-[calc(100vh-3rem)] overflow-auto flex justify-center items-center m-4 rounded-lg"
    >
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={handleHorizontalLayoutChange}
      >
        {/* Left Panel (QuestionTabs) */}
        <ResizablePanel
          ref={leftPanelRef}
          defaultSize={50}
          minSize={5}
          maxSize={95}
          className="mr-1 rounded-lg border"
        >
          <div className="flex h-full items-center justify-center">
            <QuestionTabs
              showResultsTab={showResultsTab}
              focusResultsTrigger={resultsFocusTrigger}
              onCloseResultsTab={handleCloseSubmissionTab}
              onMaximize={handleLeftMaximize}
              isMaximized={isLeftMaximized}
              code={code}
              language={language}
            />
          </div>
        </ResizablePanel>

        {/* Resizable Handle */}
        <div className="flex justify-center items-center w-1 hover:bg-green-600 rounded-md">
          <ResizableHandle withHandle />
        </div>

        {/* Right Panel (CodeEditor and TestCases) */}
        <ResizablePanel
          ref={rightPanelRef}
          defaultSize={50}
          minSize={5}
          maxSize={95}
        >
          {/* Plain measurement wrapper — no styling of its own, exists only
              so rightPanelDomRef can be measured with getBoundingClientRect.
              Always exactly matches the right panel's real rendered box. */}
          <div ref={rightPanelDomRef} className="h-full w-full">
            <ResizablePanelGroup
              direction="vertical"
              onLayout={handleVerticalLayoutChange}
            >
              {/* Top Panel (CodeEditor) */}
              <ResizablePanel
                ref={codeEditorPanelRef}
                defaultSize={93}
                minSize={7}
                maxSize={93}
                className="ml-1 mb-1 rounded-lg border"
              >
                <div className="flex h-full items-center justify-center">
                  <CodeEditor
                    onCodeSubmit={handleCodeSubmit}
                    onCodeRun={handleCodeRun}
                    onMaximize={handleRightMaximize}
                    isMaximized={isRightMaximized}
                    code={code}
                    setCode={setCode}
                    language={language}
                    setLanguage={setLanguage}
                  />
                </div>
              </ResizablePanel>

              {/* Resizable Handle */}
              <div className="h-1 hover:bg-green-600 rounded-md ml-1">
                <ResizableHandle withHandle />
              </div>

              {/* Bottom Panel (TestCases) */}
              <ResizablePanel
                ref={testCasesPanelRef}
                defaultSize={7}
                maxSize={93}
                minSize={7}
                className="ml-1 mt-1 rounded-lg border"
              >
                <div className="flex h-full items-center justify-center">
                  <TestCasesTabs
                    onMaximize={handleTestCasesMaximize}
                    isMaximized={isTestCasesMaximized}
                    showTestCasesResultsTab={showTestCasesResultsTab}
                    setShowTestCasesResultsTab={setShowTestCasesResultsTab}
                    verticalSizes={verticalSizes}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Post Comments — a SINGLE node, sibling of the horizontal
          ResizablePanelGroup, positioned identically to AIAnalysisPanel
          below (same left/right percentage scheme, same four-state
          collapse logic, same always-mounted/never-unmounted node). The
          only difference from the AIAnalysisPanel block is which state
          variables it reads: isCommentPanelOpen/isCommentPanelFullscreen/
          commentPanelClosedFromFullscreen instead of the AI panel's. */}
      <motion.div
        initial={false}
        animate={{
          left: isCommentPanelOpen
            ? isCommentPanelFullscreen
              ? 0
              : rightPanelLeftPx + RIGHT_PANEL_LEFT_INSET
            : commentPanelClosedFromFullscreen
              ? panelGroupWidthPx
              : rightPanelLeftPx + RIGHT_PANEL_LEFT_INSET,
          right: isCommentPanelOpen
            ? 0
            : commentPanelClosedFromFullscreen
              ? 0
              : panelGroupWidthPx - rightPanelLeftPx,
        }}
        transition={
          overlayPositionAnimated
            ? { type: "tween", duration: 0.5, ease: "easeInOut" }
            : { duration: 0 }
        }
        onAnimationComplete={() => {
          // Only hide once the CLOSE animation finishes — if the panel
          // was reopened mid-close, isCommentPanelOpen will be true again
          // and this must not hide it.
          if (!isCommentPanelOpen) setIsCommentPanelVisible(false);
        }}
        className={`absolute top-0 bottom-0 z-[40] overflow-hidden rounded-lg ${
          isCommentPanelVisible ? "border" : ""
        }`}
        style={{
          pointerEvents: isCommentPanelOpen ? "auto" : "none",
          visibility: isCommentPanelVisible ? "visible" : "hidden",
        }}
      >
        <PostComments
          isMaximized={isRightMaximized}
          handleMaximizeMinimize={handleRightMaximize}
          isFullscreen={isCommentPanelFullscreen}
          onToggleFullscreen={handleCommentPanelFullscreen}
        />
      </motion.div>

      <motion.div
        initial={false}
        animate={{
          left: isAiPanelOpen
            ? isAiPanelFullscreen
              ? 0
              : rightPanelLeftPx + RIGHT_PANEL_LEFT_INSET
            : aiPanelClosedFromFullscreen
              ? panelGroupWidthPx
              : rightPanelLeftPx + RIGHT_PANEL_LEFT_INSET,
          right: isAiPanelOpen
            ? 0
            : aiPanelClosedFromFullscreen
              ? 0
              : panelGroupWidthPx - rightPanelLeftPx,
        }}
        transition={
          overlayPositionAnimated
            ? { type: "tween", duration: 0.5, ease: "easeInOut" }
            : { duration: 0 }
        }
        onAnimationComplete={() => {
          // Only hide once the CLOSE animation finishes — if the panel
          // was reopened mid-close, isAiPanelOpen will be true again and
          // this must not hide it.
          if (!isAiPanelOpen) setIsAiPanelVisible(false);
        }}
        className={`absolute top-0 bottom-0 z-[40] overflow-hidden rounded-lg ${
          isAiPanelVisible ? "border" : ""
        }`}
        style={{
          pointerEvents: isAiPanelOpen ? "auto" : "none",
          visibility: isAiPanelVisible ? "visible" : "hidden",
        }}
      >
        <AIAnalysisPanel
          isMaximized={isRightMaximized}
          handleMaximizeMinimize={handleRightMaximize}
          isFullscreen={isAiPanelFullscreen}
          onToggleFullscreen={handleAiPanelFullscreen}
        />
      </motion.div>
    </div>
  );
};

export default ResizablePanels;

import React, { useEffect, useRef, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import QuestionTabs from "../tabs/QuestionTabs";
import CodeEditor from "../codePanel/editor/CodeEditor";
import TestCasesTabs from "../tabs/TestCasesTabs";

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
  const [showResultsTab, setShowResultsTab] = useState(false);
  const [showTestCasesResultsTab, setShowTestCasesResultsTab] = useState(false);
  const [verticalSizes, setVerticalSizes] = useState([93, 7]);
  const [shouldResize, setShouldResize] = useState(false);
  const [isLeftMaximized, setIsLeftMaximized] = useState(false);
  const [isRightMaximized, setIsRightMaximized] = useState(false);
  const [isTestCasesMaximized, setIsTestCasesMaximized] = useState(false);
  const [shouldMaximizeHorizontal, setShouldMaximizeHorizontal] =
    useState(false);
  const [shouldMaximizeVertical, setShouldMaximizeVertical] = useState(false);
  const [horizontalSizes, setHorizontalSizes] = useState([50, 50]);
  const [shouldResetLayout, setShouldResetLayout] = useState(false);

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
    duration: number = 500
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
    }
  }, [runCodeTrigger]);

  // Add useEffect to handle submit code trigger from navbar
  useEffect(() => {
    if (submitCodeTrigger && submitCodeTrigger > 0) {
      handleCodeSubmit();
    }
  }, [submitCodeTrigger]);

  // Reset layout when trigger changes
  useEffect(() => {
    if (resetLayoutTrigger && resetLayoutTrigger > 0) {
      setHorizontalSizes(DEFAULT_HORIZONTAL_SIZES);
      setVerticalSizes(DEFAULT_VERTICAL_SIZES);
      setIsLeftMaximized(false);
      setIsRightMaximized(false);
      setIsTestCasesMaximized(false);
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
          animateResize(leftPanelRef, DEFAULT_HORIZONTAL_SIZES[0], 500)
        );
        animations.push(
          animateResize(rightPanelRef, DEFAULT_HORIZONTAL_SIZES[1], 500)
        );
      }

      if (codeEditorPanelRef.current && testCasesPanelRef.current) {
        animations.push(
          animateResize(codeEditorPanelRef, DEFAULT_VERTICAL_SIZES[0], 500)
        );
        animations.push(
          animateResize(testCasesPanelRef, DEFAULT_VERTICAL_SIZES[1], 500)
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

      if (isControl && isSpace) {
        e.preventDefault();
        setHorizontalSizes(DEFAULT_HORIZONTAL_SIZES);
        setVerticalSizes(DEFAULT_VERTICAL_SIZES);
        setIsLeftMaximized(false);
        setIsRightMaximized(false);
        setIsTestCasesMaximized(false);
        setShouldResetLayout(true);
      }
    };

    window.addEventListener("keydown", keyboardShortcut);

    return () => {
      window.removeEventListener("keydown", keyboardShortcut);
    };
  }, []);

  const handleCodeSubmit = () => {
    setShowResultsTab(true);
  };

  const handleCodeRun = () => {
    setShowTestCasesResultsTab(true);
    setVerticalSizes([60, 40]);
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
        animateResize(codeEditorPanelRef, 60, 500),
        animateResize(testCasesPanelRef, 40, 500),
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
    // Ignore layout changes during programmatic animations
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
    <div className="flex-1 h-[calc(100vh-3rem)] overflow-auto flex justify-center items-center m-4 rounded-lg">
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
              onCloseResultsTab={handleCloseSubmissionTab}
              onMaximize={handleLeftMaximize}
              isMaximized={isLeftMaximized}
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ResizablePanels;

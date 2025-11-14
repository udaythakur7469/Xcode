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
};

const ResizablePanels: React.FC<ResizablePanelsProps> = ({
  resetLayoutTrigger,
  runCodeTrigger,
  submitCodeTrigger,
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

  // Add useEffect to handle run code trigger from navbar
  useEffect(() => {
    if (runCodeTrigger && runCodeTrigger > 0) {
      console.log("Run code triggered from navbar");
      handleCodeRun();
    }
  }, [runCodeTrigger]);

  // Add useEffect to handle submit code trigger from navbar
  useEffect(() => {
    if (submitCodeTrigger && submitCodeTrigger > 0) {
      console.log("Submit code triggered from navbar");
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

  // Handle layout reset
  useEffect(() => {
    if (shouldResetLayout) {
      // Reset horizontal panels
      if (leftPanelRef.current && rightPanelRef.current) {
        leftPanelRef.current.resize(DEFAULT_HORIZONTAL_SIZES[0]);
        rightPanelRef.current.resize(DEFAULT_HORIZONTAL_SIZES[1]);
      }

      // Reset vertical panels
      if (codeEditorPanelRef.current && testCasesPanelRef.current) {
        codeEditorPanelRef.current.resize(DEFAULT_VERTICAL_SIZES[0]);
        testCasesPanelRef.current.resize(DEFAULT_VERTICAL_SIZES[1]);
      }

      setShouldResetLayout(false);
    }
  }, [shouldResetLayout]);

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
      // Use the imperative API to resize panels
      if (codeEditorPanelRef.current && testCasesPanelRef.current) {
        codeEditorPanelRef.current.resize(60);
        testCasesPanelRef.current.resize(40);
      }
      setShouldResize(false);
    }
  }, [shouldResize, verticalSizes]);

  useEffect(() => {
    if (shouldMaximizeHorizontal) {
      // Use the imperative API to resize horizontal panels
      if (leftPanelRef.current && rightPanelRef.current) {
        leftPanelRef.current.resize(horizontalSizes[0]);
        rightPanelRef.current.resize(horizontalSizes[1]);
      }
      setShouldMaximizeHorizontal(false);
    }
  }, [shouldMaximizeHorizontal, horizontalSizes]);

  useEffect(() => {
    if (shouldMaximizeVertical) {
      // Use the imperative API to resize vertical panels
      if (codeEditorPanelRef.current && testCasesPanelRef.current) {
        codeEditorPanelRef.current.resize(verticalSizes[0]);
        testCasesPanelRef.current.resize(verticalSizes[1]);
      }
      setShouldMaximizeVertical(false);
    }
  }, [shouldMaximizeVertical, verticalSizes]);

  const handleCloseSubmissionTab = () => {
    setShowResultsTab(false); // This will hide the result tab
  };

  const handleVerticalLayoutChange = (sizes: number[]) => {
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
      {/* Add a key to force re-render when layout changes */}
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={handleHorizontalLayoutChange}
      >
        {/* Left Panel (QuestionTabs) */}
        <ResizablePanel
          ref={leftPanelRef}
          defaultSize={50} // Use layout state for default size
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
          defaultSize={50} // Use layout state for default size
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

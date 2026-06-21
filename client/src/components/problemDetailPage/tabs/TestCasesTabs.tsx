import React, { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CircleCheckBig, ScrollText, Maximize, Minimize } from "lucide-react";
import TestCasesPanel from "../testCases/testCasesPanel/TestCasesPanel";
import ResultsPanel from "../testCases/resultsPanel/ResultsPanel";
import { useSubmissionStore } from "@/features/submissionStore";

type TestCasesTabsProps = {
  onMaximize?: () => void;
  isMaximized?: boolean;
  showTestCasesResultsTab?: boolean;
  setShowTestCasesResultsTab: (show: boolean) => void;
  verticalSizes: number[];
};

const TestCasesTabs: React.FC<TestCasesTabsProps> = ({
  onMaximize,
  isMaximized = false,
  showTestCasesResultsTab = false,
  setShowTestCasesResultsTab,
  verticalSizes,
}) => {
  const [activeTab, setActiveTab] = useState<"Test cases" | "Results">(
    "Test cases",
  );
  const { clearRunCodeResult } = useSubmissionStore();
  const prevShowTestCasesResultsTab = useRef(showTestCasesResultsTab);

  const handleMaximizeMinimize = useCallback(() => {
    if (onMaximize) onMaximize();
  }, [onMaximize]);

  const handleTabChange = (tab: "Results" | "Test cases") => {
    setActiveTab(tab);
    if (tab === "Test cases") {
      setShowTestCasesResultsTab(false);
      clearRunCodeResult();
    }
  };

  const handleValueChange = (value: string) => {
    if (value === "Test cases" || value === "Results") {
      handleTabChange(value);
    }
  };

  useEffect(() => {
    if (showTestCasesResultsTab) setActiveTab("Results");
  }, [showTestCasesResultsTab]);

  useEffect(() => {
    if (showTestCasesResultsTab && !prevShowTestCasesResultsTab.current) {
      handleTabChange("Results");
    }
    prevShowTestCasesResultsTab.current = showTestCasesResultsTab;
  }, [showTestCasesResultsTab]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      if (isControl && e.key === "ArrowUp" && !isMaximized) {
        e.preventDefault();
        e.stopPropagation();
        handleMaximizeMinimize();
      } else if (isControl && e.key === "ArrowDown" && isMaximized) {
        e.preventDefault();
        e.stopPropagation();
        handleMaximizeMinimize();
      }
    };
    window.addEventListener("keydown", keyboardShortcut);
    return () => window.removeEventListener("keydown", keyboardShortcut);
  }, [isMaximized, handleMaximizeMinimize]);

  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      if (verticalSizes[1] <= 7) return;
      const isShift = e.shiftKey;
      const isOne =
        e.key === "1" || e.code === "Digit1" || e.code === "Numpad1";
      const isTwo =
        e.key === "2" || e.code === "Digit2" || e.code === "Numpad2";
      if (isShift && isOne) {
        e.preventDefault();
        setActiveTab("Test cases");
      } else if (isShift && isTwo) {
        e.preventDefault();
        setActiveTab("Results");
      }
    };
    window.addEventListener("keydown", keyboardShortcut);
    return () => window.removeEventListener("keydown", keyboardShortcut);
  }, [verticalSizes]);

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={handleValueChange}
        className="h-full w-full flex flex-col"
      >
        <div className="h-[43px] bg-secondary rounded-md flex flex-row justify-start px-1 items-center flex-shrink-0">
          <div className="flex flex-1 flex-row justify-start h-full w-full pt-0 mt-2 items-center">
            <TabsList className="w-full">
              <TabsTrigger
                value="Test cases"
                className="hover:bg-gray-100 hover:text-black flex-1 text-center"
              >
                <CircleCheckBig size={16} className="mr-2 text-yellow-500" />
                Test cases
              </TabsTrigger>
              <TabsTrigger
                value="Results"
                className="hover:bg-gray-100 hover:text-black flex-1 text-center"
              >
                <ScrollText size={16} className="mr-2 text-green-500" />
                Results
              </TabsTrigger>
              {isMaximized ? (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Minimize
                      className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                      size={20}
                      onClick={handleMaximizeMinimize}
                    />
                  </HoverCardTrigger>
                  <HoverCardContent className="mr-5 p-1" side="right">
                    Minimize
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Maximize
                      className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                      size={20}
                      onClick={handleMaximizeMinimize}
                    />
                  </HoverCardTrigger>
                  <HoverCardContent className="mr-5 p-1" side="right">
                    Maximize
                  </HoverCardContent>
                </HoverCard>
              )}
            </TabsList>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="Test cases" className="h-full m-0">
            <TestCasesPanel />
          </TabsContent>
          <TabsContent value="Results" className="h-full m-0">
            <ResultsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TestCasesTabs;

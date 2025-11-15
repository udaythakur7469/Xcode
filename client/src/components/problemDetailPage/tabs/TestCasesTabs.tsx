import React, { useEffect, useRef, useState } from "react";
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
};

const TestCasesTabs: React.FC<TestCasesTabsProps> = ({
  onMaximize,
  isMaximized = false,
  showTestCasesResultsTab = false,
  setShowTestCasesResultsTab,
}) => {
  const [activeTab, setActiveTab] = useState<"Test cases" | "Results">(
    "Test cases"
  );
  const { clearRunCodeResult } = useSubmissionStore();

  const prevShowTestCasesResultsTab = useRef(showTestCasesResultsTab);

  const handleMaximizeMinimize = () => {
    if (onMaximize) {
      onMaximize();
    }
  };

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
    if (showTestCasesResultsTab) {
      setActiveTab("Results");
    }
  }, [showTestCasesResultsTab]);

  useEffect(() => {
    if (showTestCasesResultsTab && !prevShowTestCasesResultsTab.current) {
      handleTabChange("Results");
    }
    prevShowTestCasesResultsTab.current = showTestCasesResultsTab;
  }, [showTestCasesResultsTab]);

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={handleValueChange}
        className="h-full w-full"
      >
        {/* Toolbar */}
        <div className="h-[43px] bg-secondary rounded-md flex flex-row justify-start px-1 items-center">
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
              {/* Maximize/Minimize Icon */}
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

        {/* Tab Content Area */}
        <div className="flex-1 overflow-auto">
          <TabsContent value="Test cases" className="h-full">
            <TestCasesPanel />
          </TabsContent>
          <TabsContent value="Results" className="h-full">
            <ResultsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TestCasesTabs;

import React, { useEffect, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Maximize, Minimize } from "lucide-react";
import TestCasesTabs from "../tabs/TestCasesTabs";

type TestCasesProps = {
  onMaximize?: () => void;
  isMaximized?: boolean;
  showTestCasesResultsTab?: boolean;
};

const TestCases: React.FC<TestCasesProps> = ({
  onMaximize,
  isMaximized = false,
  showTestCasesResultsTab = false,
}) => {
  const [activeTab, setActiveTab] = useState<"Test cases" | "Results">(
    "Test cases"
  );

  const handleMaximizeMinimize = () => {
    if (onMaximize) {
      onMaximize();
    }
  };

  useEffect(() => {
    if (showTestCasesResultsTab) {
      setActiveTab("Results");
    }
  }, [showTestCasesResultsTab]);

  const handleTabChange = (tab: "Results" | "Test cases") => {
    setActiveTab(tab);
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Toolbar */}
      <div className="h-[43px] bg-secondary rounded-md flex flex-row justify-start px-1 items-center">
        <div className="flex flex-1 flex-row justify-start h-full w-full pt-0 mt-0 items-center">
          <TestCasesTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            showTestCasesResultsTab={showTestCasesResultsTab}
          />
        </div>
        <div className="flex justify-end items-center">
          <HoverCard>
            <HoverCardTrigger asChild>
              {isMaximized ? (
                <Minimize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              ) : (
                <Maximize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              )}
            </HoverCardTrigger>
            <HoverCardContent className="p-1">
              {isMaximized ? "Minimize" : "Maximize"}
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </div>
  );
};
export default TestCases;

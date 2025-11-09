import React, { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleCheckBig, ScrollText } from "lucide-react";
import TestCasesPanel from "../testCases/testCasesPanel/TestCasesPanel";
import ResultsPanel from "../testCases/resultsPanel/ResultsPanel";

type TestCasesTabsProps = {
  activeTab?: "Test cases" | "Results";
  onTabChange?: (tab: "Test cases" | "Results") => void;
  showTestCasesResultsTab?: boolean;
};

const TestCasesTabs: React.FC<TestCasesTabsProps> = ({
  activeTab = "Test cases",
  onTabChange,
  showTestCasesResultsTab = false,
}) => {

  const prevShowTestCasesResultsTab = useRef(showTestCasesResultsTab);

  const handleValueChange = (value: string) => {
    if (onTabChange && (value === "Test cases" || value === "Results")) {
      onTabChange(value);
    }
  };

  useEffect(() => {
    if (
      showTestCasesResultsTab &&
      !prevShowTestCasesResultsTab.current &&
      onTabChange
    ) {
      onTabChange("Results");
    }
    prevShowTestCasesResultsTab.current = showTestCasesResultsTab;
  }, [showTestCasesResultsTab, onTabChange]);

  return (
    <div className="h-full w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleValueChange}
        className="w-full"
      >
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
        </TabsList>
        <div className="h-full w-full">
          <TabsContent value="Test cases">
            <TestCasesPanel />
          </TabsContent>
          <TabsContent value="Results">
            <ResultsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
export default TestCasesTabs;

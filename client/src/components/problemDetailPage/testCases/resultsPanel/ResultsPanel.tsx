import React from "react";
import { useSubmissionStore } from "@/features/submissionStore";
import { Card, CardContent } from "@/components/ui/card";
import QuestionResultsLoader from "../../questionResults/QuestionResultsLoader";

type ResultsPanelProps = {};

const ResultsPanel: React.FC<ResultsPanelProps> = () => {
  const { runCodeResult, isRunningCode } = useSubmissionStore();

  return (
    <div className="h-full w-full flex justify-center items-center overflow-y-auto">
      <QuestionResultsLoader isLoading={isRunningCode} size={50} />
      {runCodeResult && !isRunningCode && (
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Submit Code Result:</h3>
            <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {JSON.stringify(runCodeResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default ResultsPanel;

"use client";

import React from "react";
import { useSubmissionStore } from "@/features/submissionStore";
import { Card, CardContent } from "@/components/ui/card";
import QuestionResultsLoader from "./QuestionResultsLoader";

type QuestionResultsProps = {};

const QuestionResults: React.FC<QuestionResultsProps> = () => {
  const { submitCodeResult, isSubmittingCode } = useSubmissionStore();

  return (
    <div className="h-full w-full overflow-y-auto">
      {/* Loading State for Submit Code */}
      <QuestionResultsLoader isLoading={isSubmittingCode} size={150} />

      {/* Show submit code results as JSON */}
      {submitCodeResult && !isSubmittingCode && (
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Submit Code Result:</h3>
            <pre className="bg-secondary p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {JSON.stringify(submitCodeResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default QuestionResults;

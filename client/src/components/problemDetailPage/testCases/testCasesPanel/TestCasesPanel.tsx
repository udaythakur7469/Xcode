import React, { useEffect } from "react";
import { useProblemStore } from "@/features/problemStore";
import { useSearchParams } from "next/navigation";
import { MoonLoader } from "react-spinners";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/testCasesTabs";

type TestCasesPanelProps = {};

const TestCasesPanel: React.FC<TestCasesPanelProps> = () => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title");

  const { getTestCasesByTitle, testCases, isLoadingTestCases, testCasesError } =
    useProblemStore();

  useEffect(() => {
    const fetchTestCases = async () => {
      if (problemTitle) {
        try {
          await getTestCasesByTitle(problemTitle);
        } catch (error) {
          console.error("Error fetching test cases:", error);
        }
      }
    };

    fetchTestCases();
  }, [getTestCasesByTitle, problemTitle]);

  if (isLoadingTestCases) {
    return (
      <div className="h-full w-full flex justify-center items-center mt-10">
        <MoonLoader size={100} color="#ffffff" />
      </div>
    );
  }

  if (testCasesError) {
    return (
      <div className="h-full w-full flex justify-center items-center text-red-500">
        {testCasesError}
      </div>
    );
  }

  const testCasesData = testCases?.testCases || [];
  const testCasesCount: number = testCases?.count;

  return (
    <div className="h-full w-full p-2">
      {testCasesCount > 0 ? (
        <Tabs defaultValue="testCase-1" className="w-auto">
          <TabsList className="mb-4">
            {Array.from({ length: testCasesCount }, (_, index) => (
              <TabsTrigger key={index + 1} value={`testCase-${index + 1}`}>
                Test Case {index + 1}
              </TabsTrigger>
            ))}
          </TabsList>

          {Array.from({ length: testCasesCount }, (_, index) => (
            <TabsContent key={index + 1} value={`testCase-${index + 1}`}>
              <div className="bg-secondary p-4 rounded-md">
                {testCasesData[index] && (
                  <>
                    <p className="mb-4">
                      <strong>Input:</strong> {testCasesData[index].userInput}
                    </p>
                    <p>
                      <strong>Expected Output:</strong>{" "}
                      {testCasesData[index].userExpectedOutput}
                    </p>
                  </>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center text-gray-500">No test cases available</div>
      )}
    </div>
  );
};

export default TestCasesPanel;

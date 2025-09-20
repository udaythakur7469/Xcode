import { NotebookText, Pen } from "lucide-react";
import React, { useState } from "react";
import PostDialogBox from "../dialogBox/PostDialogBox";

type ShareSolutionProps = {};

const ShareSolution: React.FC<ShareSolutionProps> = () => {
  const [solutionAvailable, setSolutionAvailable] = useState<boolean>(true);
  const [isPostDialogBoxOpen, setIsPostDialogBoxOpen] =
    useState<boolean>(false);

  const handleSubmitSolution = () => {
    setIsPostDialogBoxOpen(true);
    console.log("clicked");
  };

  const testCasesPassed = 5;
  const totalTestCases = 5;

  return (
    <>
      <div className="flex flex-row flex-1 items-center w-full">
        <div className="flex flex-row flex-1 items-center bg-muted rounded-xl px-1 w-full gap-2">
          <div className="flex flex-row items-center py-2">
            <div className="ml-1 mr-1">
              <NotebookText />
            </div>
            {solutionAvailable ? (
              <div
                className={
                  testCasesPassed === totalTestCases
                    ? "text-green-600 select-none cursor-default"
                    : "text-red-600 select-none cursor-default"
                }
              >
                Your last submission passed {testCasesPassed}/{totalTestCases}{" "}
                test cases
              </div>
            ) : (
              <div className="select-none cursor-default">
                Submit at least 1 solution to post a solution
              </div>
            )}
          </div>

          <div
            className={
              solutionAvailable
                ? "cursor-pointer bg-green-600 flex flex-row items-center rounded-xl px-2 text-[#FDFBD4] ml-auto gap-1 select-none h-full py-1"
                : "cursor-not-allowed select-none hover:opacity-50 bg-green-600 flex flex-row items-center rounded-xl px-2 text-[#FDFBD4] ml-auto gap-1 h-full py-1"
            }
            onClick={() => {
              if (!solutionAvailable) return; // prevent click
              handleSubmitSolution();
            }}
          >
            <div>submit your solution</div>
            <Pen className="p-0.5" />
          </div>
        </div>
      </div>
      <PostDialogBox
        isOpen={isPostDialogBoxOpen}
        onClose={() => setIsPostDialogBoxOpen(false)}
      />
    </>
  );
};

export default ShareSolution;

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProblemStore } from "@/features/problemStore";
import { MoonLoader } from "react-spinners";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactPlayer from "react-player";
import { Separator } from "@/components/ui/separator";
import CodeTabs from "../tabs/CodeTabs";
import { Circle } from "lucide-react";
import { QuestionEditorialSkeleton } from "./QuestionEditorialSkeleton";

interface EditorialData {
  id: number;
  problemId: number;
  problemTitle?: string; // Optional field for when you include problem title
  videoUrl: string;

  // Brute Force approach
  bruteForceTitle: string;
  bruteForceIntuition: string;
  bruteForceAlgorithm: string;
  bruteForceCodeCpp: string;
  bruteForceCodeJs: string;
  bruteForceCodePython: string;
  bruteForceCodeJava: string;
  bruteForceTimeComplexity: string;
  bruteForceSpaceComplexity: string;

  // Better approach
  betterTitle: string;
  betterIntuition: string;
  betterAlgorithm: string;
  betterCodeCpp: string;
  betterCodeJs: string;
  betterCodePython: string;
  betterCodeJava: string;
  betterTimeComplexity: string;
  betterSpaceComplexity: string;

  // Optimal approach
  optimalTitle: string;
  optimalIntuition: string;
  optimalAlgorithm: string;
  optimalCodeCpp: string;
  optimalCodeJs: string;
  optimalCodePython: string;
  optimalCodeJava: string;
  optimalTimeComplexity: string;
  optimalSpaceComplexity: string;
}

type QuestionEditorialProps = {};

const QuestionEditorial: React.FC<QuestionEditorialProps> = () => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title");
  const { getEditorialsByTitle } = useProblemStore();
  const [editorial, setEditorial] = useState<EditorialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!problemTitle) {
        setError("Title is required");
        setIsLoading(false);
        return;
      }

      try {
        const editorialDetails = await getEditorialsByTitle(problemTitle);
        setEditorial(editorialDetails);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblemDetails();
  }, [problemTitle, getEditorialsByTitle]);

  return (
    <ScrollArea className="h-[610px] w-full">
      {isLoading ? (
        <QuestionEditorialSkeleton />
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : !editorial ? (
        <div className="text-red-500 text-center">Editorial not found.</div>
      ) : (
        <div className="flex flex-col justify-center items-start p-5">
          <div className="flex flex-row justify-start items-center ml-1">
            <p className="text-3xl">{editorial.problemId}.&nbsp;</p>
            <p className="text-3xl">{editorial.problemTitle}</p>
          </div>
          <div className="mt-5 ml-2">
            <p className="text-2xl ">Video solution</p>
          </div>
          <Separator className="mt-3" />
          <div className="mt-5 px-2 w-full h-[400px]">
            <ReactPlayer
              url={editorial.videoUrl}
              controls={true}
              height="100%"
              width="100%"
            />
          </div>
          <div className="mt-5 ml-2 mr-2">
            <p className="text-2xl ">Solution article</p>
          </div>
          <Separator className="mt-3 mb-3 mr-2" />
          {/*Brute Force Code*/}
          <div className="ml-2 mr-2">
            <p className="text-xl font-bold">{editorial.bruteForceTitle}</p>
            <p className="text-xl mt-3 mb-3">Intuition</p>
            <p className="text-md mr-3 ml-4 mt-4">
              {editorial.bruteForceIntuition}
            </p>
            <p className="text-xl mt-3 mb-3">Algorithm</p>
            <p className="text-md mr-3 ml-4 mt-4">
              {editorial.bruteForceAlgorithm}
            </p>
            <div className="h-full w-full">
              <p className="text-xl mt-3 mb-3">Implementation</p>
              <CodeTabs
                cppCode={editorial.bruteForceCodeCpp}
                jsCode={editorial.bruteForceCodeJs}
                pythonCode={editorial.bruteForceCodePython}
                javaCode={editorial.bruteForceCodeJava}
              />
            </div>
            <p className="text-xl mt-3 mb-3">Complexity Analysis</p>
            <div className="text-md mr-3 ml-3 mt-4">
              {editorial.bruteForceTimeComplexity && (
                <>
                  {/* Display the first line (e.g., "O(n²).") */}
                  <div className="font-semibold flex flex-row items-center">
                    <p className="flex flex-row items-center justify-center">
                      <Circle size={9} className="fill-white mr-2" />
                      Time complexity:&nbsp;
                    </p>
                    {editorial.bruteForceTimeComplexity.split(".")[0]}.
                  </div>
                  {/* Display the rest of the explanation */}
                  <p className="text-md mr-3 ml-4 mt-4">
                    {editorial.bruteForceTimeComplexity
                      .split(".")
                      .slice(1)
                      .join(".")
                      .trim()}
                  </p>
                </>
              )}
            </div>
            <div className="text-md mr-3 ml-3 mt-4">
              {editorial.bruteForceSpaceComplexity && (
                <>
                  {/* Display the first line (e.g., "O(n²).") */}
                  <p className="font-semibold flex flex-row items-center">
                    <span className="flex flex-row items-center justify-center">
                      <Circle size={9} className="fill-white mr-2" />
                      Space complexity:&nbsp;
                    </span>
                    {editorial.bruteForceSpaceComplexity.split(".")[0]}.
                  </p>
                  {/* Display the rest of the explanation */}
                  <p className="text-md mr-3 ml-4 mt-4">
                    {editorial.bruteForceSpaceComplexity
                      .split(".")
                      .slice(1)
                      .join(".")
                      .trim()}
                  </p>
                </>
              )}
            </div>
          </div>
          <Separator className="mt-3 mb-3 mr-2" />
          {/*Better Code*/}
          <div className="ml-2 mr-2">
            <p className="text-xl font-bold">{editorial.betterTitle}</p>
            <p className="text-xl mt-3 mb-3">Intuition</p>
            <p className="text-md mr-3 ml-4 mt-4">
              {editorial.betterIntuition}
            </p>
            <p className="text-xl mt-3 mb-3">Algorithm</p>
            <p className="text-md mr-3 ml-4 mt-4">
              {editorial.betterAlgorithm}
            </p>
            <div className="h-full w-full">
              <p className="text-xl mt-3 mb-3">Implementation</p>
              <CodeTabs
                cppCode={editorial.betterCodeCpp}
                jsCode={editorial.betterCodeJs}
                pythonCode={editorial.betterCodePython}
                javaCode={editorial.betterCodeJava}
              />
            </div>
            <p className="text-xl mt-3 mb-3">Complexity Analysis</p>
            <div className="text-md mr-3 ml-3 mt-4">
              {editorial.betterTimeComplexity && (
                <>
                  {/* Display the first line (e.g., "O(n²).") */}
                  <p className="font-semibold flex flex-row items-center">
                    <p className="flex flex-row items-center justify-center">
                      <Circle size={9} className="fill-white mr-2" />
                      Time complexity:&nbsp;
                    </p>
                    {editorial.betterTimeComplexity.split(".")[0]}.
                  </p>
                  {/* Display the rest of the explanation */}
                  <p className="text-md mr-3 ml-4 mt-4">
                    {editorial.betterTimeComplexity
                      .split(".")
                      .slice(1)
                      .join(".")
                      .trim()}
                  </p>
                </>
              )}
            </div>
            <div className="text-md mr-3 ml-3 mt-4">
              {editorial.betterSpaceComplexity && (
                <>
                  {/* Display the first line (e.g., "O(n²).") */}
                  <p className="font-semibold flex flex-row items-center">
                    <p className="flex flex-row items-center justify-center">
                      <Circle size={9} className="fill-white mr-2" />
                      Space complexity:&nbsp;
                    </p>
                    {editorial.betterSpaceComplexity.split(".")[0]}.
                  </p>
                  {/* Display the rest of the explanation */}
                  <p className="text-md mr-3 ml-4 mt-4">
                    {editorial.betterSpaceComplexity
                      .split(".")
                      .slice(1)
                      .join(".")
                      .trim()}
                  </p>
                </>
              )}
            </div>
          </div>
          <Separator className="mt-3 mb-3 mr-2" />
          {/*Optimal Code*/}
          <div className=" ml-2 mr-2">
            <p className="text-xl font-bold">{editorial.optimalTitle}</p>
            <p className="text-xl mt-3 mb-3">Intuition</p>
            <p className="text-md mr-3 ml-4 mt-4">
              {editorial.betterIntuition}
            </p>
            <p className="text-xl mt-3 mb-3">Algorithm</p>
            <p className="text-md mr-3 ml-4 mt-4">
              {editorial.betterAlgorithm}
            </p>
            <div className="h-full w-full">
              <p className="text-xl mt-3 mb-3">Implementation</p>
              <CodeTabs
                cppCode={editorial.betterCodeCpp}
                jsCode={editorial.betterCodeJs}
                pythonCode={editorial.betterCodePython}
                javaCode={editorial.betterCodeJava}
              />
            </div>
            <p className="text-xl mt-3 mb-3">Complexity Analysis</p>
            <div className="text-md mr-3 ml-3 mt-4">
              {editorial.optimalTimeComplexity && (
                <>
                  {/* Display the first line (e.g., "O(n²).") */}
                  <p className="font-semibold flex flex-row items-center">
                    <p className="flex flex-row items-center justify-center">
                      <Circle size={9} className="fill-white mr-2" />
                      Time complexity:&nbsp;
                    </p>
                    {editorial.optimalTimeComplexity.split(".")[0]}.
                  </p>
                  {/* Display the rest of the explanation */}
                  <p className="text-md mr-3 ml-4 mt-4">
                    {editorial.optimalTimeComplexity
                      .split(".")
                      .slice(1)
                      .join(".")
                      .trim()}
                  </p>
                </>
              )}
            </div>
            <div className="text-md mr-3 ml-3 mt-4">
              {editorial.optimalSpaceComplexity && (
                <>
                  {/* Display the first line (e.g., "O(n²).") */}
                  <p className="font-semibold flex flex-row items-center">
                    <p className="flex flex-row items-center justify-center">
                      <Circle size={9} className="fill-white mr-2" />
                      Space complexity:&nbsp;
                    </p>
                    {editorial.optimalSpaceComplexity.split(".")[0]}.
                  </p>
                  {/* Display the rest of the explanation */}
                  <p className="text-md mr-3 ml-4 mt-4">
                    {editorial.optimalSpaceComplexity
                      .split(".")
                      .slice(1)
                      .join(".")
                      .trim()}
                  </p>
                </>
              )}
            </div>
            <Separator className="mt-3 mr-2" />
          </div>
        </div>
      )}
      <div className="h-[10px]" />
    </ScrollArea>
  );
};

export default QuestionEditorial;

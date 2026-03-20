"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProblemStore } from "@/features/problemStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoonLoader } from "react-spinners";
import { CircleCheckBig, Lightbulb, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import HintsDialog from "../dialogBoxes/HintsDialog";
import StatsDialog from "../dialogBoxes/StatsDialog";
import { formatCount } from "@/services/countService";

type QuestionDataProps = {};

type ProblemDetails = {
  id?: number;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  solved: boolean;
  examples: {
    id: number;
    input: string;
    output: string;
    explanation: string;
  }[];
  hints: string[];
  testCases: { input: string; expectedOutput: string }[];
  problemStats: {
    totalAttempts: number;
    totalSolved: number;
    acceptanceRate: number;
  };
  userReaction?: "like" | "dislike" | null;
  likes?: number;
  dislikes?: number;
};

const QuestionData: React.FC<QuestionDataProps> = () => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title");

  const {
    getProblemByTitle,
    reactToProblem,
    isReacting,
    problem: storeProblem,
  } = useProblemStore();

  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch problem details on mount
  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!problemTitle) {
        setError("Title is required");
        setIsLoading(false);
        return;
      }

      try {
        const problemDetails = await getProblemByTitle(problemTitle);
        setProblem(problemDetails);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblemDetails();
    // Removed the 1-minute polling interval — optimistic updates + reconciliation
    // on every reaction makes periodic polling redundant.
  }, [problemTitle, getProblemByTitle]);

  // Alt+H keyboard shortcut to open hints dialog
  useEffect(() => {
    const keyboardShortcut = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      const isH = e.key === "h" || e.key === "H";
      if (isAlt && isH && !isLoading && problem) {
        e.preventDefault();
        const hintButton = document.querySelector("[data-hint-trigger]");
        if (hintButton instanceof HTMLElement) {
          hintButton.click();
        }
      }
    };
    window.addEventListener("keydown", keyboardShortcut);
    return () => window.removeEventListener("keydown", keyboardShortcut);
  }, [isLoading, problem]);

  // Handle like/dislike — store handles optimistic update + rollback
  const handleReaction = async (action: "like" | "dislike") => {
    if (!problemTitle || !storeProblem || isReacting) return;
    try {
      await reactToProblem(problemTitle, action);
    } catch (error) {
      // Error handled in store (state rolled back)
      console.error("Reaction failed:", error);
    }
  };

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <ScrollArea className="h-[610px] w-full">
      {isLoading ? (
        <div className="h-[610px] w-full flex justify-center items-center">
          <MoonLoader size={200} color="#ffffff" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : !problem ? (
        <div className="text-red-500 text-center">Problem not found.</div>
      ) : (
        <div>
          <div className="h-full w-full flex flex-row justify-between items-center bg-background p-2">
            <div className="flex items-center ml-1">
              <p className="text-5xl">{problem.id}. </p>
              <p className="text-5xl">{problem.title}</p>
            </div>
            <div className="px-2">
              <div className="text-md">
                {problem.solved && (
                  <div className="flex flex-row items-center">
                    <p>Solved</p>
                    <CircleCheckBig className="text-green-500 ml-1 h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Difficulty Badge & Tags */}
          <div className="flex flex-row items-center p-2 px-4">
            <Badge
              variant="secondary"
              className="px-3 py-1 flex items-center cursor-default"
            >
              <p
                className={`cursor-default ${
                  problem.difficulty === "easy"
                    ? "text-green-500"
                    : problem.difficulty === "medium"
                      ? "text-yellow-400"
                      : "text-red-500"
                }`}
              >
                {problem.difficulty}
              </p>
            </Badge>

            {problem.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="ml-2 px-3 py-1 flex items-center cursor-default"
              >
                {tag}
              </Badge>
            ))}

            <Dialog>
              <DialogTrigger asChild>
                <Badge
                  variant="secondary"
                  className="ml-2 px-3 py-1 flex items-center cursor-pointer"
                  data-hint-trigger
                >
                  <Lightbulb className="h-4 w-4 mr-1 text-yellow-400" />
                  Hint
                </Badge>
              </DialogTrigger>
              <HintsDialog
                data={problem.hints.map((hintObj) => hintObj.hint)}
              />
            </Dialog>

            {/* Like badge button — reads from storeProblem for live optimistic values */}
            <Badge
              variant="secondary"
              onClick={() => handleReaction("like")}
              className={`px-3 py-1 flex items-center ml-2 transition-all duration-150 ${
                isReacting
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer hover:opacity-80"
              }`}
            >
              <ThumbsUp
                className={`h-4 w-4 mr-1 transition-all duration-150 ${
                  storeProblem?.userReaction === "like"
                    ? "text-green-600 fill-green-600 scale-110"
                    : ""
                }`}
              />
              {formatCount(storeProblem?.likes ?? 0)}
            </Badge>

            {/* Dislike badge button — reads from storeProblem for live optimistic values */}
            <Badge
              variant="secondary"
              onClick={() => handleReaction("dislike")}
              className={`px-3 py-1 flex items-center ml-2 transition-all duration-150 ${
                isReacting
                  ? "opacity-70 cursor-not-allowed"
                  : "cursor-pointer hover:opacity-80"
              }`}
            >
              <ThumbsDown
                className={`h-4 w-4 mr-1 transition-all duration-150 ${
                  storeProblem?.userReaction === "dislike"
                    ? "text-red-600 fill-red-600 scale-110"
                    : ""
                }`}
              />
              {formatCount(storeProblem?.dislikes ?? 0)}
            </Badge>

            <StatsDialog stats={problem.problemStats} />
          </div>

          {/* Description */}
          <div className="ml-4 mr-4 mt-4">
            {problem.description
              .split(".")
              .filter((sentence) => sentence.trim() !== "")
              .map((sentence, index) => (
                <p key={index} className="mb-2">
                  {sentence.trim()}.
                </p>
              ))}
          </div>

          {/* Examples */}
          <div className="ml-4 mr-4 mt-8">
            <h3 className="text-xl font-semibold mb-4">Examples:</h3>
            {problem.examples.map((example, index) => (
              <div
                key={example.id}
                className="mb-4 bg-secondary rounded-md py-2"
              >
                <p className="font-bold text-md ml-4">Example {index + 1}:</p>
                <div className="p-4 rounded-lg mt-2">
                  <p className="text-md">
                    <span className="font-bold">Input:</span> {example.input}
                  </p>
                  <p className="text-md mt-2">
                    <span className="font-bold">Output:</span> {example.output}
                  </p>
                  {example.explanation && (
                    <p className="text-md mt-2">
                      <span className="font-bold">Explanation:</span>{" "}
                      {example.explanation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="h-[10px]" />
        </div>
      )}
    </ScrollArea>
  );
};

export default QuestionData;

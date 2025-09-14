import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // Import useSearchParams
import { useProblemStore } from "@/features/problemStore"; // Import the store
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoonLoader } from "react-spinners";
import { CircleCheckBig, Lightbulb, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import HintsDialog from "../dialogBoxes/HintsDialog";
import StatsDialog from "../dialogBoxes/StatsDialog";

type QuestionDataProps = {};

type ProblemDetails = {
  id?: number; // Added id field
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
  hints: string[]; // Updated to array of strings
  testCases: { input: string; expectedOutput: string }[];
  problemStats: {
    totalAttempts: number;
    totalSolved: number;
    acceptanceRate: number;
  };
  userReaction?: "like" | "dislike" | null; // Added userReaction field
  likes?: number; // Added likes field
  dislikes?: number; // Added dislikes field
};

const QuestionData: React.FC<QuestionDataProps> = () => {
  const searchParams = useSearchParams(); // Get search params
  const problemTitle = searchParams.get("title"); // Get the title query parameter
  const {
    getProblemByTitle,
    reactToProblem,
    refreshProblemLikesAndDislikes,
    isReacting,
    problem: storeProblem,
  } = useProblemStore(); // Get the getProblemByTitle function from the store
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactionType, setReactionType] = useState<"like" | "dislike" | null>(
    null
  );
  const [clickedAction, setClickedAction] = useState<"like" | "dislike" | null>(
    null
  );

  // Fetch problem details from the backend
  useEffect(() => {
    const fetchProblemDetails = async () => {
      if (!problemTitle) {
        setError("Title is required");
        setIsLoading(false);
        return;
      }

      try {
        const problemDetails = await getProblemByTitle(problemTitle); // Fetch problem details
        setProblem(problemDetails);
        // Set initial reaction state based on the user's previous reaction
        setReactionType(problemDetails.userReaction || null);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProblemDetails();

    // Setup a refresh interval for likes/dislikes
    const intervalId = setInterval(() => {
      if (problemTitle) {
        refreshProblemLikesAndDislikes(problemTitle).catch(console.error);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [problemTitle, getProblemByTitle, refreshProblemLikesAndDislikes]);

  // Handle user reactions (like/dislike)
  const handleReaction = async (action: "like" | "dislike") => {
    if (!problemTitle || !storeProblem || isReacting) return;

    try {
      // Set which button is being clicked
      setClickedAction(action);

      await reactToProblem(problemTitle, action);
    } catch (error) {
      console.error("Error handling reaction:", error);
    } finally {
      // Reset the clicked state when done
      setClickedAction(null);
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
              <p className="text-4xl">{problem.id}. </p>
              <p className="text-4xl">{problem.title}</p>
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
              className="px-2 py-0.5 flex items-center cursor-default"
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
                className="ml-2 px-2 py-0.5 flex items-center cursor-default"
              >
                {tag}
              </Badge>
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <Badge
                  variant="secondary"
                  className="ml-2 px-2 py-0.5 flex items-center cursor-pointer"
                >
                  <Lightbulb className="h-4 w-4 mr-1 text-yellow-400" />
                  Hint
                </Badge>
              </DialogTrigger>
              <HintsDialog
                data={problem.hints.map((hintObj) => hintObj.hint)}
              />
            </Dialog>
            {/* Like badge button */}
            <Badge
              variant="secondary"
              onClick={() => handleReaction("like")}
              className={`px-2 py-0.5 flex items-center ml-2 ${
                storeProblem.userReaction === "like" ? "bg-secondary" : ""
              } ${
                isReacting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
              style={{ pointerEvents: isReacting ? "none" : "auto" }} // This ensures the click is fully disabled
            >
              {isReacting && clickedAction === "like" ? (
                <MoonLoader size={14} className="mr-1" color="#ffffff" />
              ) : (
                <ThumbsUp
                  className={`h-4 w-4 mr-1 ${
                    storeProblem.userReaction === "like"
                      ? "text-green-600 fill-green-600"
                      : ""
                  }`}
                />
              )}
              {storeProblem.likes || 0}
            </Badge>

            {/* Dislike badge button */}
            <Badge
              variant="secondary"
              onClick={() => handleReaction("dislike")}
              className={`px-2 py-0.5 flex items-center ml-2 ${
                storeProblem.userReaction === "dislike" ? "bg-secondary" : ""
              } ${
                isReacting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
              style={{ pointerEvents: isReacting ? "none" : "auto" }} // This ensures the click is fully disabled
            >
              {isReacting && clickedAction === "dislike" ? (
                <MoonLoader size={14} className="mr-1" color="#ffffff" />
              ) : (
                <ThumbsDown
                  className={`h-4 w-4 mr-1 ${
                    storeProblem.userReaction === "dislike"
                      ? "text-red-600 fill-red-600"
                      : ""
                  }`}
                />
              )}
              {storeProblem.dislikes || 0}
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

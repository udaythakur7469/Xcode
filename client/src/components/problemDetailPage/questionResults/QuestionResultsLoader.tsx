"use client";

import React, { useState, useEffect } from "react";
import { MoonLoader } from "react-spinners";

type QuestionResultsLoaderProps = { isLoading: boolean; size: number };

const QuestionResultsLoader: React.FC<QuestionResultsLoaderProps> = ({
  isLoading,
  size,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dots, setDots] = useState("");
  const [shuffledMessages, setShuffledMessages] = useState<string[]>([]);

  const messages = [
    "Analyzing your solution",
    "Compiling code",
    "Running against test cases",
    "Checking edge cases",
    "Validating time complexity",
    "Testing with large inputs",
    "Verifying memory usage",
    "Running final checks",
    "Initializing test environment",
    "Loading test data",
    "Executing sample cases",
    "Testing boundary conditions",
    "Checking runtime performance",
    "Validating output format",
    "Running stress tests",
    "Analyzing space complexity",
    "Checking for memory leaks",
    "Testing concurrent execution",
    "Verifying algorithm correctness",
    "Finalizing submission",
  ];

  // Shuffle array function
  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (!isLoading) {
      setCurrentMessageIndex(0);
      setDots("");
      setShuffledMessages([]);
      return;
    }

    // Shuffle messages when loading starts
    const shuffled = shuffleArray(messages);
    setShuffledMessages(shuffled);
    setCurrentMessageIndex(0);

    // Handle dots animation
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    // Handle message cycling
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % shuffled.length);
      setDots("");
    }, 2000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(messageInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
      {/* Spinner */}
      <div className="relative">
        <MoonLoader size={size} color="#22C55E" />
      </div>

      {/* Text with dots */}
      <div className="text-white text-2xl font-medium min-h-[28px] flex items-center">
        <span>
          {shuffledMessages[currentMessageIndex]}
          {dots}
        </span>
      </div>
    </div>
  );
};
export default QuestionResultsLoader;

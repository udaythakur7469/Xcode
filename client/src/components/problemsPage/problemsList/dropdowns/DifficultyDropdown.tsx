import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import { Button } from "@/components/ui/button";
import { CircleCheckBig } from "lucide-react";
import { useProblemStore } from "@/features/problemStore";

type DifficultyDropdownProps = {};

const DifficultyDropdown: React.FC<DifficultyDropdownProps> = () => {
  const [showIconForEasy, setShowIconForEasy] = useState(false);
  const [showIconForMedium, setShowIconForMedium] = useState(false);
  const [showIconForHard, setShowIconForHard] = useState(false);
  const { setDifficultyFilter, difficultyFilter } = useProblemStore();

  const buttonText = difficultyFilter
    ? `Difficulty: ${
        difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1)
      }`
    : "Difficulty";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full text-xl" variant="secondary">
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <DropdownMenuItem
          className="text-green-600 focus:text-green-600 flex flex-row justify-between"
          onMouseEnter={() => setShowIconForEasy(true)}
          onMouseLeave={() => setShowIconForEasy(false)}
          onClick={() => setDifficultyFilter("easy")}
        >
          Easy
          {showIconForEasy && <CircleCheckBig />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-yellow-500 focus:text-yellow-500 flex flex-row justify-between"
          onMouseEnter={() => setShowIconForMedium(true)}
          onMouseLeave={() => setShowIconForMedium(false)}
          onClick={() => setDifficultyFilter("medium")}
        >
          Medium
          {showIconForMedium && <CircleCheckBig />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-500 focus:text-red-500 flex flex-row justify-between"
          onMouseEnter={() => setShowIconForHard(true)}
          onMouseLeave={() => setShowIconForHard(false)}
          onClick={() => setDifficultyFilter("hard")}
        >
          Hard
          {showIconForHard && <CircleCheckBig />}
        </DropdownMenuItem>

        {difficultyFilter ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-gray-500 focus:text-gray-500 flex flex-row justify-between"
              onClick={() => setDifficultyFilter(null)} // Clear filter
            >
              Clear Filter
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DifficultyDropdown;

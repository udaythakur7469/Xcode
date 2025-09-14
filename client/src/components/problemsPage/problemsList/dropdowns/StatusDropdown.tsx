import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu";
import { Button } from "@/components/ui/button";
import { SquareCheckBig, X } from "lucide-react";
import { useProblemStore } from "@/features/problemStore";

type StatusDropdownProps = {};

const StatusDropdown: React.FC<StatusDropdownProps> = () => {
  const [showIconForSolved, setshowIconForSolved] = useState(false);
  const [showIconForUnSolved, setshowIconForUnSolved] = useState(false);
  const { statusFilter, setStatusFilter } = useProblemStore();

  const buttonText = statusFilter
    ? `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`
    : "Problem Status";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full text-xl" variant="secondary">
            {buttonText}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="text-green-600 focus:text-green-600 flex flex-row justify-between"
            onMouseEnter={() => setshowIconForSolved(true)}
            onMouseLeave={() => setshowIconForSolved(false)}
            onClick={() => setStatusFilter("solved")}
          >
            Solved
            {showIconForSolved ? <SquareCheckBig /> : null}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500 flex flex-row justify-between"
            onMouseEnter={() => setshowIconForUnSolved(true)}
            onMouseLeave={() => setshowIconForUnSolved(false)}
            onClick={() => setStatusFilter("unsolved")}
          >
            Unsolved
            {showIconForUnSolved ? <X /> : null}
          </DropdownMenuItem>
          {statusFilter ? (
            <>
              <DropdownMenuItem
                className="text-gray-500 focus:text-gray-500 flex flex-row justify-between"
                onClick={() => setStatusFilter(null)} // Clear filter
              >
                Clear Filter
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
export default StatusDropdown;

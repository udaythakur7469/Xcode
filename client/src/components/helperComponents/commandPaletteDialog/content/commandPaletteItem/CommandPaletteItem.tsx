"use client";

import React, { forwardRef } from "react";
import { ChevronsRight, ArrowUp, Home, ArrowDown } from "lucide-react";

type CommandPaletteItemProps = {
  title: string;
  showLink: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isActionItem?: boolean;
  isSelected?: boolean;
  onMouseEnter?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
};

const CommandPaletteItem = forwardRef<HTMLDivElement, CommandPaletteItemProps>(
  (
    {
      title,
      showLink,
      icon,
      onClick,
      isActionItem,
      isSelected = false,
      onMouseEnter,
      isFirst = false,
      isLast = false,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`w-full h-auto p-2 my-2 flex flex-row border rounded-md cursor-pointer items-center transition-all duration-150 ${
          isSelected
            ? "bg-blue-600/20 border-blue-600 scale-[1.02]"
            : "bg-transparent border-gray-700 hover:bg-gray-800/50 hover:border-gray-600"
        }`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
      >
        <div className="flex mr-3 ml-1">{icon}</div>
        <div className="flex flex-col flex-1">
          <div className="font-medium">{title}</div>
          <div className="flex flex-row items-center text-sm text-gray-400">
            <ChevronsRight />
            {!isActionItem && "....."}
            {showLink}
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="flex items-center gap-1 text-sm text-gray-400 ml-2">
          {isFirst && (
            <>
              <div className="mr-2 border px-1 py-0.5 rounded-md">Home</div>
              <ArrowUp className="border rounded-md" />
            </>
          )}
          {isLast && (
            <>
              <div className="mr-2 border px-1 py-0.5 rounded-md">End</div>
              <ArrowDown className="border rounded-md" />
            </>
          )}
        </div>
      </div>
    );
  }
);

CommandPaletteItem.displayName = "CommandPaletteItem";

export default CommandPaletteItem;

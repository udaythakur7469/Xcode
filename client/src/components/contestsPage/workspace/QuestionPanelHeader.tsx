"use client";

import React from "react";
import { Maximize, Minimize } from "lucide-react";

type QuestionPanelHeaderProps = {
  isMaximized: boolean;
  onToggleMaximize: () => void;
};

export default function QuestionPanelHeader({ isMaximized, onToggleMaximize }: QuestionPanelHeaderProps) {
  return (
    <div className="h-10 flex items-center justify-end px-2 flex-shrink-0 bg-secondary">
      <div
        className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-accent"
        onClick={onToggleMaximize}
        title={isMaximized ? "Minimize" : "Maximize"}
      >
        {isMaximized ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </div>
    </div>
  );
}

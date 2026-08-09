"use client";

import React from "react";
import { Maximize, Minimize } from "lucide-react";

type TestcasePanelHeaderProps = {
  bottomTab: "testcase" | "result";
  onTabChange: (tab: "testcase" | "result") => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
};

export default function TestcasePanelHeader({ bottomTab, onTabChange, isMaximized, onToggleMaximize }: TestcasePanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 border-b flex-shrink-0">
      <div className="flex">
        <button
          className={`px-3 py-2 text-sm font-medium border-b-2 ${bottomTab === "testcase" ? "border-emerald-500 text-foreground" : "border-transparent text-muted-foreground"}`}
          onClick={() => onTabChange("testcase")}
        >
          Test Cases
        </button>
        <button
          className={`px-3 py-2 text-sm font-medium border-b-2 ${bottomTab === "result" ? "border-emerald-500 text-foreground" : "border-transparent text-muted-foreground"}`}
          onClick={() => onTabChange("result")}
        >
          Results
        </button>
      </div>
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

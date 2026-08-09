"use client";

import React from "react";
import { Maximize, Minimize, Play, CloudUpload } from "lucide-react";
import LangDropdown from "@/components/problemDetailPage/codePanel/dropdowns/LangDropdown";
import ThemeDropdown from "@/components/problemDetailPage/codePanel/dropdowns/ThemeDropdown";
import FontSizeDropdown from "@/components/problemDetailPage/codePanel/dropdowns/FontSizeDropdown";
import EditorResetDialog from "./EditorResetDialog";

type EditorToolbarProps = {
  language: string;
  onLanguageChange: (language: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  onFontSizeChange: (size: number) => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunningCode: boolean;
  isSubmittingCode: boolean;
  contestJustEnded: boolean;
  saveIndicator: "saved" | "saving";
  isResetConfirmOpen: boolean;
  onOpenResetConfirm: () => void;
  onResetConfirmOpenChange: (open: boolean) => void;
  onConfirmReset: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
};

export default function EditorToolbar({
  language, onLanguageChange, theme, onThemeChange, onFontSizeChange,
  onRun, onSubmit, isRunningCode, isSubmittingCode, contestJustEnded,
  saveIndicator, isResetConfirmOpen, onOpenResetConfirm, onResetConfirmOpenChange,
  onConfirmReset, isMaximized, onToggleMaximize,
}: EditorToolbarProps) {
  return (
    <div className="h-10 flex items-center justify-between px-2 flex-shrink-0 bg-secondary">
      <div className="flex items-center gap-1.5">
        <LangDropdown selectedLanguage={language} onLanguageChange={onLanguageChange} />
        <ThemeDropdown selectedTheme={theme} onThemeChange={onThemeChange} />
        <FontSizeDropdown onFontSizeChange={onFontSizeChange} />
      </div>
      <div className="flex items-center gap-2">
        <button
          className="flex items-center justify-center h-7 px-3 rounded-md bg-secondary text-sm gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
          onClick={onRun}
          disabled={isRunningCode || contestJustEnded}
          title="Run code (Ctrl+')"
        >
          <Play className="h-3.5 w-3.5" />
          {isRunningCode ? "Running..." : "Run"}
        </button>
        <button
          className="flex items-center justify-center h-7 px-3 rounded-md bg-secondary text-sm gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
          onClick={onSubmit}
          disabled={isSubmittingCode || contestJustEnded}
          title="Submit code (Ctrl+Enter)"
        >
          <CloudUpload className="h-3.5 w-3.5 text-green-400" />
          <span className="text-green-400">{isSubmittingCode ? "Submitting..." : "Submit"}</span>
        </button>
        <span className="text-xs text-muted-foreground w-12 text-right select-none">
          {saveIndicator === "saving" ? "Saving…" : "Saved"}
        </span>
        <EditorResetDialog
          open={isResetConfirmOpen}
          onOpen={onOpenResetConfirm}
          onOpenChange={onResetConfirmOpenChange}
          onConfirm={onConfirmReset}
        />
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-accent"
          onClick={onToggleMaximize}
          title={isMaximized ? "Minimize" : "Maximize"}
        >
          {isMaximized ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}

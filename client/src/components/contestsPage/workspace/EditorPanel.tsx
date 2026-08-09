"use client";

import React from "react";
import EditorToolbar from "./EditorToolbar";
import CodeEditorSurface from "./CodeEditorSurface";

type EditorPanelProps = {
  code: string;
  onCodeChange: (value: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  onFontSizeChange: (size: number) => void;
  fontSize: number;
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

export default function EditorPanel(props: EditorPanelProps) {
  return (
    <>
      <EditorToolbar
        language={props.language}
        onLanguageChange={props.onLanguageChange}
        theme={props.theme}
        onThemeChange={props.onThemeChange}
        onFontSizeChange={props.onFontSizeChange}
        onRun={props.onRun}
        onSubmit={props.onSubmit}
        isRunningCode={props.isRunningCode}
        isSubmittingCode={props.isSubmittingCode}
        contestJustEnded={props.contestJustEnded}
        saveIndicator={props.saveIndicator}
        isResetConfirmOpen={props.isResetConfirmOpen}
        onOpenResetConfirm={props.onOpenResetConfirm}
        onResetConfirmOpenChange={props.onResetConfirmOpenChange}
        onConfirmReset={props.onConfirmReset}
        isMaximized={props.isMaximized}
        onToggleMaximize={props.onToggleMaximize}
      />
      <CodeEditorSurface
        code={props.code}
        onCodeChange={props.onCodeChange}
        language={props.language}
        theme={props.theme}
        fontSize={props.fontSize}
      />
    </>
  );
}

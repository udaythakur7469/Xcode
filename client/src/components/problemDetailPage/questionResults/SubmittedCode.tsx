import React from "react";
import { CollapsibleCode } from "../helperComponents/CollapsibleCode";
import { useAiAnalysisPanel } from "@/context/aiAnalysisPanelContext";

export function SubmittedCode({
  code,
  hlLang,
  langLabel,
}: {
  code: string;
  hlLang: string;
  langLabel: string;
}) {
  const { isOpen: isAiPanelOpen, setIsOpen: setIsAiPanelOpen } =
    useAiAnalysisPanel();

  const handleAnalyzeWithAI = () => {
    setIsAiPanelOpen(!isAiPanelOpen);
  };

  return (
    <CollapsibleCode
      code={code}
      hlLang={hlLang}
      langLabel={langLabel}
      showAIButton
      onAnalyzeWithAI={handleAnalyzeWithAI}
    />
  );
}

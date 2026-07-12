import React from "react";
import { CollapsibleCode } from "../helperComponents/CollapsibleCode";

export function SubmittedCode({
  code,
  hlLang,
  langLabel,
}: {
  code: string;
  hlLang: string;
  langLabel: string;
}) {
  const handleAnalyzeWithAI = () => {
    // AI panel is explicitly out of scope for this redesign — button only,
    // per spec. Wired as a no-op placeholder so a future AI feature can
    // hook in here without touching this component's layout again.
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

import React from "react";
import { CollapsibleCode } from "../../helperComponents/codeSubmission/CollapsibleCode";

export function RunSubmittedCode({
  code,
  hlLang,
  langLabel,
}: {
  code: string;
  hlLang: string;
  langLabel: string;
}) {
  // Run Code is a debugging tool, not the flagship experience — no AI
  // button here per spec (Submit Code only).
  return (
    <CollapsibleCode code={code} hlLang={hlLang} langLabel={langLabel} />
  );
}

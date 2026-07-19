import type { RunCodeError } from "@/features/submissionStore";
import { getStatusCfg } from "@/lib/share/getStatusConfig";
import {
  PlainCodeBlock,
  SectionLabel,
} from "../../helperComponents/codeSubmission/ResultAtoms";

export function RunErrorPanel({ error }: { error: RunCodeError }) {
  const isWrongAnswer = error.status === "wrong_answer";
  const errorContent = error.compile_output ?? error.stderr ?? null;
  const errorLabel = error.compile_output
    ? "Compiler Output"
    : "Error (stderr)";
  const showError = !isWrongAnswer && errorContent != null;

  if (!showError) return null;

  const cfg = getStatusCfg(
    error.status,
    error.statusDescription,
    error.language,
    error.stderr ?? null,
  );

  return (
    <div>
      <SectionLabel>{errorLabel}</SectionLabel>
      <PlainCodeBlock variant="error" accentColor={cfg.accentColor}>
        {errorContent}
      </PlainCodeBlock>
      ...
      {error.status === "compilation_error" && !error.testCase && (
        <p className="text-xs text-muted-foreground mt-2">
          Code did not reach execution — fix the errors above and run again.
        </p>
      )}
    </div>
  );
}

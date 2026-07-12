import React from "react";
import type { FailedTestCase } from "@/features/submissionStore";
import type { StatusCfg } from "@/lib/share/getStatusConfig";
import { STATUS_ICON_MAP } from "../helperComponents/statusIcons";
import { PlainCodeBlock, SectionLabel } from "../helperComponents/ResultAtoms";

export function ErrorPanel({
  ft,
  cfg,
}: {
  ft: FailedTestCase;
  cfg: StatusCfg;
}) {
  const Icon = STATUS_ICON_MAP[cfg.icon];
  const isWrongAnswer = ft.status === "wrong_answer";
  const showIO = ft.input || ft.expectedOutput;
  const showActualOutput = ft.actualOutput != null;
  const errorContent = ft.compile_output ?? ft.stderr ?? null;
  const errorLabel = ft.compile_output ? "Compiler Output" : "Error (stderr)";
  const showError = !isWrongAnswer && errorContent != null;

  return (
    <div className="flex flex-col gap-4">
      {showIO && (
        <div className="flex flex-col gap-2.5">
          <SectionLabel>Failed Test Case Detail</SectionLabel>
          {ft.input && (
            <div>
              <SectionLabel>Input</SectionLabel>
              <PlainCodeBlock>{ft.input}</PlainCodeBlock>
            </div>
          )}
          {ft.expectedOutput && (
            <div>
              <SectionLabel>Expected Output</SectionLabel>
              <PlainCodeBlock>{ft.expectedOutput}</PlainCodeBlock>
            </div>
          )}
          {showActualOutput && (
            <div>
              <SectionLabel>Your Output</SectionLabel>
              <PlainCodeBlock variant="wrong">{ft.actualOutput}</PlainCodeBlock>
            </div>
          )}
        </div>
      )}

      {showError && (
        <div
          className="rounded-lg border px-3.5 py-3 flex flex-col gap-2"
          style={{
            background: cfg.softBg,
            borderColor: `${cfg.accentColor}33`,
          }}
        >
          <div
            className="flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: cfg.accentColor }}
          >
            <Icon size={13} strokeWidth={2.3} />
            {errorLabel}
          </div>
          <PlainCodeBlock variant="error" accentColor={cfg.accentColor}>
            {errorContent}
          </PlainCodeBlock>
        </div>
      )}
    </div>
  );
}

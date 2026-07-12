import React from "react";
import type { SubmitCodeSuccess, SubmitCodeError } from "@/features/submissionStore";
import { getStatusCfg } from "@/lib/share/getStatusConfig";
import { StatusHeader } from "../helperComponents/StatusHeader";

export function ProgressBar({
  passed,
  total,
  accentColor,
}: {
  passed: number;
  total: number;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">
          Test cases passed
        </span>
        <span
          className="text-[13px] font-semibold tabular-nums"
          style={{ color: accentColor }}
        >
          {passed} / {total}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const isPass = i < passed;
          const isFirstFail = i === passed && passed < total;
          return (
            <div
              key={i}
              className={`h-[5px] flex-1 rounded-full transition-colors duration-300 ${
                isPass || isFirstFail ? "" : "bg-secondary"
              }`}
              style={
                isPass
                  ? { background: "#22C55E" }
                  : isFirstFail
                    ? { background: accentColor }
                    : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export function SubmitStatusHero({
  result,
  isSuccess,
  langLabel,
  failBadge,
  passed,
  total,
}: {
  result: SubmitCodeSuccess | SubmitCodeError;
  isSuccess: boolean;
  langLabel: string;
  failBadge: string | null;
  passed: number;
  total: number;
}) {
  const failure = result as SubmitCodeError;
  const ft = failure.failedTestCase ?? null;
  const ftStatus = ft?.status ?? failure.status ?? "wrong_answer";
  const ftStderr = ft?.stderr ?? failure.stderr ?? null;

  const cfg = getStatusCfg(
    isSuccess ? "accepted" : ftStatus,
    ft?.statusDescription ?? failure.statusDescription,
    result.language,
    ftStderr,
  );

  const subtitle = isSuccess
    ? "All test cases passed successfully."
    : failBadge
      ? `Failed on testcase ${passed + 1} of ${total}.`
      : cfg.subtitleText;

  return (
    <>
      <StatusHeader
        cfg={cfg}
        subtitle={subtitle}
        langLabel={langLabel}
        failBadge={failBadge}
      />
      <div className="px-5 pt-4">
        <ProgressBar passed={passed} total={total} accentColor={cfg.accentColor} />
      </div>
    </>
  );
}

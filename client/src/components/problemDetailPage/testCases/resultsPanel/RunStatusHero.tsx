import React from "react";
import type { RunCodeSuccess, RunCodeError } from "@/features/submissionStore";
import { getStatusCfg } from "@/lib/share/getStatusConfig";
import { StatusHeader } from "../../helperComponents/StatusHeader";

export function RunStatusHero({
  result,
  langLabel,
}: {
  result: RunCodeSuccess | RunCodeError;
  langLabel: string;
}) {
  const error = result as RunCodeError;
  const cfg = getStatusCfg(
    result.status,
    error.statusDescription,
    result.language,
    error.stderr ?? null,
  );

  return <StatusHeader cfg={cfg} langLabel={langLabel} compact />;
}

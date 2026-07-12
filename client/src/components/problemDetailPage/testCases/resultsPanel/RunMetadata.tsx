import React from "react";
import type { RunCodeSuccess, RunCodeError } from "@/features/submissionStore";
import { formatTimestamp, MetadataFooter, MetaItem } from "../../helperComponents/ResultAtoms";

export function RunMetadata({
  result,
  langLabel,
}: {
  result: RunCodeSuccess | RunCodeError;
  langLabel: string;
}) {
  const items: MetaItem[] = [];
  items.push({ label: "Language", value: langLabel });
  if (result.submittedAt)
    items.push({
      label: "Submitted At",
      value: formatTimestamp(result.submittedAt),
    });
  if (result.totalTestCasesInProblem != null)
    items.push({
      label: "Total Test Cases",
      value: String(result.totalTestCasesInProblem),
    });

  return <MetadataFooter items={items} />;
}

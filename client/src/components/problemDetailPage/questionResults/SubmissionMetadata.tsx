import React from "react";
import type { SubmitCodeSuccess, SubmitCodeError } from "@/features/submissionStore";
import { getLanguageConfig } from "@/lib/share/languageConfig";
import {
  formatMemoryMB,
  formatTimestamp,
  MetadataFooter,
  MetaItem,
} from "../helperComponents/codeSubmission/ResultAtoms";

export function SubmissionMetadata({
  result,
}: {
  result: SubmitCodeSuccess | SubmitCodeError;
}) {
  const items: MetaItem[] = [];

  if (
    result.runtimeInMilliseconds != null &&
    !Number.isNaN(result.runtimeInMilliseconds)
  ) {
    items.push({ label: "Runtime", value: `${result.runtimeInMilliseconds}ms` });
  }
  const mem = formatMemoryMB(result.memoryInMegabytes);
  if (mem) items.push({ label: "Memory", value: mem });
  if (result.language)
    items.push({
      label: "Language",
      value: getLanguageConfig(result.language)?.label ?? result.language,
    });
  if (result.passRate != null)
    items.push({ label: "Pass Rate", value: `${result.passRate}%` });
  if (result.avgRuntimeInMilliseconds != null)
    items.push({
      label: "Avg Runtime",
      value: `${result.avgRuntimeInMilliseconds}ms`,
    });
  if (result.submittedAt)
    items.push({
      label: "Submitted",
      value: formatTimestamp(result.submittedAt),
    });

  return <MetadataFooter items={items} />;
}

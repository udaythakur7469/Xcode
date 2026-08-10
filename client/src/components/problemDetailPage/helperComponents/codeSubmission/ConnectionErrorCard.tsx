import React from "react";
import { RefreshCw, Info } from "lucide-react";
import type { NetworkError } from "@/features/submissionStore";
import { getConnectionErrorCfg } from "@/lib/share/getStatusConfig";
import { StatusHeader } from "./StatusHeader";
import { SectionLabel, Divider } from "./ResultAtoms";

function formatAttemptTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ConnectionErrorCard({
  error,
  langLabel,
  onRetry,
  compact = false,
}: {
  error: NetworkError;
  langLabel: string;
  onRetry: () => void;
  compact?: boolean;
}) {
  const cfg = getConnectionErrorCfg(error.message);

  return (
    <div className="h-full w-full flex flex-col">
      <StatusHeader cfg={cfg} langLabel={langLabel} compact={compact} />

      <div className="px-5 py-4 flex flex-col gap-3 flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={onRetry}
          className="self-start inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3.5 py-1.5 rounded-lg border border-border/10 bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
        >
          <RefreshCw size={13} strokeWidth={2.3} />
          Try again
        </button>
        <p className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground -mt-1">
          <Info size={11} strokeWidth={2} className="flex-shrink-0" />
          Re-submits the same code and language shown below — you don&rsquo;t
          need to retype anything.
        </p>

        <Divider />

        <div>
          <SectionLabel>Attempt details</SectionLabel>
          <div className="rounded-lg border border-border/10 bg-foreground/[0.015] px-3.5">
            <div className="flex items-center justify-between py-2 border-b border-border/5 text-xs">
              <span className="text-muted-foreground">Action</span>
              <span className="font-mono text-[11.5px] font-medium">
                {error.action}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/5 text-xs">
              <span className="text-muted-foreground">Language</span>
              <span className="font-mono text-[11.5px] font-medium">
                {langLabel}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/5 text-xs">
              <span className="text-muted-foreground">Attempted at</span>
              <span className="font-mono text-[11.5px] font-medium">
                {formatAttemptTime(error.attemptedAt)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-xs">
              <span className="text-muted-foreground">Waited</span>
              <span className="font-mono text-[11.5px] font-medium">
                {error.waitedSeconds}s (timed out)
              </span>
            </div>
          </div>
        </div>

        <Divider />

        <div>
          <SectionLabel>What you can try</SectionLabel>
          <ul className="list-disc pl-[18px] flex flex-col gap-1.5">
            <li className="text-xs text-muted-foreground leading-relaxed">
              Check that your internet connection is stable, then try again.
            </li>
            <li className="text-xs text-muted-foreground leading-relaxed">
              If this keeps happening, the judge server may be temporarily down
              — wait a minute and retry.
            </li>
            <li className="text-xs text-muted-foreground leading-relaxed">
              Your code hasn&rsquo;t been lost — it&rsquo;s still in the editor
              exactly as you left it.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Zap, HardDrive, ListChecks, TrendingUp } from "lucide-react";
import { formatMemoryMB } from "../helperComponents/codeSubmission/ResultAtoms";

type PerformanceCardsProps = {
  isSuccess: boolean;
  runtimeMs: number;
  memoryMb: number;
  passed: number;
  total: number;
  percentile?: number | null;
};

function Card({
  icon: Icon,
  label,
  value,
  success,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="bg-secondary border border-border/10 rounded-lg px-3.5 py-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
        <Icon size={11} strokeWidth={2.3} />
        {label}
      </div>
      <div
        className="text-[19px] font-bold tracking-tight tabular-nums"
        style={success ? { color: "#22C55E" } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

// Auto-fit grid — reflows based on the actual rendered width of this panel,
// not the browser viewport. The left question panel is user-resizable
// independent of window size (see ResizablePanels.tsx), so a viewport-based
// Tailwind breakpoint (e.g. lg:grid-cols-4) would not reliably reflect how
// much space this component actually has.
export function PerformanceCards({
  isSuccess,
  runtimeMs,
  memoryMb,
  passed,
  total,
  percentile,
}: PerformanceCardsProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2.5">
      <Card icon={Zap} label="Runtime" value={`${runtimeMs}ms`} />
      <Card
        icon={HardDrive}
        label="Memory"
        value={formatMemoryMB(memoryMb) ?? "—"}
      />
      <Card
        icon={ListChecks}
        label="Passed"
        value={`${passed} / ${total}`}
        success={isSuccess}
      />
      {isSuccess && percentile != null && (
        <Card
          icon={TrendingUp}
          label="Percentile"
          value={`${percentile}%`}
          success
        />
      )}
    </div>
  );
}

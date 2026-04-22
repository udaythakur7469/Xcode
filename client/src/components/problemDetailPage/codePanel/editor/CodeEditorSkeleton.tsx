import { Skeleton } from "@/components/ui/skeleton";

export function CodeEditorSkeleton() {
  return (
    <div className="h-full w-full flex flex-col gap-3 px-4 py-4">
      {[
        "45%",
        "30%",
        "72%",
        null,   // blank line
        "55%",
        "38%",
        null,   // blank line
        "28%",
        "18%",
        "12%",
      ].map((w, i) => (
        <div key={i} className="flex flex-row items-center gap-4">
          <Skeleton className="h-3 w-4 rounded flex-shrink-0 opacity-40" />
          {w && <Skeleton className="h-3 rounded" style={{ width: w }} />}
        </div>
      ))}
    </div>
  );
}
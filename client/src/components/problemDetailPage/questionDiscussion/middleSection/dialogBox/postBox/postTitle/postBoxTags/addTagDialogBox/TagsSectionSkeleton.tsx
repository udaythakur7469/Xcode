import { Skeleton } from "@/components/ui/skeleton";

export function TagsSectionSkeleton() {
  return (
    <div className="flex flex-col gap-1 w-full">
      {["55%", "72%", "48%", "62%", "40%"].map((w, i) => (
        <div key={i} className="px-3 py-2">
          <Skeleton className="h-4 rounded" style={{ width: w }} />
        </div>
      ))}
    </div>
  );
}

export function TagValidatingSkeleton() {
  return (
    <div className="px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-3 w-3 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin flex-shrink-0" />
      Validating tag...
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function TestCasesPanelSkeleton() {
  return (
    <div className="h-full w-full p-2">
      {/* Tab triggers row */}
      <div className="flex flex-row gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton
            key={i}
            className={`h-8 w-24 rounded-md ${i === 1 ? "opacity-100" : "opacity-50"}`}
          />
        ))}
      </div>

      {/* Active tab content card */}
      <div className="bg-secondary p-4 rounded-md flex flex-col gap-4">
        {/* Input line */}
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-56 rounded" />
        </div>

        {/* Expected Output line */}
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

// ── Single card skeleton — matches h-[296px] w-[400px] ───────────────────────
export function InterviewCardSkeleton() {
  return (
    <div className="h-[296px] w-[400px] border rounded-xl blue-gradient-dark flex-shrink-0 p-4 flex flex-col justify-between">
      {/* Top row — cover image + type badge */}
      <div className="flex flex-row justify-between items-start">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <Skeleton className="h-7 w-24 rounded-xl" />
      </div>

      {/* Role title */}
      <Skeleton className="h-7 w-[75%] rounded mt-2" />

      {/* Date + score row */}
      <div className="flex flex-row gap-6 mt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
      </div>

      {/* Description line */}
      <div className="flex flex-col gap-1.5 mt-1">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-[60%] rounded" />
      </div>

      {/* Bottom row — tech icons + button */}
      <div className="flex flex-row justify-between items-center mt-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-36 rounded-3xl" />
      </div>
    </div>
  );
}

// ── Row skeleton — title + show all + N cards ─────────────────────────────────
// cardCount controls how many card skeletons to show
export function InterviewRowSkeleton({
  title,
  cardCount = 3,
}: {
  title: string;
  cardCount?: number;
}) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-row mr-5 justify-between mb-3">
        <Skeleton className="h-8 w-48 rounded ml-5" />
        <Skeleton className="h-9 w-24 rounded" />
      </div>

      {/* Cards row */}
      <div className="w-full h-[300px] overflow-hidden">
        <div className="flex space-x-16 py-0.5 ml-5 h-full">
          {Array.from({ length: cardCount }).map((_, i) => (
            <InterviewCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function ContestJourneySkeleton() {
  return (
    <div className="w-full px-5 pb-24">
      <Skeleton className="h-4 w-32 mt-6" />

      {/* JourneyHeroStats */}
      <div className="card-modern hero-mesh p-7 mt-4">
        <Skeleton className="h-3 w-32 mb-1.5" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72 mt-2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-chip p-3">
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* AscentGraph */}
      <div className="card-modern p-5 md:p-7 mt-6">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-64 w-full rounded-md" />
      </div>

      {/* JourneyTimeline */}
      <div className="mt-12 mb-8">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="flex flex-col gap-8 items-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-full flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <div className="w-full md:w-[45%] rounded-lg border p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

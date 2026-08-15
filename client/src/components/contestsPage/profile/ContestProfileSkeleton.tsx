import { Skeleton } from "@/components/ui/skeleton";

export function ContestProfileSkeleton() {
  return (
    <div className="w-full px-5 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 pt-8">
        {/* ProfileSummaryCard */}
        <div className="card-modern hero-mesh p-5 h-fit">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <Skeleton className="h-5 w-28 mt-3" />
            <Skeleton className="h-4 w-24 mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="stat-chip p-2.5">
              <Skeleton className="h-3 w-10 mb-1" />
              <Skeleton className="h-5 w-14" />
            </div>
            <div className="stat-chip p-2.5">
              <Skeleton className="h-3 w-10 mb-1" />
              <Skeleton className="h-5 w-14" />
            </div>
            <div className="stat-chip p-2.5 col-span-2">
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-5 w-10" />
            </div>
          </div>
          <Skeleton className="h-9 w-full mt-4 rounded-md" />
        </div>

        <div className="flex flex-col gap-6">
          {/* RatingGraphCard */}
          <div className="card-modern p-5">
            <Skeleton className="h-4 w-28 mb-3" />
            <Skeleton className="h-52 w-full rounded-md" />
          </div>

          {/* AchievementsCard */}
          <div className="card-modern p-5">
            <Skeleton className="h-4 w-28 mb-3" />
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 p-2 rounded-md border"
                >
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
              ))}
            </div>
          </div>

          {/* ContestHistoryCard */}
          <div className="card-modern p-5">
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

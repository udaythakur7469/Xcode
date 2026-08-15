import { Skeleton } from "@/components/ui/skeleton";

export function ContestsListSkeleton() {
  return (
    <div className="w-full px-5 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pt-8">
        <div>
          {/* NextContestHero */}
          <div className="card-modern hero-mesh p-6 relative overflow-hidden">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-32 rounded-full" />
                </div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-40 mt-2" />
              </div>
              <div className="text-right">
                <Skeleton className="h-3 w-16 mb-2 ml-auto" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <Skeleton className="h-9 w-40 rounded-md" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>

          {/* ContestTabsSearch */}
          <div className="flex items-center justify-between gap-3 mb-4 mt-8 flex-wrap">
            <div className="flex gap-4 border-b flex-1 min-w-0 pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-9 w-56 rounded-md" />
          </div>

          {/* ContestListItem rows */}
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card-modern p-4 flex items-center justify-between"
              >
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* MyRatingSidebar */}
        <div className="flex flex-col gap-4">
          <div className="card-modern p-4">
            <Skeleton className="h-3 w-20 mb-3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <div>
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-full mt-4 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

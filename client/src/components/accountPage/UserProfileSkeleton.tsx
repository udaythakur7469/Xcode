import { Skeleton } from "@/components/ui/skeleton";

export function UserProfileSkeleton() {
  return (
    <div className="w-full min-h-screen px-4 sm:px-6 py-4 pb-10">
      <div className="w-full flex flex-col lg:flex-row gap-3 items-start">
        {/* Sidebar Skeleton */}
        <div className="bg-accent border rounded-xl w-full lg:w-80 xl:w-96 lg:flex-shrink-0">
          <div className="w-full flex flex-col items-center pb-6">
            {/* Avatar + Name/Email */}
            <div className="w-full flex flex-row justify-around mt-8 px-6 pb-5">
              <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
              <div className="flex flex-col justify-start items-start px-4 min-w-0 flex-1 gap-2 mt-1">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>

            <div className="w-full px-5">
              <Skeleton className="h-px w-full" />
            </div>

            {/* Description */}
            <div className="w-full px-5 mt-8">
              <div className="flex flex-col border rounded-md p-2 gap-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Links */}
            <div className="w-full px-5 mt-6">
              <div className="flex flex-col border rounded-md p-2 gap-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="w-full px-5 mt-6">
              <div className="flex flex-col border rounded-md p-2 gap-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-5 w-20" />
                <div className="space-y-2">
                  {[80, 72, 88, 64].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton
                        className="h-6 rounded-full"
                        style={{ width: `${w}px` }}
                      />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 w-full flex flex-col gap-3 min-w-0">
          {/* Top Row: Pie Chart + Edit Profile */}
          <div className="w-full flex flex-col sm:flex-row gap-3">
            {/* Pie Chart */}
            <div className="sm:flex-[9] w-full min-h-[180px] bg-accent border rounded-xl p-3 flex flex-col">
              <Skeleton className="h-6 w-52 mx-auto mb-3" />
              <div className="flex-1 flex items-center justify-center gap-6 px-4">
                <Skeleton className="w-32 h-32 rounded-full flex-shrink-0" />
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-sm" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-sm" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-sm" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Bar */}
            <div className="sm:flex-[11] w-full min-h-[180px] bg-accent border rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-36" />
                <Skeleton className="h-4 w-4 rounded-sm" />
              </div>
              <div className="flex flex-col gap-2 ml-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <Skeleton className="h-5 w-28 ml-1" />
            </div>
          </div>

          {/* Heatmap */}
          <div className="w-full rounded-xl bg-accent border p-4">
            <Skeleton className="h-6 w-72 mb-1" />
            <Skeleton className="h-4 w-44 mb-4" />
            {/* Month labels row */}
            <div className="flex gap-[22px] mb-1 pl-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-7" />
              ))}
            </div>
            {/* Grid rows */}
            <div className="flex gap-1 pl-8">
              <div className="flex flex-col gap-1 mr-1">
                {["Mon", "Wed", "Fri"].map((d) => (
                  <Skeleton key={d} className="h-3 w-6 mt-[6px]" />
                ))}
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: 53 }).map((_, col) => (
                  <div key={col} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, row) => (
                      <Skeleton
                        key={row}
                        className="w-[11px] h-[11px] rounded-sm"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center justify-end mt-2 gap-2">
              <Skeleton className="h-3 w-6" />
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-3 h-3 rounded-sm" />
                ))}
              </div>
              <Skeleton className="h-3 w-8" />
            </div>
          </div>

          {/* Data Table */}
          <div className="w-full min-h-[200px] rounded-xl bg-accent border p-3 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-2 py-1">
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

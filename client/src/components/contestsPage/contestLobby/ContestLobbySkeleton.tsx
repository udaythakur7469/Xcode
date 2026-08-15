import { Skeleton } from "@/components/ui/skeleton";

export function ContestLobbySkeleton() {
  return (
    <div className="w-full px-5 pb-24">
      <Skeleton className="h-4 w-32 mt-6" />

      {/* ContestLobbyHero */}
      <div className="card-modern hero-mesh p-7 mt-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Skeleton className="h-3 w-16 mb-1.5" />
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-52 mt-2" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-16 mb-2 ml-auto" />
            <Skeleton className="h-9 w-28 ml-auto" />
            <Skeleton className="h-9 w-32 mt-3 ml-auto" />
          </div>
        </div>
      </div>

      {/* ContestLobbyTabs */}
      <div className="flex gap-6 border-b mt-6 pb-2">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-10" />
      </div>

      {/* Tab content */}
      <div className="py-6 flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

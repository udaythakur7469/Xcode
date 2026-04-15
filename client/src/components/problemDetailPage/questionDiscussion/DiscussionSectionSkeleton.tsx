import { Skeleton } from "@/components/ui/skeleton";

function PostCardSkeleton() {
  return (
    <div className="h-full w-full flex flex-row bg-secondary rounded-lg p-3 gap-3">
      {/* Avatar */}
      <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 mt-1" />

      {/* Content */}
      <div className="flex flex-col gap-2 flex-1">
        {/* Author name */}
        <Skeleton className="h-3 w-12 rounded" />
        {/* Post title */}
        <Skeleton className="h-5 w-[65%] rounded" />
        {/* Tags row */}
        <div className="flex flex-row gap-1 flex-wrap">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>
        {/* Footer reactions */}
        <div className="flex flex-row gap-3 mt-1">
          <Skeleton className="h-6 w-12 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
          <Skeleton className="h-6 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

export function DiscussionSectionSkeleton() {
  return (
    <div className="flex flex-col h-full w-full gap-2 px-3">
      {/* TopSection — search bar */}
      <div className="h-[50px] flex items-center">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      {/* MiddleSection */}
      <div className="h-[90px] flex flex-col gap-2">
        {/* PostsTags — tag pills */}
        <div className="h-3/5 flex items-center overflow-hidden">
          <div className="flex flex-row gap-2">
            {[72, 88, 112, 128, 104, 120, 96].map((w, i) => (
              <Skeleton
                key={i}
                className="h-7 rounded-xl flex-shrink-0"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>

        {/* ShareSolution — status + submit button */}
        <div className="h-2/5 flex items-center">
          <div className="flex flex-row items-center w-full bg-muted rounded-xl px-3 py-2 gap-3">
            <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
            <Skeleton className="h-4 w-56 rounded" />
            <Skeleton className="h-7 w-40 rounded-xl ml-auto" />
          </div>
        </div>
      </div>

      {/* BottomSection — post cards */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-3 mr-2 mt-3">
          {[1, 2, 3, 4].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

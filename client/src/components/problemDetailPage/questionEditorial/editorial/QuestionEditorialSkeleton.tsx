import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function QuestionEditorialSkeleton() {
  return (
    <div className="h-[610px] w-full overflow-y-auto">
      <div className="flex flex-col justify-center items-start p-5">
        {/* Title */}
        <div className="flex flex-row items-center gap-2 ml-1">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-44 rounded" />
        </div>

        {/* Video solution label */}
        <div className="mt-5 ml-2">
          <Skeleton className="h-7 w-36 rounded" />
        </div>
        <Separator className="mt-3" />

        {/* Video player placeholder */}
        <div className="mt-5 px-2 w-full h-[400px]">
          <Skeleton className="w-full h-full rounded-md" />
        </div>

        {/* Solution article label */}
        <div className="mt-5 ml-2">
          <Skeleton className="h-7 w-40 rounded" />
        </div>
        <Separator className="mt-3 mb-3" />

        {/* Approach block — repeated 3 times for brute/better/optimal */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="ml-2 mr-2 w-full">
            {/* Approach title */}
            <Skeleton className="h-6 w-56 rounded mb-3" />

            {/* Intuition */}
            <Skeleton className="h-5 w-24 rounded mt-3 mb-3" />
            <div className="ml-4 flex flex-col gap-2 mt-4">
              <Skeleton className="h-4 w-[90%] rounded" />
              <Skeleton className="h-4 w-[75%] rounded" />
              <Skeleton className="h-4 w-[82%] rounded" />
            </div>

            {/* Algorithm */}
            <Skeleton className="h-5 w-24 rounded mt-5 mb-3" />
            <div className="ml-4 flex flex-col gap-2 mt-4">
              <Skeleton className="h-4 w-[85%] rounded" />
              <Skeleton className="h-4 w-[70%] rounded" />
              <Skeleton className="h-4 w-[78%] rounded" />
            </div>

            {/* Implementation / CodeTabs */}
            <Skeleton className="h-5 w-32 rounded mt-5 mb-3" />
            <div className="flex gap-2 mb-2">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
            <Skeleton className="h-40 w-full rounded-md" />

            {/* Complexity */}
            <Skeleton className="h-5 w-44 rounded mt-5 mb-3" />
            <div className="ml-3 flex flex-col gap-4">
              <div>
                <Skeleton className="h-4 w-56 rounded" />
                <div className="ml-4 mt-2">
                  <Skeleton className="h-4 w-[70%] rounded" />
                </div>
              </div>
              <div>
                <Skeleton className="h-4 w-52 rounded" />
                <div className="ml-4 mt-2">
                  <Skeleton className="h-4 w-[65%] rounded" />
                </div>
              </div>
            </div>

            <Separator className="mt-5 mb-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

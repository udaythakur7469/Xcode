import { Skeleton } from "@/components/ui/skeleton";

export function QuestionDataSkeleton() {
  return (
    <div className="h-[610px] w-full overflow-y-auto p-2">
      {/* Title row */}
      <div className="flex flex-row justify-between items-center p-2 mb-2">
        <div className="flex items-center gap-3 ml-1">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-10 w-56 rounded-md" />
        </div>
      </div>

      {/* Difficulty badge + tags + actions row */}
      <div className="flex flex-row items-center flex-wrap gap-2 px-4 py-2 mb-2">
        <Skeleton className="h-7 w-14 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <div className="flex flex-row items-center gap-2 pt-1">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-14 rounded-full" />
          <Skeleton className="h-7 w-14 rounded-full" />
          <Skeleton className="h-7 w-10 rounded-full" />
        </div>
      </div>

      {/* Description lines */}
      <div className="ml-4 mr-4 mt-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-[72%] rounded" />
        <Skeleton className="h-4 w-[85%] rounded" />
        <Skeleton className="h-4 w-[55%] rounded" />
        <Skeleton className="h-4 w-[90%] rounded" />
        <Skeleton className="h-4 w-[40%] rounded" />
      </div>

      {/* Examples section */}
      <div className="ml-4 mr-4 mt-8">
        <Skeleton className="h-6 w-28 rounded mb-4" />
        <div className="mb-4 bg-secondary rounded-md py-4 px-4">
          <Skeleton className="h-4 w-24 rounded mb-3" />
          <Skeleton className="h-4 w-[60%] rounded mb-2" />
          <Skeleton className="h-4 w-[40%] rounded mb-2" />
          <Skeleton className="h-4 w-[75%] rounded" />
        </div>
      </div>

      {/* Constraints section */}
      <div className="ml-4 mr-4 mt-8 mb-4">
        <Skeleton className="h-6 w-28 rounded mb-4" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-[50%] rounded" />
          <Skeleton className="h-4 w-[44%] rounded" />
          <Skeleton className="h-4 w-[48%] rounded" />
          <Skeleton className="h-4 w-[55%] rounded" />
        </div>
      </div>
    </div>
  );
}

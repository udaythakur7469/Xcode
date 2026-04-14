import { Skeleton } from "@/components/ui/skeleton";

export function ProblemTableSkeleton() {
  return (
    <div className="w-full">
      <div className="rounded-md border w-full">
        {/* Header */}
        <div className="grid grid-cols-[60px_1fr_130px_140px_110px] px-4 py-3 border-b">
          <Skeleton className="h-4 w-7" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-14 ml-auto" />
        </div>

        {/* Rows */}
        {[140, 160, 120, 150, 130, 175, 115, 155, 125, 145].map((w, i) => (
          <div
            key={i}
            className="grid grid-cols-[60px_1fr_130px_140px_110px] px-4 py-3 border-b items-center"
          >
            <Skeleton className="h-3 w-4" />
            <Skeleton className="h-3" style={{ width: w }} />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-14 ml-auto" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-4 w-24 self-center" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export function HintsDialogSkeleton() {
  return (
    <div className="flex flex-col w-full min-h-[310px] justify-between py-2">
      {/* Title */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-24 rounded" />
      </div>

      {/* Subtitle lines */}
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-64 rounded" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      {/* Hint rows */}
      <div className="flex flex-col gap-3 w-full">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
}

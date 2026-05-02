import { Skeleton } from "@/components/ui/skeleton";

export function ChatMessageListSkeleton() {
  return (
    <div className="h-full overflow-y-auto px-3 py-2 flex flex-col gap-3">
      {/* User bubble — right aligned */}
      <div className="flex flex-col items-end mb-3">
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* AI bubble — left aligned, multiline */}
      <div className="flex flex-col items-start mb-3">
        <div className="flex flex-col gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 max-w-[70%]">
          <Skeleton className="h-3 w-64 rounded" />
          <Skeleton className="h-3 w-56 rounded" />
          <Skeleton className="h-3 w-44 rounded" />
        </div>
      </div>

      {/* User bubble — right aligned */}
      <div className="flex flex-col items-end mb-3">
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>

      {/* AI bubble — left aligned, multiline */}
      <div className="flex flex-col items-start mb-3">
        <div className="flex flex-col gap-2 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 max-w-[70%]">
          <Skeleton className="h-3 w-60 rounded" />
          <Skeleton className="h-3 w-52 rounded" />
        </div>
      </div>
    </div>
  );
}

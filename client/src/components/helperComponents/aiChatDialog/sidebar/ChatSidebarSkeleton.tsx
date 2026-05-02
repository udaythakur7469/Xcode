import { Skeleton } from "@/components/ui/skeleton";

export function ChatSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-2 mt-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}
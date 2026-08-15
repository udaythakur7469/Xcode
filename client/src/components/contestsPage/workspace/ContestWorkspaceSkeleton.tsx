import { Skeleton } from "@/components/ui/skeleton";

export function ContestWorkspaceSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* WorkspaceNavbar */}
      <div className="w-full bg-black grid grid-cols-3 h-12 flex-shrink-0 flex-none items-center px-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32 bg-white/10" />
          <Skeleton className="h-3 w-10 bg-white/10" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-8 w-8 bg-white/10 rounded-md" />
          <Skeleton className="h-8 w-[90px] bg-white/10 rounded-md" />
          <Skeleton className="h-8 w-20 bg-white/10 rounded-md" />
          <Skeleton className="h-8 w-16 bg-white/10 rounded-md" />
        </div>
        <div className="flex items-center justify-end gap-3">
          <Skeleton className="h-3 w-40 bg-white/10" />
          <Skeleton className="h-8 w-28 bg-white/10 rounded-md" />
          <Skeleton className="h-8 w-8 bg-white/10 rounded-md" />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* ProblemRail */}
        <div className="border-r flex flex-col items-center py-4 gap-2 flex-shrink-0 w-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-[38px] h-[38px] rounded-lg" />
          ))}
        </div>

        <div className="flex-1 flex m-4 gap-1">
          {/* QuestionPanel */}
          <div className="flex-1 flex flex-col border rounded-lg overflow-hidden">
            <div className="h-10 flex items-center justify-end px-2 flex-shrink-0 bg-secondary">
              <Skeleton className="h-5 w-5" />
            </div>
            <div className="flex-1 p-6">
              <Skeleton className="h-6 w-48 mb-3" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-5 w-24 mt-8 mb-3" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md mt-3" />
            </div>
          </div>

          {/* Right column: EditorPanel + TestcasePanel */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex-[88] flex flex-col border rounded-lg overflow-hidden">
              <div className="h-10 flex items-center justify-between px-2 flex-shrink-0 bg-secondary">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-7 w-24 rounded-md" />
                  <Skeleton className="h-7 w-16 rounded-md" />
                  <Skeleton className="h-7 w-12 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-16 rounded-md" />
                  <Skeleton className="h-7 w-20 rounded-md" />
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-4"
                    style={{ width: `${70 - i * 3}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex-[12] flex flex-col border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-2 border-b flex-shrink-0">
                <div className="flex gap-1 py-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16 ml-3" />
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
              <div className="flex-1 p-3 flex gap-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

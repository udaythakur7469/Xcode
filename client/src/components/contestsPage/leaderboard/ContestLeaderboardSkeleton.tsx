import { Skeleton } from "@/components/ui/skeleton";

export function ContestLeaderboardSkeleton() {
  return (
    <div className="w-full px-5 pb-24">
      <Skeleton className="h-4 w-16 mt-6" />

      {/* LeaderboardHeader */}
      <div className="card-modern hero-mesh p-6 mt-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-48 rounded-md" />
      </div>

      {/* LeaderboardPodium */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {["h-28", "h-36", "h-24"].map((h, i) => (
          <div
            key={i}
            className={`rounded-2xl p-5 flex flex-col items-center justify-end ${h} bg-accent`}
          >
            <Skeleton className="h-8 w-8 rounded-full mb-2" />
            <Skeleton className="h-10 w-10 rounded-full mb-2" />
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* LeaderboardTable */}
      <div className="card-modern mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b text-xs text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium py-3 px-4">Rank</th>
              <th className="text-left font-medium py-3 px-4">User</th>
              <th className="text-center font-medium py-3 px-4">Solved</th>
              <th className="text-center font-medium py-3 px-4">Penalty</th>
              <th className="text-right font-medium py-3 px-4">Rating</th>
              <th className="text-right font-medium py-3 px-4">Δ Rating</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-3 px-4">
                  <Skeleton className="h-4 w-6" />
                </td>
                <td className="py-3 px-4">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Skeleton className="h-4 w-6 mx-auto" />
                </td>
                <td className="py-3 px-4 text-center">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </td>
                <td className="py-3 px-4 text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </td>
                <td className="py-3 px-4 text-right">
                  <Skeleton className="h-4 w-10 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

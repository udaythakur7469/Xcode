import { Skeleton } from "@/components/ui/skeleton";

// ── Reusable card wrapper ─────────────────────────────────────────────────────
function SkeletonCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// ── Card header row (icon + title + divider) ──────────────────────────────────
function SkeletonCardHeader() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <Skeleton className="w-[30px] h-[30px] rounded-lg flex-shrink-0" />
      <Skeleton className="h-5 w-44 rounded" />
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function FeedbackPageSkeleton() {
  return (
    <div className="w-full px-5 py-6 flex flex-col gap-6">
      {/* ── Navbar ── */}
      <div className="w-full h-[64px] border border-border bg-card rounded-xl flex items-center justify-between px-5 mb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="flex items-center gap-8">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </div>

      {/* ── Hero header ── */}
      <SkeletonCard>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-9 w-64 rounded" />
            <div className="flex gap-2 flex-wrap">
              {[60, 48, 56, 44, 72, 52].map((w, i) => (
                <Skeleton
                  key={i}
                  className="h-5 rounded-full"
                  style={{ width: w }}
                />
              ))}
            </div>
          </div>
          {/* Score ring */}
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="w-[140px] h-[140px] rounded-full" />
            <Skeleton className="h-5 w-20 rounded" />
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary border border-border"
            >
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* ── Skill Radar + Score History ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard>
          <SkeletonCardHeader />
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonCardHeader />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
        </SkeletonCard>
      </div>

      {/* ── Benchmark ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <Skeleton className="h-4 w-[60%] rounded mb-4" />
        <Skeleton className="h-3 w-full rounded-full" />
        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 w-8 rounded" />
          ))}
        </div>
      </SkeletonCard>

      {/* ── Talk-Time Ratio ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="text-center p-3 rounded-xl bg-secondary border border-border flex flex-col items-center gap-2"
            >
              <Skeleton className="h-7 w-12 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-7 w-full rounded-lg" />
        <div className="flex justify-between mt-2 mb-4">
          <Skeleton className="h-3 w-8 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-14 w-full rounded-lg" />
      </SkeletonCard>

      {/* ── Confidence Timeline ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <div className="flex gap-4 mb-3">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-[180px] w-full rounded-xl" />
        <div className="grid grid-cols-3 mt-2 text-center gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-3 w-12 rounded mx-auto" />
          ))}
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-28 rounded-full" />
          ))}
        </div>
      </SkeletonCard>

      {/* ── Answer Quality per Question ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <div className="flex gap-4 mb-4 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-28 rounded" />
          ))}
        </div>
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="rounded-[10px] border border-border p-3 flex flex-col gap-2"
            >
              <Skeleton className="h-3 w-6 rounded" />
              <Skeleton className="h-7 w-12 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-[70%] rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-3 w-64 rounded mt-4" />
      </SkeletonCard>

      {/* ── Category Breakdown ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <div className="flex flex-col gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-[80%] rounded" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* ── Key Moments ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <div className="flex flex-col gap-3">
          {["emerald", "red", "blue"].map((color, i) => (
            <div
              key={i}
              className="rounded-[10px] border border-border pl-4 pr-4 pt-3 pb-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
              <Skeleton className="h-3 w-[60%] rounded mb-2" />
              <Skeleton className="h-4 w-full rounded mb-1" />
              <Skeleton className="h-4 w-[85%] rounded mb-2" />
              <Skeleton className="h-3 w-[70%] rounded" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* ── Strengths + Areas for Improvement ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <SkeletonCard key={i}>
            <SkeletonCardHeader />
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex gap-2 items-start">
                  <Skeleton className="h-4 w-4 rounded flex-shrink-0 mt-0.5" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* ── Recommended Study Topics ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <Skeleton className="h-4 w-[70%] rounded mb-5" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-[10px] border border-border bg-secondary"
            >
              <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-[75%] rounded" />
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-4 w-16 rounded-lg" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-lg flex-shrink-0" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* ── Final Assessment ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-[85%] rounded" />
          <Skeleton className="h-4 w-[70%] rounded" />
        </div>
      </SkeletonCard>

      {/* ── Attempt Comparison ── */}
      <SkeletonCard>
        <SkeletonCardHeader />
        <div className="flex justify-between mb-4 flex-wrap gap-2">
          <Skeleton className="h-4 w-48 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-6 w-28 rounded-lg" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-4 border-b border-border pb-3"
            >
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-12 rounded mx-auto" />
              <Skeleton className="h-4 w-12 rounded mx-auto" />
              <Skeleton className="h-4 w-16 rounded mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-lg mt-4" />
      </SkeletonCard>

      {/* ── Footer verdict bar ── */}
      <SkeletonCard>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </SkeletonCard>
    </div>
  );
}

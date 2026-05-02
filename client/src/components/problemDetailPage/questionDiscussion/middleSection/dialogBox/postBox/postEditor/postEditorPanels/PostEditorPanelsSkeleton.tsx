import { Skeleton } from "@/components/ui/skeleton";

function EditorPanelSkeleton() {
  return (
    <div className="flex h-full w-full bg-background">
      {/* Line numbers column */}
      <div className="flex flex-col gap-[10px] p-2 border-r select-none">
        {Array.from({ length: 19 }).map((_, i) => (
          <Skeleton key={i} className="h-[18px] w-5 rounded opacity-30" />
        ))}
      </div>

      {/* Code lines */}
      <div className="flex flex-col gap-[10px] p-2 pt-2 flex-1">
        {[
          "52%", // # 🚀 Problem Overview
          "0%", // blank
          "38%", // ## 📌 Problem Statement
          "78%", // > Write the problem...
          "42%", // asked, not copying...
          "0%", // blank
          "32%", // ## 🔗 References
          "62%", // - Add problem link here...
          "68%", // - Add any helpful resources...
          "0%", // blank
          "10%", // ---
          "0%", // blank
          "28%", // # 💡 Intuition
          "74%", // <!-- Explain your first thoughts...
          "52%", // came to your mind...
          "0%", // blank
          "72%", // > Tip: Mention *why*...
          "42%", // implementation.
          "0%", // line 19
        ].map((w, i) =>
          w === "0%" ? (
            <div key={i} className="h-[18px]" />
          ) : (
            <Skeleton
              key={i}
              className="h-[18px] rounded"
              style={{ width: w }}
            />
          ),
        )}
      </div>
    </div>
  );
}

function PreviewPanelSkeleton() {
  return (
    <div className="flex flex-col gap-3 pl-3 pr-2 pt-2 h-full w-full bg-background overflow-hidden">
      {/* # 🚀 Problem Overview — H1 */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-6 rounded" />
        <Skeleton className="h-7 w-52 rounded" />
      </div>

      {/* ## 📌 Problem Statement — H2 */}
      <div className="flex items-center gap-2 mt-1">
        <Skeleton className="h-6 w-5 rounded" />
        <Skeleton className="h-6 w-44 rounded" />
      </div>

      {/* blockquote */}
      <div className="border-l-4 border-muted pl-3 flex flex-col gap-2">
        <Skeleton className="h-4 w-[88%] rounded" />
        <Skeleton className="h-4 w-[70%] rounded" />
      </div>

      {/* ## 🔗 References — H2 */}
      <div className="flex items-center gap-2 mt-1">
        <Skeleton className="h-6 w-5 rounded" />
        <Skeleton className="h-6 w-36 rounded" />
      </div>

      {/* bullet list */}
      <div className="flex flex-col gap-2 ml-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 w-[58%] rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 w-[72%] rounded" />
        </div>
      </div>

      {/* --- divider */}
      <Skeleton className="h-px w-full rounded opacity-20 my-1" />

      {/* # 💡 Intuition — H1 */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-6 rounded" />
        <Skeleton className="h-7 w-36 rounded" />
      </div>
    </div>
  );
}

export function PostEditorPanelsSkeleton() {
  return (
    <div className="h-full w-full flex">
      {/* Left — editor */}
      <div className="w-1/2 border mr-1 rounded-bl-xl overflow-hidden">
        <div className="h-full w-full">
          <EditorPanelSkeleton />
        </div>
      </div>

      {/* Divider */}
      <div className="w-1 bg-border rounded-md my-1" />

      {/* Right — preview */}
      <div className="w-1/2 border ml-1 rounded-br-xl overflow-hidden">
        <div className="h-full w-full">
          <PreviewPanelSkeleton />
        </div>
      </div>
    </div>
  );
}

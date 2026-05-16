"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarStore } from "@/features/calenderStore";

const diffColor: Record<string, string> = {
  easy: "text-green-500 bg-green-500/10",
  medium: "text-yellow-500 bg-yellow-500/10",
  hard: "text-red-500 bg-red-500/10",
};

const PotdCard: React.FC = () => {
  const router = useRouter();
  const { potd, isLoadingPotd, fetchPotd } = useCalendarStore();

  React.useEffect(() => {
    fetchPotd();
  }, [fetchPotd]);

  if (isLoadingPotd) {
    return (
      <div className="w-full rounded-xl border border-border bg-card p-3.5">
        <Skeleton className="mb-2 h-3 w-32" />
        <Skeleton className="mb-2 h-4 w-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>
      </div>
    );
  }

  if (!potd) return null;

  return (
    <button
      onClick={() =>
        router.push(
          `/problems/problem-detail?title=${encodeURIComponent(potd.title)}&tab=description`,
        )
      }
      className="w-full rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-border/80 hover:bg-accent/30 group cursor-pointer"
    >
      {/* Label */}
      <div className="mb-2 flex items-center gap-1.5 cursor-pointer">
        <Star
          size={12}
          className="text-yellow-500 transition-transform group-hover:scale-110 cursor-pointer"
          fill="currentColor"
        />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer">
          Problem of the Day
        </span>
      </div>

      {/* Title */}
      <p className="mb-2 text-[13px] font-medium leading-snug text-foreground cursor-pointer">
        {potd.title}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-1.5 cursor-pointer">
        <span
          className={`rounded px-1.5 py-0.5 cursor-pointer text-[10px] font-semibold uppercase tracking-wide ${diffColor[potd.difficulty]}`}
        >
          {potd.difficulty}
        </span>
        {potd.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded border cursor-pointer border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Description preview */}
      {potd.description && (
        <p className="mt-2 line-clamp-2 cursor-pointer text-[11px] leading-relaxed text-muted-foreground">
          {potd.description}
        </p>
      )}
    </button>
  );
};

export default PotdCard;

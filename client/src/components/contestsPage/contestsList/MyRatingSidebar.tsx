"use client";

import React from "react";
import Link from "next/link";
import { getTitleForRating } from "@/lib/titles";
import { useUserStore } from "@/features/userStore";

export default function MyRatingSidebar({ rating }: { rating: { rating: number; title: string } | null }) {
  const { userData } = useUserStore();
  if (!rating || !userData) return null;

  const tier = getTitleForRating(rating.rating);

  return (
    <Link
      href={`/contests/profile/${userData.id}`}
      className="flex items-center justify-between bg-card border rounded-xl px-4 py-3 mb-6 hover:border-foreground/20 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{tier.icon}</span>
        <div>
          <div className="text-xs text-muted-foreground">Your contest rating</div>
          <div className="font-semibold text-sm" style={{ color: tier.color }}>
            {rating.title}
          </div>
        </div>
      </div>
      <div className="font-mono font-bold text-xl" style={{ color: tier.color }}>
        {rating.rating}
      </div>
    </Link>
  );
}

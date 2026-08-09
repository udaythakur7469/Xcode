"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getTitleForRating } from "@/lib/titles";
import type { UserData } from "@/features/userStore";

type MyRatingSidebarProps = {
  userData: UserData | null;
};

export default function MyRatingSidebar({ userData }: MyRatingSidebarProps) {
  const router = useRouter();
  const myRating = userData?.contestRating ?? 1200;
  const myTitle = getTitleForRating(myRating);

  return (
    <div className="card-modern p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
        My Rating
      </div>
      {userData ? (
        <>
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-lg border-2 flex items-center justify-center text-lg"
              style={{ borderColor: myTitle.color }}
            >
              <span style={{ color: myTitle.color }}>{myTitle.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono">{myRating}</div>
              <div className="text-sm font-semibold" style={{ color: myTitle.color }}>
                {myTitle.icon} {myTitle.name}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push(`/contests/profile/${userData.id}`)}
          >
            View full profile
          </Button>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">
          Sign up to get your first rating.
        </div>
      )}
    </div>
  );
}

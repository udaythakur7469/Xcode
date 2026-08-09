"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Contest } from "@/features/contestStore";

type ContestListItemProps = {
  contest: Contest;
};

export default function ContestListItem({ contest }: ContestListItemProps) {
  const router = useRouter();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-modern card-modern-hover p-4 flex items-center justify-between cursor-pointer"
      onClick={() => router.push(`/contests/${contest.slug}`)}
    >
      <div>
        <div className="text-xs text-brand font-medium">{contest.type}</div>
        <div className="font-semibold">{contest.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {new Date(contest.startTime).toLocaleString()}
        </div>
      </div>
      <div className="text-sm text-muted-foreground">View →</div>
    </motion.div>
  );
}

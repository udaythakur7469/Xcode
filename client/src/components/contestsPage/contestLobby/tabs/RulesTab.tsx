"use client";

import React from "react";

export default function RulesTab() {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
      <li>Problems increase in difficulty as you go.</li>
      <li>Wrong submissions add a +5 minute penalty against a problem, applied only once it&apos;s solved.</li>
      <li>Ranking is by total points, then by earliest last-accepted time.</li>
      <li>Plagiarism or multi-accounting results in disqualification and rating rollback.</li>
    </ul>
  );
}

"use client";

import React from "react";

export default function PrizesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card-modern card-modern-hover p-4">
        <div className="text-xs text-muted-foreground">Top 10</div>
        <div className="text-lg font-semibold mt-1 text-brand">Contest Winner badge + XP</div>
      </div>
      <div className="card-modern card-modern-hover p-4">
        <div className="text-xs text-muted-foreground">Top 100</div>
        <div className="text-lg font-semibold mt-1">Top 100 badge + XP</div>
      </div>
      <div className="card-modern card-modern-hover p-4">
        <div className="text-xs text-muted-foreground">All finishers</div>
        <div className="text-lg font-semibold mt-1">Participation XP + rating update</div>
      </div>
    </div>
  );
}

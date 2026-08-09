"use client";

import React from "react";

type FaqTabProps = {
  rated: boolean;
};

export default function FaqTab({ rated }: FaqTabProps) {
  return (
    <div className="space-y-3 max-w-2xl text-sm">
      <div>
        <div className="font-medium">What happens if I don&apos;t finish?</div>
        <div className="text-muted-foreground">Partial credit — you&apos;re ranked on what you solved.</div>
      </div>
      <div>
        <div className="font-medium">Is this contest rated?</div>
        <div className="text-muted-foreground">{rated ? "Yes." : "No — practice/virtual contests are unrated."}</div>
      </div>
    </div>
  );
}

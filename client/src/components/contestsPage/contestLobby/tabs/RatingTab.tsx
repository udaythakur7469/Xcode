"use client";

import React from "react";

type RatingTabProps = {
  rated: boolean;
};

export default function RatingTab({ rated }: RatingTabProps) {
  return (
    <p className="text-sm text-muted-foreground max-w-2xl">
      {rated
        ? "Rated for everyone — there's no placement floor. Your rating moves based on how your rank compares to what your current rating predicted; beating higher-rated players moves you up faster. Deltas are published shortly after the contest ends."
        : "This contest is unrated — it won't affect your rating."}
    </p>
  );
}

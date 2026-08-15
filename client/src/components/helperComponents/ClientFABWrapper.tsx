"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import FloatingActionButtons from "./FloatingActionButtons";

// FAB buttons + their Ctrl+K / Ctrl+Q listeners live entirely inside
// FloatingActionButtons (via useFABSystem). Not rendering it here on these
// two routes removes both the buttons and the shortcuts in one place, so an
// interview call has zero on-screen distractions.
const DISTRACTION_FREE_ROUTES = [
  "/interview/practice-interview",
  "/interview/generate-interview",
  "/contests/",
];

export default function ClientFABWrapper() {
  const pathname = usePathname();

  const isDistractionFreeRoute =
    DISTRACTION_FREE_ROUTES.some((route) => pathname?.startsWith(route)) ||
    pathname?.endsWith("/workspace");

  if (isDistractionFreeRoute) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <FloatingActionButtons />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import FloatingActionButtons from "./FloatingActionButtons";

export default function ClientFABWrapper() {
  return (
    <Suspense fallback={null}>
      <FloatingActionButtons />
    </Suspense>
  );
}

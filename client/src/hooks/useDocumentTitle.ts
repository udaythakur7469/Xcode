"use client";

import { useEffect } from "react";

/**
 * Sets the browser tab title (`document.title`) for as long as the calling
 * component is mounted, restoring whatever title was there before on
 * unmount. This is the client-side equivalent of Next.js's `metadata` /
 * `generateMetadata` export, for pages where the title depends on
 * client-only state (e.g. a value read from `useSearchParams()`) rather
 * than something known at server-render time.
 *
 * Pass `null` or `undefined` to skip updating the title for that render
 * (e.g. while the real title hasn't loaded yet) — the current title is
 * left untouched until a non-empty value comes through.
 */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (!title) return;

    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

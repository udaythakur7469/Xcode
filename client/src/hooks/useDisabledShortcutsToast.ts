"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Used only on /interview/practice-interview and /interview/generate-interview.
 * The global FAB system (and its Ctrl+K / Ctrl+Q listeners) is unmounted on
 * these routes via ClientFABWrapper, so this hook is the only thing listening
 * for those shortcuts here — it just tells the user they're disabled instead
 * of opening anything.
 */
export const useDisabledShortcutsToast = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const isQ = e.key.toLowerCase() === "q";

      if ((isK || isQ) && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toast.info(
          isK
            ? "Command bar is disabled on this page"
            : "AI chat is disabled on this page",
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
};

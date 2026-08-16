"use client";

import { useRef, useState } from "react";

/**
 * Tracks the current code buffer per problem+language, a "saved" /
 * "saving" indicator (debounced 400ms after the last keystroke, same
 * feel as the real CodeEditor.tsx toolbar), and lets the caller load or
 * clear a draft when the selected problem/language changes. Used by
 */
export function useCodeDraftAutosave() {
  const [code, setCode] = useState("");
  const [saveIndicator, setSaveIndicator] = useState<"saved" | "saving">("saved");
  const draftsRef = useRef<Record<string, string>>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDraft = (key: string, fallback: string) => {
    setCode(draftsRef.current[key] ?? fallback);
    setSaveIndicator("saved");
  };

  const updateCode = (key: string, value: string) => {
    setCode(value);
    draftsRef.current[key] = value;
    setSaveIndicator("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveIndicator("saved"), 400);
  };

  const resetDraft = (key: string, baseCode: string) => {
    delete draftsRef.current[key];
    setCode(baseCode);
    setSaveIndicator("saved");
  };

  return { code, saveIndicator, loadDraft, updateCode, resetDraft };
}

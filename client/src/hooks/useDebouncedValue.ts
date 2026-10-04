import { useEffect, useState } from "react";

/**
 * Returns `value`, updated only after `delayMs` has passed without
 * `value` changing again. Replaces the two separate hand-rolled
 * debounce implementations that previously lived in AddTagDialogBox
 * and TagsSection.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}

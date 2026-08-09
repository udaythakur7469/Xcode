import { useEffect, useState } from "react";
import type { CommandBarEntry } from "./commandBarData/commandBarTypes";

export function useCommandBarKeyboardNav(entries: CommandBarEntry[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [entries.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (entries.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < entries.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          entries[selectedIndex]?.onSelect();
          break;
        case "Home":
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setSelectedIndex(entries.length - 1);
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [entries, selectedIndex]);

  return { selectedIndex, setSelectedIndex };
}

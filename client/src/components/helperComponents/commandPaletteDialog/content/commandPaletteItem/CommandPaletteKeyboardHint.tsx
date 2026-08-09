import React from "react";
import { cn } from "@/lib/utils";

type CommandPaletteKeyboardHintProps = {
  label: "Home" | "End";
  isSelected: boolean;
};

const CommandPaletteKeyboardHint: React.FC<CommandPaletteKeyboardHintProps> = ({
  label,
  isSelected,
}) => {
  return (
    <div
      className={cn(
        "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        isSelected
          ? "border-white/30 bg-white/15 text-[var(--brand-foreground)]"
          : "border-border bg-secondary text-muted-foreground",
      )}
    >
      {label}
    </div>
  );
};

export default CommandPaletteKeyboardHint;

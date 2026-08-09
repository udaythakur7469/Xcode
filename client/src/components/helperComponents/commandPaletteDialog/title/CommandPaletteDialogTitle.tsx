"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

type CommandPaletteDialogTitleProps = {
  commandPaletteSearchQuery: string;
  handleCommandPaletteSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCommandPaletteClear: () => void;
};

const CommandPaletteDialogTitle: React.FC<CommandPaletteDialogTitleProps> = ({
  commandPaletteSearchQuery,
  handleCommandPaletteSearch,
  handleCommandPaletteClear,
}) => {
  return (
    <div className="relative w-full mr-2">
      {/* Search Icon */}
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand)]"
      />

      {/* Input Field */}
      <Input
        autoFocus
        className="h-10 w-full rounded-md border-border bg-secondary pl-10 pr-9 text-sm font-medium placeholder:text-muted-foreground focus-visible:border-[var(--brand)] focus-visible:ring-2 focus-visible:ring-[var(--brand-muted)]"
        placeholder="Type a command or search problems..."
        value={commandPaletteSearchQuery}
        onChange={handleCommandPaletteSearch}
      />

      {/* Clear (X) Icon */}
      {commandPaletteSearchQuery && (
        <button
          type="button"
          onClick={handleCommandPaletteClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
export default CommandPaletteDialogTitle;

"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

type CommandBarDialogTitleProps = {
  commandBarSearchQuery: string;
  handleCommandBarSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCommandBarClear: () => void;
};

const CommandBarDialogTitle: React.FC<CommandBarDialogTitleProps> = ({
  commandBarSearchQuery,
  handleCommandBarSearch,
  handleCommandBarClear,
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
        value={commandBarSearchQuery}
        onChange={handleCommandBarSearch}
      />

      {/* Clear (X) Icon */}
      {commandBarSearchQuery && (
        <button
          type="button"
          onClick={handleCommandBarClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
export default CommandBarDialogTitle;

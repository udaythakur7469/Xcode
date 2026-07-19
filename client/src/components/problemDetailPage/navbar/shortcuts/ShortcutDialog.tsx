"use client";

import React, { useMemo, useState } from "react";
import { Search, Keyboard as KeyboardIcon, X } from "lucide-react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { shortcutCategories, shortcuts, type Shortcut } from "./ShortcutData";

type ShortcutDialogProps = {};

// Renders one keycap. A couple of keys carry an arrow glyph that reads a
// touch small next to "Ctrl"/"Alt" at the default kbd font size, so those
// get a slightly larger glyph size to sit visually level with the rest.
const KeyCap: React.FC<{ label: string }> = ({ label }) => {
  const isArrow = ["🡲", "🡰", "🡱", "🡳"].includes(label);
  return (
    <kbd
      className={`inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-border bg-secondary px-2 py-1 text-xs font-semibold text-foreground shadow-sm ${
        isArrow ? "text-sm" : ""
      }`}
    >
      {label}
    </kbd>
  );
};

const KeyCombo: React.FC<{ keys: string[] }> = ({ keys }) => (
  <div className="flex shrink-0 items-center gap-1">
    {keys.map((key, i) => (
      <React.Fragment key={i}>
        <KeyCap label={key} />
        {i < keys.length - 1 && (
          <span className="text-xs text-muted-foreground">+</span>
        )}
      </React.Fragment>
    ))}
  </div>
);

const ShortcutRow: React.FC<{ shortcut: Shortcut }> = ({ shortcut }) => {
  const Icon = shortcut.icon;
  return (
    <div className="group flex items-center justify-between gap-4 rounded-md px-3 py-2.5 transition-colors hover:bg-secondary">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground transition-colors group-hover:text-blue-500">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-snug text-foreground">
            {shortcut.name}
          </p>
          {shortcut.note && (
            <p className="truncate text-xs leading-snug text-muted-foreground">
              {shortcut.note}
            </p>
          )}
        </div>
      </div>
      <KeyCombo keys={shortcut.keys} />
    </div>
  );
};

const ShortcutDialog: React.FC<ShortcutDialogProps> = () => {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const filteredByCategory = useMemo(() => {
    const matches = (s: Shortcut) => {
      if (!normalizedQuery) return true;
      const haystack = [s.name, s.note ?? "", ...s.keys]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    };

    return shortcutCategories
      .map((category) => ({
        category,
        items: shortcuts.filter(
          (s) => s.category === category.id && matches(s),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [normalizedQuery]);

  const totalMatches = filteredByCategory.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  return (
    <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <KeyboardIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 text-left">
            <DialogTitle className="text-lg font-semibold leading-tight">
              Keyboard Shortcuts
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {shortcuts.length} shortcuts to help you move faster
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shortcuts by name or key…"
            className="h-9 pl-9 pr-9"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-transparent">
        {totalMatches === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No shortcuts match &quot;{query}&quot;
            </p>
            <p className="text-xs text-muted-foreground">
              Try searching by action name or a key like &quot;Ctrl&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredByCategory.map(({ category, items }) => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.id}>
                  <div className="mb-1 flex items-center gap-2 px-3 py-1">
                    <CategoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {category.label}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {items.map((shortcut) => (
                      <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-6 py-3">
        <p className="text-center text-xs text-muted-foreground">
          Press{" "}
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-semibold">
            Alt
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-semibold">
            /
          </kbd>{" "}
          anytime to reopen this dialog
        </p>
      </div>
    </DialogContent>
  );
};

export default ShortcutDialog;

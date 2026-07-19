import React from "react";

// ─── Shared, presentational atoms used by both Run Code and Submit Code
// result views. Colors that vary per submission status are always passed
// in via style={} props (raw hex from getStatusConfig), never built as
// dynamic Tailwind class strings — see the note in getStatusConfig.ts.

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
      {children}
    </p>
  );
}

// Bright, high-contrast red for genuine wrong-answer diffs — intentionally
// NOT the theme's --destructive token, which is a very dark, desaturated
// maroon (#7a161b in dark mode) tuned for subtle UI chrome, not for
// legible body text against a dark card background.
const WRONG_ANSWER_RED = "#EF4444";

export function PlainCodeBlock({
  children,
  variant = "default",
  accentColor,
}: {
  children: React.ReactNode;
  variant?: "default" | "error" | "wrong";
  // Optional override so an "error" block can match the status color of
  // whichever container it's sitting in (e.g. orange for a Compilation
  // Error box) instead of always defaulting to red. "wrong" (a genuine
  // wrong-answer output diff) ignores this and always stays red.
  accentColor?: string;
}) {
  const isWrong = variant === "wrong";
  const isError = variant === "error";
  const color = isWrong ? WRONG_ANSWER_RED : (accentColor ?? WRONG_ANSWER_RED);

  if (!isWrong && !isError) {
    return (
      <pre className="rounded-lg px-3 py-2.5 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words overflow-x-auto bg-secondary border border-border/10 text-foreground">
        {children}
      </pre>
    );
  }

  return (
    <pre
      className="rounded-lg px-3 py-2.5 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words overflow-x-auto border"
      style={{
        background: `${color}14`, // ~8% alpha
        borderColor: `${color}40`, // ~25% alpha
        color,
      }}
    >
      {children}
    </pre>
  );
}

export function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs bg-secondary border border-border/10 px-2.5 py-1 rounded-md">
      <span className="text-muted-foreground">{label}</span>
      <strong className="font-medium text-foreground">{value}</strong>
    </div>
  );
}

export function Divider() {
  return <div className="w-full h-px bg-border/10" />;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMemoryMB(mb: number | null | undefined): string | null {
  if (mb == null || Number.isNaN(mb)) return null;
  return mb.toFixed(1) + " MB";
}

export function formatMemoryKB(kb: number | null | undefined): string | null {
  if (kb == null || Number.isNaN(kb)) return null;
  return (kb / 1024).toFixed(1) + " MB";
}

export function formatRuntimeSeconds(
  s: string | null | undefined,
): string | null {
  if (s == null) return null;
  const parsed = parseFloat(s);
  if (Number.isNaN(parsed)) return null;
  return Math.round(parsed * 1000) + "ms";
}

// ─── Metadata footer — a row of label/value pairs, used at the bottom of
// both Run and Submit result cards.

export type MetaItem = { label: string; value: string };

export function MetadataFooter({ items }: { items: MetaItem[] }) {
  if (!items.length) return null;
  return (
    <div className="flex gap-x-6 gap-y-3 pt-3.5 border-t border-border/10 flex-wrap">
      {items.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <span className="text-[13px] font-medium text-foreground">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

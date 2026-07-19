import React from "react";
import { motion } from "framer-motion";
import type { StatusCfg } from "@/lib/share/getStatusConfig";
import { STATUS_ICON_MAP } from "./statusIcons";

type StatusHeaderProps = {
  cfg: StatusCfg;
  subtitle?: string; // overrides cfg.subtitleText when provided (e.g. "Failed on testcase 17 of 214")
  langLabel: string;
  compact?: boolean; // Run Code uses compact:true — see pixel-budget note below
  failBadge?: string | null; // e.g. "Failed on test case 12 of 57"
};

// Run Code renders inside a panel that defaults to only ~7% of the
// right-column height (see ResizablePanels.tsx), expanding to just 40%
// when triggered — never the full viewport. `compact` keeps the hero to a
// single-line label instead of Submit Code's larger multi-line treatment,
// so it never assumes generous vertical space it won't reliably have.
export function StatusHeader({
  cfg,
  subtitle,
  langLabel,
  compact = false,
  failBadge = null,
}: StatusHeaderProps) {
  const Icon = STATUS_ICON_MAP[cfg.icon];

  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-border/10 ${
        compact ? "px-4 py-3" : "px-5 py-4"
      }`}
      style={{ borderLeft: `3px solid ${cfg.accentColor}` }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div
          className={`flex-shrink-0 rounded-lg flex items-center justify-center ${
            compact ? "w-7 h-7" : "w-[30px] h-[30px]"
          }`}
          style={{ background: cfg.softBg, color: cfg.accentColor }}
        >
          <Icon size={compact ? 15 : 17} strokeWidth={2.3} />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className={`font-semibold tracking-tight leading-tight ${
              compact ? "text-sm" : "text-[17px]"
            }`}
            style={{ color: cfg.accentColor }}
          >
            {cfg.label}
          </span>
          <span className="text-[11.5px] text-muted-foreground leading-snug">
            {subtitle ?? cfg.subtitleText}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border/15 bg-secondary text-muted-foreground">
          {langLabel}
        </span>
        {failBadge && (
          <span
            className="text-[11px] px-2.5 py-1 rounded-md border"
            style={{
              background: cfg.softBg,
              color: cfg.accentColor,
              borderColor: `${cfg.accentColor}33`,
            }}
          >
            {failBadge}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Staggered entrance wrapper ─────────────────────────────────────────────
// Used to wrap each major section of a result card (hero, perf cards, chart,
// accordion...) so they rise in with a small cascading delay rather than
// all appearing at once. Total sequence stays under ~300ms end-to-end.

const RISE_VARIANTS = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

export function RiseIn({
  children,
  order = 0,
  className,
}: {
  children: React.ReactNode;
  order?: number; // 0, 1, 2... controls stagger delay
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={RISE_VARIANTS}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.28, ease: "easeOut", delay: order * 0.06 }}
    >
      {children}
    </motion.div>
  );
}

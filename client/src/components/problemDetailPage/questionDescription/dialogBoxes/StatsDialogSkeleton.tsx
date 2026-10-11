"use client";

import React from "react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabPanel, TabPanels } from "./StatsTabPanels";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton for StatsDialog.
//
// Every block below mirrors the markup of the real component: same wrappers,
// same classes, same fixed line boxes. Text is replaced by a bone that sits
// inside a slot with the exact height of the line it stands in for, so nothing
// moves when the real data replaces it.
//
// Keep this file in sync with StatsDialog.tsx. It shows the fully populated
// layout (3 rings, 4 stat cards, 4 languages, 2 performance cards).
//
// StatsDialogSkeleton renders the *contents* of the dialog (header + tabs) and
// must be placed inside the same <DialogContent> the loaded dialog uses, so the
// dialog and its overlay stay mounted when the data replaces the skeleton.
// ─────────────────────────────────────────────────────────────────────────────

export type StatsTab = "overview" | "languages" | "performance";

// Left-to-right order of the tabs; decides which way the panels slide
export const STATS_TAB_ORDER: readonly StatsTab[] = [
  "overview",
  "languages",
  "performance",
];

type StatsDialogSkeletonProps = {
  tab: StatsTab;
  onTabChange: (tab: StatsTab) => void;
};

// Pulse is applied to each bone, never to a wrapper: globals.css gives
// `.dark .animate-pulse` a background fill, which would paint a box behind
// whatever it wraps. The inline `background` on every bone overrides that fill.
const PULSE = "animate-pulse";

// A translucent wash of the foreground colour: reads on every card/background
// in both themes (the project's colour tokens do not support `/opacity`).
const BONE = "color-mix(in srgb, var(--foreground) 12%, transparent)";

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`${PULSE} shrink-0 rounded ${className}`}
    style={{ background: BONE }}
  />
);

// Fixed-height line box (same height as the text line it replaces) holding a
// bone. `justify` keeps left / right aligned text where it sits in the data.
const Line: React.FC<{
  box: string;
  bone: string;
  justify?: "start" | "center" | "end";
}> = ({ box, bone, justify = "center" }) => (
  <div
    className={`flex items-center ${box} ${
      justify === "start"
        ? "justify-start"
        : justify === "end"
          ? "justify-end"
          : "justify-center"
    }`}
  >
    <Bone className={bone} />
  </div>
);

// ── Overview ─────────────────────────────────────────────────────────────────

const RingSkeleton: React.FC = () => (
  <div className="flex w-32 flex-col items-center gap-1.5">
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="10"
          className={PULSE}
          style={{ stroke: BONE }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Bone className="h-4 w-14" />
      </div>
    </div>
    {/* label: text-sm leading-tight */}
    <Line box="h-[17.5px] w-full" bone="h-3.5 w-16" />
    {/* caption: reserved two lines of text-[11px] leading-tight */}
    <div className="flex h-[27.5px] w-full flex-col items-center justify-center gap-1">
      <Bone className="h-2.5 w-24" />
      <Bone className="h-2.5 w-16" />
    </div>
  </div>
);

const StatCardSkeleton: React.FC<{ hint?: boolean }> = ({ hint = false }) => (
  <div className="flex flex-col items-center gap-1 rounded-lg border bg-secondary p-3 text-center">
    <Bone className="h-5 w-5 rounded-full" />
    {/* value: text-2xl leading-tight */}
    <Line box="h-[30px] w-full" bone="h-6 w-14" />
    {/* label: text-xs */}
    <Line box="h-4 w-full" bone="h-3 w-28" />
    {/* hint: text-[11px] leading-tight */}
    {hint && <Line box="h-[13.75px] w-full" bone="h-2.5 w-24" />}
  </div>
);

const OverviewSkeleton: React.FC = () => (
  <>
    <div className="flex items-start justify-center gap-4 py-1 sm:gap-8">
      <RingSkeleton />
      <RingSkeleton />
      <RingSkeleton />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton hint />
      <StatCardSkeleton hint />
    </div>
  </>
);

// ── Shared section title ─────────────────────────────────────────────────────

const SectionTitleSkeleton: React.FC = () => (
  <div className="mb-2 flex items-center justify-between">
    <div className="flex h-5 items-center gap-2">
      <Bone className="h-4 w-4 rounded-full" />
      <Bone className="h-3.5 w-32" />
    </div>
    <Bone className="h-3 w-28" />
  </div>
);

// ── Languages ────────────────────────────────────────────────────────────────

const LanguageRowSkeleton: React.FC = () => (
  <div className="flex flex-col gap-1">
    <div className="flex h-4 items-center justify-between">
      <Bone className="h-3 w-12" />
      <Bone className="h-3 w-28" />
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full">
      <div
        className={`${PULSE} h-full w-full rounded-full`}
        style={{ background: BONE }}
      />
    </div>
    <Line box="h-[16.5px] w-full" bone="h-2.5 w-32" justify="start" />
  </div>
);

const LanguagesSkeleton: React.FC = () => (
  <>
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="12"
            className={PULSE}
            style={{ stroke: BONE }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* total: text-2xl leading-none */}
          <Line box="h-6 w-full" bone="h-5 w-12" />
          {/* "Submissions": mt-1 text-xs */}
          <div className="mt-1 flex h-4 w-full items-center justify-center">
            <Bone className="h-3 w-20" />
          </div>
        </div>
      </div>

      <ul className="flex min-w-[10rem] flex-1 flex-col gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="flex h-5 items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className={`${PULSE} h-2.5 w-2.5 shrink-0 rounded-full`}
                style={{ background: BONE }}
              />
              <Bone className="h-3.5 w-16" />
            </span>
            <Bone className="h-3.5 w-10" />
          </li>
        ))}
      </ul>
    </div>

    <div>
      <SectionTitleSkeleton />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <LanguageRowSkeleton key={i} />
        ))}
      </div>
    </div>
  </>
);

// ── Performance ──────────────────────────────────────────────────────────────

const MetricSkeleton: React.FC = () => (
  <div className="rounded-lg border bg-secondary p-4">
    <SectionTitleSkeleton />
    <div>
      <div className="relative h-6">
        <div
          className={`${PULSE} absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full`}
          style={{ background: BONE }}
        />
        <div
          className={`${PULSE} absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full`}
          style={{ left: "22%", background: BONE }}
        />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col">
            {/* value: text-sm */}
            <Line box="h-5 w-full" bone="h-3.5 w-12" />
            {/* label: text-[11px] */}
            <Line box="h-[16.5px] w-full" bone="h-2.5 w-10" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PerformanceSkeleton: React.FC = () => (
  <>
    <MetricSkeleton />
    <MetricSkeleton />
    {/* footnote: two lines of text-[11px] */}
    <div className="flex h-[33px] flex-col items-center justify-center gap-1.5">
      <Bone className="h-2.5 w-[92%]" />
      <Bone className="h-2.5 w-[38%]" />
    </div>
  </>
);

// ── Full dialog ──────────────────────────────────────────────────────────────

const StatsDialogSkeleton: React.FC<StatsDialogSkeletonProps> = ({
  tab,
  onTabChange,
}) => (
  <>
    <DialogHeader>
      <DialogTitle className="m-0 flex justify-center p-0">
        <span className="flex justify-center text-4xl">Statistics</span>
      </DialogTitle>
      <DialogDescription className="text-md m-2 flex items-center justify-center">
        How the community is performing on this problem
      </DialogDescription>
    </DialogHeader>

    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as StatsTab)}
      className="w-full"
      aria-busy="true"
    >
      <TabsList className="grid h-11 w-full grid-cols-3 gap-1 p-1.5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="languages">Languages</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
      </TabsList>

      <TabPanels value={tab} order={STATS_TAB_ORDER}>
        <TabPanel value="overview" className="flex flex-col gap-4">
          <OverviewSkeleton />
        </TabPanel>

        <TabPanel value="languages" className="flex flex-col gap-4">
          <LanguagesSkeleton />
        </TabPanel>

        <TabPanel value="performance" className="flex flex-col gap-5">
          <PerformanceSkeleton />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </>
);

export default StatsDialogSkeleton;

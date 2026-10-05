"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axiosInstance";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  CircleCheckBig,
  Cpu,
  Repeat,
  Target,
  Timer,
  Users,
} from "lucide-react";
import { toTwoDecimals } from "@/services/acceptanceRateService";
import { formatCount } from "@/services/countService";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type StatsDialogProps = {
  title: string;
  stats: {
    totalSolved: number;
    totalAttempts: number;
    acceptanceRate: number;
  };
};

type LanguageStat = {
  language: string;
  submissions: number;
  accepted: number;
  share: number;
  acceptanceRate: number;
  medianRuntime: number | null;
  medianMemory: number | null;
};

type ExtendedStats = {
  problemId: number;
  totalSubmissions: number;
  languages: LanguageStat[];
  solvers: {
    uniqueAttempters: number;
    uniqueSolvers: number;
    acceptedSubmissions: number;
    solveRate: number;
    acceptsPerSolver: number;
  };
  performance: {
    samples: number;
    runtime: {
      min: number;
      p25: number;
      median: number;
      p75: number;
      p90: number;
      max: number;
    };
    memory: { min: number; median: number; p90: number; max: number };
  } | null;
  attemptsToAccept: {
    solvers: number;
    average: number;
    median: number;
    firstTrySolvers: number;
    firstTryRate: number;
  } | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const LANGUAGE_META: Record<string, { label: string; color: string }> = {
  cpp: { label: "C++", color: "#3b82f6" },
  python: { label: "Python", color: "#eab308" },
  java: { label: "Java", color: "#f97316" },
  javascript: { label: "JavaScript", color: "#10b981" },
};
const FALLBACK_COLORS = ["#a855f7", "#ec4899", "#14b8a6", "#64748b"];

const languageMeta = (language: string, index: number) =>
  LANGUAGE_META[language] ?? {
    label: language,
    color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  };

const clampPercent = (value: number) =>
  Math.min(100, Math.max(0, Number(value) || 0));

const rateColor = (rate: number) =>
  rate >= 60
    ? "text-green-500"
    : rate >= 30
      ? "text-yellow-400"
      : "text-red-500";

// One decimal at most, then run through formatCount like every other number
const oneDecimal = (n: number) => Math.round((Number(n) || 0) * 10) / 10;

const formatRuntime = (ms: number) => `${formatCount(Math.round(ms))} ms`;

const formatMemory = (mb: number) =>
  mb < 0.1 ? "< 0.1 MB" : `${formatCount(oneDecimal(mb))} MB`;

// ─────────────────────────────────────────────────────────────────────────────
// Reusable pieces
// ─────────────────────────────────────────────────────────────────────────────

type RingProps = {
  value: number;
  animated: boolean;
  colorClass: string;
  label: string;
  caption: string;
  display?: string;
};

// All rings share one size so they line up as a row
const Ring: React.FC<RingProps> = ({
  value,
  animated,
  colorClass,
  label,
  caption,
  display,
}) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = clampPercent(value);
  const offset = circumference * (1 - (animated ? pct : 0) / 100);

  return (
    <div className="flex w-32 flex-col items-center gap-1.5">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-secondary"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`stroke-current transition-all duration-700 ease-out ${colorClass}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold leading-none">
            {display ?? `${toTwoDecimals(pct)}%`}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium leading-tight">{label}</span>
      <span className="text-center text-[11px] leading-tight text-muted-foreground">
        {caption}
      </span>
    </div>
  );
};

type StatCardProps = {
  icon: React.ReactNode;
  value: string;
  label: string;
  hint?: string;
};

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, hint }) => (
  <div className="flex flex-col items-center gap-1 rounded-lg border bg-secondary p-3 text-center">
    {icon}
    <span className="text-2xl font-semibold leading-tight">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
    {hint && (
      <span className="text-[11px] leading-tight text-muted-foreground">
        {hint}
      </span>
    )}
  </div>
);

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  children: React.ReactNode;
  aside?: string;
}> = ({ icon, children, aside }) => (
  <div className="mb-2 flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm font-semibold">
      {icon}
      {children}
    </div>
    {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
  </div>
);

// ── Language donut ───────────────────────────────────────────────────────────

const LanguageDonut: React.FC<{
  languages: LanguageStat[];
  total: number;
  animated: boolean;
}> = ({ languages, total, animated }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const gap = languages.length > 1 ? 2 : 0;

  let consumed = 0;
  const segments = languages.map((l, i) => {
    const fraction = total > 0 ? l.submissions / total : 0;
    const length = Math.max(0, fraction * circumference - gap);
    const segment = {
      key: l.language,
      color: languageMeta(l.language, i).color,
      length,
      offset: -consumed,
    };
    consumed += fraction * circumference;
    return segment;
  });

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="12"
          className="stroke-secondary"
        />
        {segments.map((s) => (
          <circle
            key={s.key}
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="12"
            stroke={s.color}
            strokeDasharray={`${animated ? s.length : 0} ${circumference}`}
            strokeDashoffset={s.offset}
            className="transition-all duration-700 ease-out"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none">
          {formatCount(total)}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">Submissions</span>
      </div>
    </div>
  );
};

// ── Range track (min → max with percentile markers) ──────────────────────────

type RangeTrackProps = {
  min: number;
  max: number;
  median: number;
  p90: number;
  bandStart?: number;
  bandEnd?: number;
  barClass: string;
  format: (value: number) => string;
  animated: boolean;
  // Runtimes are heavily right-skewed; a log scale keeps the markers readable
  logScale?: boolean;
};

const RangeTrack: React.FC<RangeTrackProps> = ({
  min,
  max,
  median,
  p90,
  bandStart,
  bandEnd,
  barClass,
  format,
  animated,
  logScale = false,
}) => {
  const scale = (v: number) => (logScale ? Math.log1p(Math.max(0, v)) : v);
  const span = scale(max) - scale(min);
  const pos = (v: number) =>
    span > 0 ? clampPercent(((scale(v) - scale(min)) / span) * 100) : 50;

  const bandLeft = bandStart !== undefined ? pos(bandStart) : 0;
  const bandRight = bandEnd !== undefined ? pos(bandEnd) : pos(p90);

  return (
    <div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-background" />
        <div
          className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full opacity-40 transition-all duration-700 ease-out ${barClass}`}
          style={{
            left: `${animated ? bandLeft : 50}%`,
            width: `${animated ? Math.max(bandRight - bandLeft, 1.5) : 0}%`,
          }}
          title={
            bandStart !== undefined ? "Middle 50% of solutions" : undefined
          }
        />
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded bg-muted-foreground transition-all duration-700 ease-out"
          style={{ left: `${animated ? pos(p90) : 50}%` }}
          title={`90th percentile: ${format(p90)}`}
        />
        <div
          className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow transition-all duration-700 ease-out ${barClass}`}
          style={{ left: `${animated ? pos(median) : 50}%` }}
          title={`Median: ${format(median)}`}
        />
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
        {[
          { label: "Fastest", value: min },
          { label: "Median", value: median },
          { label: "P90", value: p90 },
          { label: "Slowest", value: max },
        ].map((item) => (
          <div key={item.label} className="flex flex-col">
            <span className="text-sm font-semibold">{format(item.value)}</span>
            <span className="text-[11px] text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Loading skeleton ─────────────────────────────────────────────────────────

const Pulse: React.FC<{ className: string }> = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-secondary ${className}`} />
);

const StatsSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3">
    <div className="grid grid-cols-2 gap-3">
      <Pulse className="h-24" />
      <Pulse className="h-24" />
    </div>
    <Pulse className="h-20" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Dialog
// ─────────────────────────────────────────────────────────────────────────────

const StatsDialog: React.FC<StatsDialogProps> = ({ title, stats }) => {
  const rate = clampPercent(stats?.acceptanceRate);

  // Start empty, then fill after mount so rings and bars animate on open
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const [extended, setExtended] = useState<ExtendedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await axios.get<ExtendedStats>(
          `${API_URL}/problem/problemStats`,
          { params: { title } },
        );
        if (!cancelled) setExtended(response.data);
      } catch (error) {
        console.error("Error fetching problem stats:", error);
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [title]);

  const hasSubmissions = (extended?.totalSubmissions ?? 0) > 0;
  const hasLanguages = (extended?.languages.length ?? 0) > 0;
  const hasPerformance = !!extended?.performance;

  const firstTryColor = useMemo(
    () => rateColor(extended?.attemptsToAccept?.firstTryRate ?? 0),
    [extended],
  );

  return (
    <DialogContent className="flex max-h-[90vh] max-w-xl flex-col gap-3 overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="m-0 flex justify-center p-0">
          <span className="flex justify-center text-4xl">Statistics</span>
        </DialogTitle>
        <DialogDescription className="text-md m-2 flex items-center justify-center">
          How the community is performing on this problem
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="languages" disabled={!hasLanguages}>
            Languages
          </TabsTrigger>
          <TabsTrigger value="performance" disabled={!hasPerformance}>
            Performance
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex flex-col gap-4">
          <div className="flex items-start justify-center gap-4 py-1 sm:gap-8">
            <Ring
              value={rate}
              animated={animated}
              colorClass={rateColor(rate)}
              label="Acceptance"
              caption="of all submissions passed"
            />

            {extended && hasSubmissions && (
              <Ring
                value={extended.solvers.solveRate}
                animated={animated}
                colorClass="text-blue-500"
                label="Solve rate"
                caption={`${formatCount(extended.solvers.uniqueSolvers)} of ${formatCount(extended.solvers.uniqueAttempters)} people who tried`}
              />
            )}
            {extended?.attemptsToAccept && (
              <Ring
                value={extended.attemptsToAccept.firstTryRate}
                animated={animated}
                colorClass={firstTryColor}
                label="First-try"
                caption="of solvers passed on attempt #1"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Activity className="h-5 w-5 text-blue-500" />}
              value={formatCount(stats?.totalAttempts ?? 0)}
              label="Attempts"
            />
            <StatCard
              icon={<CircleCheckBig className="h-5 w-5 text-green-500" />}
              value={formatCount(stats?.totalSolved ?? 0)}
              label="Accepted submissions"
            />
            {extended && hasSubmissions && (
              <StatCard
                icon={<Users className="h-5 w-5 text-purple-500" />}
                value={formatCount(extended.solvers.uniqueSolvers)}
                label="Unique solvers"
                hint={
                  extended.solvers.uniqueSolvers > 0
                    ? `${formatCount(oneDecimal(extended.solvers.acceptsPerSolver))}× accepted per solver`
                    : undefined
                }
              />
            )}
            {extended?.attemptsToAccept && (
              <StatCard
                icon={<Repeat className="h-5 w-5 text-orange-500" />}
                value={formatCount(
                  oneDecimal(extended.attemptsToAccept.average),
                )}
                label="Avg. attempts to first accept"
                hint={`Median ${formatCount(oneDecimal(extended.attemptsToAccept.median))}`}
              />
            )}
          </div>

          {isLoading && <StatsSkeleton />}
          {hasError && (
            <p className="text-center text-xs text-muted-foreground">
              Detailed statistics are unavailable right now.
            </p>
          )}
          {!isLoading && !hasError && !hasSubmissions && (
            <p className="text-center text-xs text-muted-foreground">
              No submissions yet — detailed statistics will appear once people
              start solving this problem.
            </p>
          )}
        </TabsContent>

        {/* ── Languages ────────────────────────────────────────────── */}
        <TabsContent value="languages" className="flex flex-col gap-4">
          {extended && hasLanguages && (
            <>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <LanguageDonut
                  languages={extended.languages}
                  total={extended.totalSubmissions}
                  animated={animated}
                />
                <ul className="flex min-w-[10rem] flex-1 flex-col gap-1.5">
                  {extended.languages.map((l, i) => {
                    const meta = languageMeta(l.language, i);
                    return (
                      <li
                        key={l.language}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: meta.color }}
                          />
                          {meta.label}
                        </span>
                        <span className="font-semibold">{l.share}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <SectionTitle
                  icon={<Target className="h-4 w-4 text-green-500" />}
                  aside="accepted / submitted"
                >
                  Acceptance by language
                </SectionTitle>
                <div className="flex flex-col gap-3">
                  {extended.languages.map((l, i) => {
                    const meta = languageMeta(l.language, i);
                    return (
                      <div key={l.language} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{meta.label}</span>
                          <span className="text-muted-foreground">
                            {formatCount(l.accepted)} /{" "}
                            {formatCount(l.submissions)} ·{" "}
                            <span className="font-semibold text-foreground">
                              {l.acceptanceRate}%
                            </span>
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${animated ? clampPercent(l.acceptanceRate) : 0}%`,
                              backgroundColor: meta.color,
                            }}
                          />
                        </div>
                        {l.medianRuntime !== null && (
                          <span className="text-[11px] text-muted-foreground">
                            Median {formatRuntime(l.medianRuntime)}
                            {l.medianMemory !== null &&
                              ` · ${formatMemory(l.medianMemory)}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Performance ──────────────────────────────────────────── */}
        <TabsContent value="performance" className="flex flex-col gap-5">
          {extended?.performance && (
            <>
              <div className="rounded-lg border bg-secondary p-4">
                <SectionTitle
                  icon={<Timer className="h-4 w-4 text-blue-500" />}
                  aside={`${formatCount(extended.performance.samples)} accepted runs · log scale`}
                >
                  Runtime
                </SectionTitle>
                <RangeTrack
                  min={extended.performance.runtime.min}
                  max={extended.performance.runtime.max}
                  median={extended.performance.runtime.median}
                  p90={extended.performance.runtime.p90}
                  bandStart={extended.performance.runtime.p25}
                  bandEnd={extended.performance.runtime.p75}
                  barClass="bg-blue-500"
                  format={formatRuntime}
                  animated={animated}
                  logScale
                />
              </div>

              <div className="rounded-lg border bg-secondary p-4">
                <SectionTitle
                  icon={<Cpu className="h-4 w-4 text-purple-500" />}
                  aside={`${formatCount(extended.performance.samples)} accepted runs`}
                >
                  Memory
                </SectionTitle>
                <RangeTrack
                  min={extended.performance.memory.min}
                  max={extended.performance.memory.max}
                  median={extended.performance.memory.median}
                  p90={extended.performance.memory.p90}
                  barClass="bg-purple-500"
                  format={formatMemory}
                  animated={animated}
                />
              </div>

              <p className="text-center text-[11px] text-muted-foreground">
                The shaded band is the middle 50% of runtimes. Beat the median
                and you are ahead of half of accepted solutions.
              </p>
            </>
          )}
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
};

export default StatsDialog;

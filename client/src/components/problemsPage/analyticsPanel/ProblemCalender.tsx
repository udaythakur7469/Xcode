"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ActivityMap, toIso, useCalendarStore } from "@/features/calenderStore";
import CalendarInfoButton from "@/components/problemDetailPage/helperComponents/calenderGuide/CalenderInfoButton";

function heatStyle(count: number): React.CSSProperties {
  if (count === 0) return {};
  if (count <= 2) return { backgroundColor: "rgba(34,197,94,0.15)" };
  if (count <= 5) return { backgroundColor: "rgba(34,197,94,0.32)" };
  if (count <= 8) return { backgroundColor: "rgba(34,197,94,0.55)" };
  return { backgroundColor: "rgba(34,197,94,0.80)", color: "white" };
}

function CustomDayContent({
  date,
  activityMap,
  displayMonth,
}: {
  date: Date;
  activityMap: ActivityMap;
  displayMonth: Date;
}) {
  const iso = toIso(date);
  const activity = activityMap[iso];
  const count = activity?.solvedCount ?? 0;
  const hasPotd = activity?.hasPotdSolved ?? false;
  const hasRev = activity?.hasRevisionDue ?? false;
  const isOut = date.getMonth() !== displayMonth.getMonth();

  const tooltipParts: string[] = [];
  if (count > 0) tooltipParts.push(`${count} solved`);
  if (hasPotd) tooltipParts.push("⭐ POTD");
  if (hasRev) tooltipParts.push("🔁 Review");

  return (
    <span
      className="relative flex h-full w-full items-center justify-center rounded-md"
      style={isOut ? {} : heatStyle(count)}
      title={isOut ? undefined : tooltipParts.join("  ·  ") || "No activity"}
    >
      {date.getDate()}

      {!isOut && (hasPotd || hasRev) && (
        <span className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
          {hasPotd && (
            <span className="block h-[5px] w-[5px] rounded-full bg-yellow-400" />
          )}
          {hasRev && (
            <span className="block h-[5px] w-[5px] rounded-full bg-blue-400" />
          )}
        </span>
      )}
    </span>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: "single" | "range";
  onChange: (m: "single" | "range") => void;
}) {
  return (
    <div className="mb-2 flex rounded-md border border-border bg-muted p-0.5">
      {(["single", "range"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "flex-1 rounded-[5px] py-1 text-xs font-medium transition-all",
            mode === m
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m === "single" ? "Single" : "Range"}
        </button>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex flex-col gap-1 px-1 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>Less</span>
        {[
          "border border-border/40",
          "bg-green-900/40",
          "bg-green-700/50",
          "bg-green-600/70",
          "bg-green-500",
        ].map((cls, i) => (
          <span key={i} className={cn("h-2.5 w-2.5 rounded-sm", cls)} />
        ))}
        <span>More</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="block h-[5px] w-[5px] rounded-full bg-yellow-400" />
          POTD solved
        </span>
        <span className="flex items-center gap-1">
          <span className="block h-[5px] w-[5px] rounded-full bg-blue-400" />
          Revision due
        </span>
      </div>
    </div>
  );
}

const ProblemCalendar: React.FC = () => {
  const {
    calendarMode,
    setCalendarMode,
    selectedDate,
    selectedRange,
    activityMap,
    selectDate,
    selectRange,
    clearSelection,
    fetchActivityData,
  } = useCalendarStore();

  React.useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  const [displayMonth, setDisplayMonth] = React.useState<Date>(new Date());

  const handleSingleSelect = React.useCallback(
    (date: Date | undefined) => {
      if (!date) {
        clearSelection();
        return;
      }
      const iso = toIso(date);
      if (selectedDate === iso) {
        clearSelection();
        return;
      }
      selectDate(iso);
    },
    [selectedDate, selectDate, clearSelection],
  );

  const handleRangeSelect = React.useCallback(
    (range: DateRange | undefined) => {
      if (!range) {
        clearSelection();
        return;
      }
      selectRange({ from: range.from, to: range.to });
    },
    [selectRange, clearSelection],
  );

  const selectedSingle = React.useMemo<Date | undefined>(() => {
    if (!selectedDate) return undefined;
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const selectedRangePicker = React.useMemo<DateRange | undefined>(() => {
    const { from, to } = selectedRange;
    return from || to ? { from, to } : undefined;
  }, [selectedRange]);

  const DayContentRenderer = React.useCallback(
    (props: { date: Date }) => (
      <CustomDayContent
        date={props.date}
        activityMap={activityMap}
        displayMonth={displayMonth}
      />
    ),
    [activityMap, displayMonth],
  );

  const calendarClassName = "rounded-md border shadow";

  return (
    <div>
      <ModeToggle mode={calendarMode} onChange={setCalendarMode} />
      <div className="relative">
        {calendarMode === "single" ? (
          <Calendar
            mode="single"
            selected={selectedSingle}
            onSelect={handleSingleSelect}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            className={calendarClassName}
            components={{ DayContent: DayContentRenderer }}
          />
        ) : (
          <Calendar
            mode="range"
            selected={selectedRangePicker}
            onSelect={handleRangeSelect}
            month={displayMonth}
            onMonthChange={setDisplayMonth}
            className={calendarClassName}
            components={{ DayContent: DayContentRenderer }}
          />
        )}

        <CalendarInfoButton className="absolute -bottom-1.5 -right-0.5 z-10" />
      </div>

      <Legend />
    </div>
  );
};

export default ProblemCalendar;

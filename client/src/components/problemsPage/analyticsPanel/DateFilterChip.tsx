"use client";

import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDisplayDate, toIso, useCalendarStore } from "@/features/calenderStore";

const DateFilterChip: React.FC = () => {
  const { selectedDate, selectedRange, calendarMode, closeAnalyticsPanel } =
    useCalendarStore();

  const label = React.useMemo(() => {
    if (calendarMode === "single" && selectedDate) {
      return formatDisplayDate(selectedDate);
    }
    if (calendarMode === "range" && selectedRange.from && selectedRange.to) {
      return `${formatDisplayDate(toIso(selectedRange.from))} → ${formatDisplayDate(toIso(selectedRange.to))}`;
    }
    return null;
  }, [calendarMode, selectedDate, selectedRange]);

  return (
    <AnimatePresence>
      {label && (
        <motion.div
          key="date-chip"
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="mb-3"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400">
            {calendarMode === "single" ? <span>Problems solved on {label}</span> : <span>Problems solved during {label}</span>}
            <button
              onClick={closeAnalyticsPanel}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 transition-colors hover:bg-indigo-500/40"
              aria-label="Clear date filter"
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DateFilterChip;

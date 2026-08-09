import { ContestType } from "@prisma/client";

// ── Fixed cadence, agreed in the contest-system design discussion ─────────
//   Daily     — every day at 08:00
//   Weekly    — every Sunday at 20:00
//   Biweekly  — every other Wednesday at 20:00
//   Monthly   — the 1st of the month at 18:00
//
// How far ahead of startTime each type's Contest row (and its problem
// selection) should be generated, so it's visible/registerable on the
// home page before it goes live.
export const LOOKAHEAD_HOURS: Record<ContestType, number> = {
  DAILY: 24,
  WEEKLY: 48,
  BIWEEKLY: 48,
  MONTHLY: 24 * 7,
};

// Cron has no native concept of "every other week", so biweekly parity
// is tracked here against a fixed reference Wednesday instead of trying
// to express it in a cron pattern. Flip this date if you ever need to
// shift which Wednesdays are "on" weeks — it only has to be *a* past
// on-week Wednesday, not the first one ever run.
const BIWEEKLY_REFERENCE_WEDNESDAY = new Date("2026-07-01T20:00:00.000Z");

function isBiweeklyOnWeek(candidateWednesday: Date): boolean {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksSinceReference = Math.round(
    (candidateWednesday.getTime() - BIWEEKLY_REFERENCE_WEDNESDAY.getTime()) /
      msPerWeek,
  );
  return weeksSinceReference % 2 === 0;
}

function atTime(date: Date, hours: number, minutes = 0): Date {
  const d = new Date(date);
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

function nextWeekday(from: Date, targetDay: number): Date {
  // targetDay: 0 = Sunday, 3 = Wednesday, per Date#getUTCDay().
  const d = new Date(from);
  const diff = (targetDay - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** The next occurrence of `type`, strictly after `now`. */
export function getNextOccurrence(type: ContestType, now: Date): Date {
  switch (type) {
    case "DAILY": {
      let candidate = atTime(now, 8);
      if (candidate <= now) candidate.setUTCDate(candidate.getUTCDate() + 1);
      return candidate;
    }
    case "WEEKLY": {
      let candidate = atTime(nextWeekday(now, 0), 20);
      if (candidate <= now) candidate.setUTCDate(candidate.getUTCDate() + 7);
      return candidate;
    }
    case "BIWEEKLY": {
      let candidate = atTime(nextWeekday(now, 3), 20);
      if (candidate <= now) candidate.setUTCDate(candidate.getUTCDate() + 7);
      while (!isBiweeklyOnWeek(candidate)) {
        candidate.setUTCDate(candidate.getUTCDate() + 7);
      }
      return candidate;
    }
    case "MONTHLY": {
      let candidate = atTime(
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        18,
      );
      if (candidate <= now) {
        candidate = atTime(
          new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
          18,
        );
      }
      return candidate;
    }
  }
}

/** Whether the next occurrence of `type` falls within its lookahead window. */
export function isDueForGeneration(type: ContestType, now: Date): boolean {
  const next = getNextOccurrence(type, now);
  const lookaheadMs = LOOKAHEAD_HOURS[type] * 60 * 60 * 1000;
  return next.getTime() - now.getTime() <= lookaheadMs;
}

/** Deterministic slug for a type + startTime, used to dedupe generation. */
export function slugFor(type: ContestType, startTime: Date): string {
  const iso = startTime.toISOString().slice(0, 16).replace(/[-:T]/g, "");
  return `${type.toLowerCase()}-${iso}`;
}

export function titleFor(type: ContestType, startTime: Date, sequenceNumber: number): string {
  const label =
    type === "DAILY"
      ? "Daily Challenge"
      : type === "WEEKLY"
        ? "Weekly Contest"
        : type === "BIWEEKLY"
          ? "Biweekly Contest"
          : "Monthly Challenge";
  return `${label} #${sequenceNumber}`;
}

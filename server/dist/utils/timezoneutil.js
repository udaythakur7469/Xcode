/**
 * Timezone-aware date utilities.
 *
 * Problem this solves: "today" and "due today" should mean the user's
 * local calendar day, not the server's UTC calendar day. A user in
 * Asia/Kolkata (UTC+5:30) and a user in America/Los_Angeles (UTC-8)
 * can have very different ideas of what "today" is at the same instant.
 *
 * No external date library required — built on the native Intl API.
 */
/** Returns true if `tz` is a valid IANA timezone string (e.g. "Asia/Kolkata"). */
export function isValidTimeZone(tz) {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Offset (in ms) to ADD to a UTC instant to get the wall-clock time in the
 * given timezone. E.g. for "Asia/Kolkata" this is +5.5 hours worth of ms.
 */
function getTimezoneOffsetMs(instant, timeZone) {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const parts = dtf
        .formatToParts(instant)
        .reduce((acc, part) => {
        if (part.type !== "literal")
            acc[part.type] = part.value;
        return acc;
    }, {});
    // Interpret the local wall-clock fields as if they were UTC — the delta
    // between that and the real UTC instant IS the timezone offset.
    const wallClockAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    return wallClockAsUtc - instant.getTime();
}
/**
 * Given an instant and an IANA timezone, returns the UTC instants that
 * correspond to the start (00:00:00.000) and end (23:59:59.999) of that
 * *local calendar day*.
 *
 * Falls back to UTC if `timeZone` is missing/invalid, so this is always
 * safe to call even if the client didn't send one.
 */
export function getLocalDayBoundsUtc(instant, timeZone) {
    const tz = timeZone && isValidTimeZone(timeZone) ? timeZone : "UTC";
    const offsetMs = getTimezoneOffsetMs(instant, tz);
    // Shift the instant by the offset so reading its UTC-getters gives us
    // the local wall-clock Y/M/D.
    const localWallClock = new Date(instant.getTime() + offsetMs);
    const localMidnightLabeledAsUtc = Date.UTC(localWallClock.getUTCFullYear(), localWallClock.getUTCMonth(), localWallClock.getUTCDate(), 0, 0, 0, 0);
    // Shift back by the offset to get the real UTC instants.
    const startUtc = new Date(localMidnightLabeledAsUtc - offsetMs);
    const endUtc = new Date(localMidnightLabeledAsUtc + 86400000 - 1 - offsetMs);
    return { startUtc, endUtc, timeZoneUsed: tz };
}
/**
 * Returns the difference, in whole local calendar days, between two
 * instants (a - b), evaluated in the given timezone.
 * Positive = `a` is on a later local day than `b`.
 */
export function localDayDiff(a, b, timeZone) {
    const tz = timeZone && isValidTimeZone(timeZone) ? timeZone : "UTC";
    const offsetA = getTimezoneOffsetMs(a, tz);
    const offsetB = getTimezoneOffsetMs(b, tz);
    const localDayA = Math.floor((a.getTime() + offsetA) / 86400000);
    const localDayB = Math.floor((b.getTime() + offsetB) / 86400000);
    return localDayA - localDayB;
}

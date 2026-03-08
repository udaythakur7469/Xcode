/**
 * formatCount
 * Uses your existing countService format convention.
 * 532 → "532"  |  2345 → "2.3k"  |  2345678 → "2.3M"  |  2345678901 → "2.3B"
 */
export const formatCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1_000_000) {
    const thousands = count / 1000;
    return thousands % 1 === 0
      ? `${thousands}k`
      : `${thousands.toFixed(1).replace(/\.0$/, "")}k`;
  } else if (count < 1_000_000_000) {
    const millions = count / 1_000_000;
    return millions % 1 === 0
      ? `${millions}M`
      : `${millions.toFixed(1).replace(/\.0$/, "")}M`;
  } else {
    const billions = count / 1_000_000_000;
    return billions % 1 === 0
      ? `${billions}B`
      : `${billions.toFixed(1).replace(/\.0$/, "")}B`;
  }
};

/**
 * formatDate
 * Relative time string: "just now", "5m ago", "3h ago", "2d ago", or full date.
 */
export const formatDate = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};
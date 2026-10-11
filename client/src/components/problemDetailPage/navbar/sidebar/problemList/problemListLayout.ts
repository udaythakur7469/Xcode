// Shared layout rules for the Problem List rows and their skeletons.
//
// The skeleton rows and the real rows are built from the SAME grid classes
// and the same fixed height, so swapping one for the other when data
// arrives doesn't move a single pixel. If you change a row's columns or
// height, change it here - both components read from this file.

/**
 * The panel is resizable, so rows adapt to its current width:
 *   compact  <= 420px   difficulty collapses to a coloured dot
 *   regular  421-639px  id, title, difficulty
 *   wide     >= 640px   adds the problem's first topics
 */
export type ProblemListLayout = "compact" | "regular" | "wide";

export const COMPACT_MAX_WIDTH = 420;
export const WIDE_MIN_WIDTH = 640;

export const getLayoutForWidth = (width: number): ProblemListLayout =>
  width >= WIDE_MIN_WIDTH
    ? "wide"
    : width <= COMPACT_MAX_WIDTH
      ? "compact"
      : "regular";

// Fixed height (including the bottom border) - never derived from content.
export const ROW_BASE_CLASS = "grid h-[42px] items-center border-b px-3.5";

export const ROW_GRID_CLASS: Record<ProblemListLayout, string> = {
  compact: "grid-cols-[22px_34px_minmax(0,1fr)_14px] gap-x-1.5",
  regular: "grid-cols-[22px_40px_minmax(0,1fr)_70px] gap-x-2",
  wide: "grid-cols-[22px_44px_minmax(0,1.5fr)_minmax(0,1fr)_76px] gap-x-2",
};

export const SKELETON_TITLE_WIDTHS = [
  62, 78, 54, 70, 86, 48, 66, 74, 58, 82, 52, 68, 76, 60, 72,
];

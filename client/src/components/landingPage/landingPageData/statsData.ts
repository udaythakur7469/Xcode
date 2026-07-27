// ─────────────────────────────────────────────────────────────────────────
// Homepage stats — edit these 4 numbers once you have real figures.
// Every place that shows a stat (StatsSection) reads from here, so updating
// a number here updates it everywhere on the homepage automatically.
// ─────────────────────────────────────────────────────────────────────────
export const HOMEPAGE_STATS = {
  totalProblems: 500,
  activeUsers: 12000,
  submissionsJudged: 340000,
  aiInterviewsCompleted: 4200,
};

export type StatItem = {
  id: string;
  label: string;
  value: number;
  suffix: string;
};

export const STATS_LIST: StatItem[] = [
  { id: "problems", label: "Curated problems", value: HOMEPAGE_STATS.totalProblems, suffix: "+" },
  { id: "users", label: "Active learners", value: HOMEPAGE_STATS.activeUsers, suffix: "+" },
  { id: "submissions", label: "Submissions judged", value: HOMEPAGE_STATS.submissionsJudged, suffix: "+" },
  { id: "interviews", label: "AI interviews completed", value: HOMEPAGE_STATS.aiInterviewsCompleted, suffix: "+" },
];

// Difficulty distribution shown in the Product Preview section.
// barPercent is relative to the widest bar (Medium here) for the fill animation.
export const DIFFICULTY_STATS = [
  { id: "easy", label: "Easy", count: 180, barPercent: 62, colorVar: "var(--brand)" },
  { id: "medium", label: "Medium", count: 240, barPercent: 80, colorVar: "#f59e0b" },
  { id: "hard", label: "Hard", count: 80, barPercent: 27, colorVar: "#ef4444" },
];

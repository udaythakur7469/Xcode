export type FeatureDetail = {
  id: string;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel?: string;
  ctaRoute?: string;
};

export const FEATURE_DETAILS: FeatureDetail[] = [
  {
    id: "problem-database",
    tag: "📚 Problem Database",
    title: "Practice from a constantly growing problem set",
    description:
      "500+ problems curated from real technical interview rounds at top tech companies, tagged by topic, difficulty, and company — so your practice always matches what you're actually preparing for.",
    bullets: [
      "Filter by topic, difficulty, or company tag",
      "Fresh problems added regularly to reflect industry trends",
      "Bookmark and organize problems into custom lists",
    ],
    ctaLabel: "Browse Problems →",
    ctaRoute: "/problems",
  },
  {
    id: "code-editor",
    tag: "⌘ In-house Code Editor",
    title: "Write, run, and debug in a fast, focused editor",
    description:
      "A purpose-built code editor with real syntax highlighting, multi-language support, and instant judged execution — no context-switching between an IDE and a browser tab.",
    bullets: [
      "C++, Java, Python, and JavaScript support",
      "Real-time execution against hidden test cases",
      "Per-language runtime and memory benchmarking",
    ],
    ctaLabel: "Try the Editor →",
    ctaRoute: "/problems",
  },
  {
    id: "judging",
    tag: "⚡ Real-time Judged Execution",
    title: "Know exactly why a submission failed — not just that it did",
    description:
      "Every submission runs against real hidden test cases with fail-fast reporting. Compile errors, runtime errors, and time-limit-exceeded cases are each reported distinctly, so debugging is fast and precise.",
    bullets: [
      "Distinct verdicts: Accepted, Wrong Answer, TLE, MLE, Runtime Error",
      "Full test-case-by-test-case breakdown",
      "Complete submission history per problem",
    ],
  },
  {
    id: "mock-interviews",
    tag: "🎙 AI Mock Interviews",
    title: "Practice the interview, not just the problem",
    description:
      "Take full voice-based mock interviews powered by Vapi voice sessions. The AI interviewer asks a coding question, follows up on your reasoning, and gives structured feedback — just like a real interview panel would.",
    bullets: [
      "Live voice conversation, not just text prompts",
      "Follow-up questions based on your actual approach",
      "Structured feedback report after every session",
    ],
    ctaLabel: "Start a Mock Interview →",
    ctaRoute: "/interview",
  },
  {
    id: "nova-ai",
    tag: "✦ Nova AI Assistant",
    title: "Get unstuck without getting spoiled",
    description:
      "Nova is a RAG-based AI assistant grounded in your actual code and the problem context. It gives contextual hints and nudges your reasoning forward — it won't just hand you the full solution.",
    bullets: [
      "Understands your current code and past attempts",
      "Progressive hints instead of instant answers",
      "Available directly inside the problem editor",
    ],
  },
  {
    id: "revision-queue",
    tag: "⟳ Smart Revision Queue",
    title: "Make sure what you learn actually sticks",
    description:
      "Spaced-repetition scheduling resurfaces problems you've solved before, timed right before you're likely to forget the approach — with deduplication so you're never asked to revise the same thing twice in one queue.",
    bullets: [
      "Automatic scheduling based on spaced repetition",
      "Deduplicated queue — no repeat clutter",
      'One-click "mark as revised" from inside the editor',
    ],
  },
  {
    id: "discussions",
    tag: "💬 Community Discussions",
    title: "Learn from how others solved it too",
    description:
      "Every problem has its own discussion thread. Compare approaches, ask about edge cases, and see alternative solutions you might not have considered — all without leaving the problem page.",
    bullets: [
      "Per-problem discussion threads",
      "Upvote the most helpful explanations",
      "Share your own approach after solving",
    ],
  },
  {
    id: "analytics",
    tag: "📊 Progress Analytics",
    title: "See your consistency and strengths at a glance",
    description:
      "A GitHub-style activity heatmap tracks your daily solving streaks, while topic-wise analytics show exactly where you're strong and where you need more practice.",
    bullets: [
      "Daily activity heatmap across the full year",
      "Topic-wise strength breakdown",
      "Full submission history and streak tracking",
    ],
  },
];

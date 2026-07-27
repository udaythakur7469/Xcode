export type HomepageFeature = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export const HOMEPAGE_FEATURES: HomepageFeature[] = [
  {
    id: "judging",
    icon: "⌘",
    title: "Real-time Judged Execution",
    description:
      "Submit in C++, Java, Python, or JavaScript and get instant verdicts with detailed runtime and memory breakdowns.",
  },
  {
    id: "interviews",
    icon: "🎙",
    title: "AI Mock Interviews",
    description:
      "Practice full voice-based interviews with an AI interviewer that asks follow-ups and gives structured feedback.",
  },
  {
    id: "nova",
    icon: "✦",
    title: "Nova AI Assistant",
    description:
      "Stuck on a problem? Nova gives contextual hints grounded in your code, without just handing you the answer.",
  },
  {
    id: "revision",
    icon: "⟳",
    title: "Smart Revision Queue",
    description:
      "Spaced-repetition scheduling resurfaces problems right before you're likely to forget them.",
  },
  {
    id: "discussions",
    icon: "💬",
    title: "Community Discussions",
    description:
      "Compare approaches, ask questions, and learn from how others solved the same problem.",
  },
  {
    id: "analytics",
    icon: "📊",
    title: "Progress Analytics",
    description:
      "Track topic-wise strength, submission history, and streaks with a visual activity heatmap.",
  },
];

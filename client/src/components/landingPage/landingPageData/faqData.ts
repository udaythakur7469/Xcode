export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "free",
    question: "Is xCode free to use?",
    answer:
      "Yes — core problem solving, submissions, and the discussion board are free. Some AI-heavy features may have usage limits.",
  },
  {
    id: "languages",
    question: "Which languages are supported for submissions?",
    answer:
      "C++, Java, Python, and JavaScript are supported today, judged via an isolated Judge0-based execution pipeline.",
  },
  {
    id: "mock-interview",
    question: "How does the AI mock interview work?",
    answer:
      "You take a voice-based interview with an AI interviewer that asks a coding question, follow-ups, and gives structured feedback at the end.",
  },
  {
    id: "revision",
    question: "What is the Smart Revision Queue?",
    answer:
      "It's a spaced-repetition system that resurfaces problems you've solved before, timed just before you're likely to forget the approach.",
  },
  {
    id: "progress",
    question: "Can I track my progress over time?",
    answer:
      "Yes — an activity heatmap, topic-wise analytics, and full submission history are available on your profile.",
  },
];

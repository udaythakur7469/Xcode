import { ReactNode } from "react";
import { List, BookOpen, MonitorSmartphone } from "lucide-react";

type Data = {
  logo: ReactNode;
  title: string;
  description: string;
  footer: string;
};

const data: Data[] = [
  {
    logo: <List size={50} />,
    title: "Practice from a large database of problems",
    description:
      "Enhance your problem-solving skills with our ever-growing database of coding challenges, curated from recent technical interviews at top tech companies. Stay ahead with real-world problems, updated frequently to reflect industry trends.",
    footer: "Explore problems",
  },
  {
    logo: <BookOpen size={50} />,
    title: "Practice on our powerful in-house code editor",
    description:
      "Sharpen your coding skills with our advanced in-house code editor, meticulously designed to provide a seamless, intuitive, and efficient problem-solving environment. Experience real-time execution, intelligent debugging.",
    footer: "Practice problems",
  },
  {
    logo: <MonitorSmartphone size={50} />,
    title: "Get ready for interviews with our AI Mock Interview System",
    description:
      "Prepare yourself for real-world face-to-face interviews with the help of our advanced AI Mock Interview System, designed to simulate authentic interview scenarios and help you build confidence, refine your skills, and excel under pressure.",
    footer: "Practice Interviews",
  },
];

export const topicTags: string[] = [
  "array",
  "linked list",
  "stack",
  "hashmap",
  "Queues",
  "Trie",
  "Trees",
  "Graphs",
  "Heaps",
  "Sorting",
  "Searching",
  "Dynamic Programming",
  "Recursion",
  "Greedy Algorithms",
  "Backtracking",
  "Geometry",
  "Bit Manipulation",
  "Segment Tree",
  "string",
  "Math",
];

export const linkBadgeTitles: string[] = [
  "LinkedIn",
  "Github",
  "Personal site",
];

export const linkBadgeTextAreas: string[] = [
  "Add your LinkedIn URL",
  "Add your Github URL",
  "Add your site's URL",
];

export default data;

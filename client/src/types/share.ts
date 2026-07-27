export interface CodeExplanation {
  snippet: string;
  explanation: string;
}

export interface TestCaseRow {
  input: string;
  output: string;
  notes: string;
}

export interface VisualizationData {
  url: string;
  alt: string;
}

export interface AlternativeApproach {
  label: string;
  content: string;
}

export interface ParsedPostData {
  title: string;
  problemLink: string;
  intuition: string;
  approachSteps: string[];
  keyDecisions: string[];
  dataStructures: string[];
  algorithmFlow: string[];
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  language: string;
  exampleInput: string;
  exampleOutput: string;
  exampleExplanation: string;
  edgeCases: string[];
  relatedProblems: { name: string; url: string }[];
  summaryPoints: string[];
  // New extracted sections
  codeExplanation: CodeExplanation | null;
  testCases: TestCaseRow[];
  visualization: VisualizationData | null;
  alternativeApproaches: AlternativeApproach[];
  isTemplatePost: boolean; // false = freeform, formatters degrade gracefully
}

export type SmartSharePlatform = "medium" | "blog" | "notion" | "discussion";

export type SocialPlatform =
  | "linkedin"
  | "twitter"
  | "whatsapp"
  | "reddit"
  | "telegram"
  | "facebook";

export interface ShareWarning {
  message: string;
  severity: "warn" | "info";
}

export interface SmartShareOption {
  id: SmartSharePlatform;
  label: string;
  description: string;
  canAutoOpen: boolean;
  autoOpenUrl?: string;
  autoOpenLabel?: string;
}

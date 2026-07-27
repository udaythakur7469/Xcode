"use client";

import React from "react";
import FeatureDetailRow from "./FeatureDetailRow";
import { FeatureDetail } from "../explorePageData/featureDetailsData";
import {
  ProblemListPreview,
  CodeEditorPreview,
  VerdictBreakdownPreview,
  InterviewPreview,
  NovaChatPreview,
  RevisionQueuePreview,
  DiscussionPreview,
  AnalyticsPreview,
} from "../featurePreviews/FeaturePreviews";

const VISUALS_BY_ID: Record<string, React.ReactNode> = {
  "problem-database": <ProblemListPreview />,
  "code-editor": <CodeEditorPreview />,
  judging: <VerdictBreakdownPreview />,
  "mock-interviews": <InterviewPreview />,
  "nova-ai": <NovaChatPreview />,
  "revision-queue": <RevisionQueuePreview />,
  discussions: <DiscussionPreview />,
  analytics: <AnalyticsPreview />,
};

type FeatureDetailsSectionProps = {
  features: FeatureDetail[];
  startIndex?: number;
};

const FeatureDetailsSection: React.FC<FeatureDetailsSectionProps> = ({
  features,
  startIndex = 0,
}) => {
  return (
    <>
      {features.map((feature, offset) => {
        const index = startIndex + offset;
        return (
          <section
            key={feature.id}
            className={`py-20 ${index % 2 === 1 ? "border-y border-border bg-card" : ""}`}
          >
            <div className="max-w-[1280px] mx-auto px-6">
              <FeatureDetailRow
                feature={feature}
                reverse={index % 2 === 1}
                visual={VISUALS_BY_ID[feature.id]}
              />
            </div>
          </section>
        );
      })}
    </>
  );
};

export default FeatureDetailsSection;


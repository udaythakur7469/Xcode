import React from "react";
import Agent from "../helperComponents/Agent";
import InterviewPageShell from "../helperComponents/InterviewPageShell";

type InterviewGenerationProps = { type: string };

const InterviewGeneration: React.FC<InterviewGenerationProps> = ({ type }) => {
  return (
    <InterviewPageShell>
      <Agent type={type} />
    </InterviewPageShell>
  );
};
export default InterviewGeneration;

import React from "react";
import Agent from "../helperComponents/Agent";
import InterviewPageShell from "../helperComponents/InterviewPageShell";

type InterviewPracticeProps = { type: string; id: number | null };

const InterviewPractice: React.FC<InterviewPracticeProps> = ({ type, id }) => {
  return (
    <InterviewPageShell>
      <Agent type={type} id={id} />
    </InterviewPageShell>
  );
};
export default InterviewPractice;

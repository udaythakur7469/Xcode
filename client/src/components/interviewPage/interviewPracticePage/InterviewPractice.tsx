import React from "react";
import Agent from "../helperComponents/Agent";

type InterviewPracticeProps = { type: string; id: number | null };

const InterviewPractice: React.FC<InterviewPracticeProps> = ({ type, id }) => {
  return (
    <>
      <Agent type={type} id={id} />
    </>
  );
};
export default InterviewPractice;

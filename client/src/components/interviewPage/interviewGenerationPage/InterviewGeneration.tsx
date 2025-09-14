import React from "react";
import Agent from "../helperComponents/Agent";

type InterviewGenerationProps = { type: string };

const InterviewGeneration: React.FC<InterviewGenerationProps> = ({ type }) => {
  return (
    <>
      <Agent type={type} />
    </>
  );
};
export default InterviewGeneration;

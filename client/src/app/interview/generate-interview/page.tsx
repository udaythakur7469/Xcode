import React, { useEffect } from "react";
import InterviewGeneration from "@/components/interviewPage/interviewGenerationPage/InterviewGeneration";

type pageProps = {};

const page: React.FC<pageProps> = () => {
  return (
    <div>
      <InterviewGeneration type="generate" />
    </div>
  );
};
export default page;

import React from "react";
import InterviewGeneration from "@/components/interviewPage/interviewGenerationPage/InterviewGeneration";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Interview | Xcode",
};

type pageProps = {};

const page: React.FC<pageProps> = () => {
  return (
    <div>
      <InterviewGeneration type="generate" />
    </div>
  );
};
export default page;

import React, { Suspense } from "react";
import InterviewLandingPage from "@/components/interviewPage/landingPage/InterviewLandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Interviews | Xcode",
};

type pageProps = {};

const page: React.FC<pageProps> = () => {
  return (
    <Suspense fallback={null}>
      <InterviewLandingPage />
    </Suspense>
  );
};
export default page;

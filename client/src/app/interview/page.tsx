import React, { Suspense } from "react";
import InterviewLandingPage from "@/components/interviewPage/landingPage/InterviewLandingPage";

type pageProps = {};

const page: React.FC<pageProps> = () => {
  return (
    <Suspense fallback={null}>
      <InterviewLandingPage />
    </Suspense>
  );
};
export default page;

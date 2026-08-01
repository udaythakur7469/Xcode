"use client";

import React, { useEffect } from "react";
import FeedbackPage from "@/components/interviewPage/feedbackPage/FeedbackPage";
import { useInterviewStore } from "@/features/interviewStore";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/landingPage/navbar/Navbar";
import { FeedbackPageSkeleton } from "@/components/interviewPage/feedbackPage/FeedbackPageSkeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import InterviewAmbientBackground from "@/components/interviewPage/helperComponents/InterviewAmbientBackground";

type pageProps = { params: { id: string } };

const page: React.FC<pageProps> = ({ params }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const searchParams = useSearchParams();
  const source = searchParams.get("source") as "user" | "all" | null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const unwrappedParams = React.use(params);
  const { id } = unwrappedParams;

  if (!id) {
    return <div className="text-red-500 text-xl">Feedback not found</div>;
  }

  const {
    getFeedbackByInterviewId,
    getInterviewDetails,
    getFeedbackHistory,
    isLoadingFeedback,
    isLoadingInterviewDetails,
    interviewError,
    feedback,
    interview,
    feedbackHistory,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useInterviewStore();

  useDocumentTitle(
    interview?.role
      ? `Feedback: ${interview.role} | Xcode`
      : "Feedback | Xcode",
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (id) {
      const numericId = Number(id);
      getFeedbackByInterviewId(numericId, source);
      getInterviewDetails(numericId);
      // Fetch history for score chart + percentile — runs in parallel, non-blocking
      getFeedbackHistory(numericId);
    }
  }, [
    getFeedbackByInterviewId,
    id,
    source,
    getInterviewDetails,
    getFeedbackHistory,
  ]);

  if (interviewError) {
    return <div className="text-red-500 text-xl">{interviewError}</div>;
  }

  if (isLoadingFeedback && isLoadingInterviewDetails) {
    return <FeedbackPageSkeleton />;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background overflow-hidden">
      <InterviewAmbientBackground />
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <Navbar firstButton={"Explore Xcode"} secondButton={"Solve Problems"} />
        <FeedbackPage
          feedback={feedback}
          interview={interview}
          feedbackHistory={feedbackHistory}
        />
      </div>
    </div>
  );
};

export default page;

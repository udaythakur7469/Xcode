"use client";

import React, { useEffect } from "react";
import FeedbackPage from "@/components/interviewPage/feedbackPage/FeedbackPage";
import { useInterviewStore } from "@/features/interviewStore";
import { useSearchParams } from "next/navigation";
import { MoonLoader } from "react-spinners";
import Navbar from "@/components/landingPage/navbar/Navbar";

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
    isLoadingFeedback,
    isLoadingInterviewDetails,
    interviewError,
    feedback,
    interview,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useInterviewStore();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (id) {
      getFeedbackByInterviewId(Number(id), source);
      getInterviewDetails(Number(id));
    }
  }, [getFeedbackByInterviewId, id, source, getInterviewDetails]);

  if (interviewError) {
    return <div className="text-red-500 text-xl">{interviewError}</div>;
  }

  if (isLoadingFeedback && isLoadingInterviewDetails) {
    return (
      <div className="text-center flex justify-center items-center h-screen w-screen">
        <MoonLoader color="#ffffff" size={250} />
      </div>
    );
  }



  return (
    <div className="h-screen w-screen flex flex-col">
      <Navbar firstButton={"Explore Xcode"} secondButton={"Solve Problems"} />
      <FeedbackPage feedback={feedback} interview={interview} />
    </div>
  );
};
export default page;

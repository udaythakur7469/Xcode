"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { useInterviewAuthGuard } from "@/hooks/useInterviewAuthGuard";
import InterviewAuthDialogs from "@/components/interviewPage/helperComponents/InterviewAuthDialogs";

type HeroSectionProps = {};

const HeroSection: React.FC<HeroSectionProps> = () => {
  const {
    goToInterview,
    isLoginOpen,
    setIsLoginOpen,
    isSignupOpen,
    setIsSignupOpen,
    isForgotPasswordOpen,
    setIsForgotPasswordOpen,
    onSuccessfulAuth,
  } = useInterviewAuthGuard();

  const generateInterview = () => {
    goToInterview("/interview/generate-interview");
  };

  const takeToUserInterviewsSection = () => {
    const element = document.getElementById("user interviews");
    element?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  return (
    <>
      <div>
        <div className="bg-secondary rounded-lg ml-10 mr-10 mb-10 mt-5 p-2 flex flex-row justify-between items-start">
          {/* Text content - 60% width, aligned top-left */}
          <div className="flex flex-col justify-start items-start w-[60%]">
            <p className="text-6xl font-bold">
              Get Interview-Ready with <br />
              AI-Powered Practice <br /> & Feedback
            </p>
            <p className="text-4xl mt-16">
              Practice real interview questions & get <br />
              instant feedback
            </p>
          </div>

          {/* Image container - 40% width, aligned top-right */}
          <div className="flex justify-end items-start w-[40%] h-full">
            <div className="relative w-full h-full min-h-[400px]">
              <Image
                src="/robot.png"
                fill
                style={{ objectFit: "contain", objectPosition: "right top" }}
                alt="AI Interview Assistant"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center my-10">
          <Button
            variant="ghost"
            className="h-14 text-2xl rounded-full border w-full mx-32 font-bold"
            onClick={generateInterview}
          >
            Start an Interview
          </Button>
        </div>
        <div className="flex justify-center items-center my-3">
          <Button
            variant="ghost"
            className="border text-lg h-10 flex flex-row items-center justify-center mb-10"
            onClick={takeToUserInterviewsSection}
          >
            See all interviews
            <ArrowDown className="h-8 w-8" />
          </Button>
        </div>
      </div>
      {/* Auth dialogs — opened only if goToInterview finds the user unauthenticated */}
      <InterviewAuthDialogs
        isLoginOpen={isLoginOpen}
        setIsLoginOpen={setIsLoginOpen}
        isSignupOpen={isSignupOpen}
        setIsSignupOpen={setIsSignupOpen}
        isForgotPasswordOpen={isForgotPasswordOpen}
        setIsForgotPasswordOpen={setIsForgotPasswordOpen}
        onSuccessfulAuth={onSuccessfulAuth}
      />
    </>
  );
};

export default HeroSection;

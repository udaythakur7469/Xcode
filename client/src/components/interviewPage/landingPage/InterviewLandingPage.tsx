"use client";

import React from "react";
import HeroSection from "./heroSection/HeroSection";
import Interviews from "./Interviews/Interviews";
import Navbar from "@/components/landingPage/navbar/Navbar";
import InterviewAmbientBackground from "@/components/interviewPage/helperComponents/InterviewAmbientBackground";

type InterviewLandingPageProps = {};

const InterviewLandingPage: React.FC<InterviewLandingPageProps> = () => {
  return (
    <div className="relative bg-background w-screen overflow-hidden">
      <InterviewAmbientBackground />
      <div className="relative z-10">
        <Navbar buttons={["Explore Xcode", "Solve Problems"]} />
        <HeroSection />
        <Interviews />
      </div>
    </div>
  );
};
export default InterviewLandingPage;

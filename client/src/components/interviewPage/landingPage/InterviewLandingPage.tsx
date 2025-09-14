"use client";

import React from "react";
import HeroSection from "./heroSection/HeroSection";
import Interviews from "./Interviews/Interviews";
import Navbar from "@/components/landingPage/navbar/Navbar";

type InterviewLandingPageProps = {};

const InterviewLandingPage: React.FC<InterviewLandingPageProps> = () => {
  return (
    <div className="bg-background w-screen">
      <Navbar firstButton={"Explore Xcode"} secondButton={"Solve Problems"} />
      <HeroSection />
      <Interviews />
    </div>
  );
};
export default InterviewLandingPage;

"use client"

import React from "react";
import Navbar from "./navbar/Navbar";
import TitleSection from "./titleSection/TitleSection";
import HeroSection from "./heroSection/HeroSection";
import FeaturesSection from "./featuresSection/FeaturesSection";
import FooterPage from "./footerSection/FooterPage";

type LandingPageProps = {};

const LandingPage: React.FC<LandingPageProps> = () => {
  return (
    <div className="bg-background h-screen">
      <Navbar firstButton={"Explore Xcode"} secondButton={"Solve Problems"} />
      <TitleSection />
      <HeroSection />
      <FeaturesSection />
      <FooterPage />
    </div>
  );
};
export default LandingPage;

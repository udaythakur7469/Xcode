"use client";

import React, { Suspense } from "react";
import Navbar from "./navbar/Navbar";
import TitleSection from "./titleSection/TitleSection";
import HeroSection from "./heroSection/HeroSection";
import FeaturesSection from "./featuresSection/FeaturesSection";
import FooterPage from "./footerSection/FooterPage";

type LandingPageProps = {};

const LandingPage: React.FC<LandingPageProps> = () => {
  return (
    <div className="bg-background h-screen">
      <Suspense fallback={null}>
        <Navbar firstButton={"Explore Xcode"} secondButton={"Solve Problems"} />
      </Suspense>
      <TitleSection />
      <HeroSection />
      <FeaturesSection />
      <FooterPage />
    </div>
  );
};
export default LandingPage;

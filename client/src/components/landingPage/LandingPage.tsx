"use client";

import React from "react";
import Navbar from "./navbar/Navbar";
import HeroSection from "./heroSection/HeroSection";
import StatsSection from "./statsSection/StatsSection";
import FeaturesSection from "./featuresSection/FeaturesSection";
import LanguageMarquee from "./languageSection/LanguageMarquee";
import ProductPreviewSection from "./productPreviewSection/ProductPreviewSection";
import HowItWorksSection from "./howItWorksSection/HowItWorksSection";
import DifficultyNovaSection from "./difficultyNovaSection/DifficultyNovaSection";
import FAQSection from "./faqSection/FAQSection";
import TestimonialsSection from "./testimonialsSection/TestimonialsSection";
import CTASection from "./ctaSection/CTASection";
import FooterPage from "./footerSection/FooterPage";

type LandingPageProps = {};

const LandingPage: React.FC<LandingPageProps> = () => {
  return (
    <div className="bg-background min-h-screen">
      <div className="fixed top-0 inset-x-0 z-50">
        <Navbar
          firstButton={"Explore Xcode"}
          secondButton={"Solve Problems"}
          fixed
          variant="default"
        />
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse, var(--brand-glow) 0%, transparent 70%)",
          }}
        />

        <div className="pt-[30px]">
          <HeroSection />
        </div>
      </div>

      <StatsSection />
      <FeaturesSection />
      <ProductPreviewSection />
      <HowItWorksSection />
      <LanguageMarquee />
      <DifficultyNovaSection />
      <FAQSection />
      <TestimonialsSection />
      <CTASection />
      <FooterPage />
    </div>
  );
};
export default LandingPage;

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
      {/* Navbar is fixed so it stays visible for the entire page scroll.
          Kept as a sibling OUTSIDE the overflow-hidden background wrapper
          below — nesting a `fixed` element inside an `overflow-hidden`
          ancestor would clip it out of view as soon as you scroll past
          that ancestor's height, which defeats the point of a persistent
          navbar. Navbar's own component/props are untouched. */}
      <div className="fixed top-0 inset-x-0 z-50">
        <Navbar firstButton={"Explore Xcode"} secondButton={"Solve Problems"} />
      </div>

      {/* Shared top background — spans behind both the fixed navbar strip
          and the hero below it, so the green dot-grid + glow reads as one
          continuous background instead of stopping at the hero's edge.
          This div sits in normal document flow at the very top of the
          page, so it appears directly behind the fixed navbar above. */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid-bg pointer-events-none" />
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse, var(--brand-glow) 0%, transparent 70%)",
          }}
        />

        {/* Spacer matching the fixed navbar's rendered height (p-5 + h-[50px]
            Menubar = 20 + 50 + 20 = 90px) so hero content isn't hidden
            underneath it. */}
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

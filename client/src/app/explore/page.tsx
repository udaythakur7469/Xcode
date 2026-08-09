import React, { Suspense } from "react";
import { Metadata } from "next";
import Navbar from "@/components/landingPage/navbar/Navbar";
import FooterPage from "@/components/landingPage/footerSection/FooterPage";
import ExploreHero from "@/components/explorePage/heroSection/ExploreHero";
import FeatureDetailsSection from "@/components/explorePage/featureDetailSection/FeatureDetailsSection";
import TopicMarquee from "@/components/explorePage/topicMarquee/TopicMarquee";
import DifficultyBreakdownSection from "@/components/explorePage/difficultySection/DifficultyBreakdownSection";
import ExploreCTASection from "@/components/explorePage/ctaSection/ExploreCTASection";
import { FEATURE_DETAILS } from "@/components/explorePage/explorePageData/featureDetailsData";

export const metadata: Metadata = {
  title: "Explore | Xcode",
};

type pageProps = {};

const page: React.FC<pageProps> = () => {
  return (
    <Suspense fallback={null}>
      <div className="bg-background min-h-screen">
        <div className="fixed top-0 inset-x-0 z-50">
          <Navbar
            buttons={["Solve Problems", "Mock Interviews", "Contests"]}
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
            <ExploreHero />
          </div>
        </div>

        <FeatureDetailsSection features={[FEATURE_DETAILS[0]]} startIndex={0} />

        <TopicMarquee />

        <FeatureDetailsSection
          features={FEATURE_DETAILS.slice(1)}
          startIndex={1}
        />

        <DifficultyBreakdownSection />
        <ExploreCTASection />
        <FooterPage />
      </div>
    </Suspense>
  );
};
export default page;

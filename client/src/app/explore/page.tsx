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
      <Navbar
        firstButton={"Solve Problems"}
        secondButton={"Mock Interviews"}
        fixed
        variant="default"
      />

      {/* Fixed navbar takes itself out of flow — this spacer keeps the
          hero from rendering underneath it. Height matches the navbar's
          rendered height (p-5 wrapper + h-[50px] bar ≈ 90px); adjust this
          value if you change the navbar's padding/height. */}
      <div className="h-[90px]" />

      <ExploreHero />

      {/* First feature (Problem Database) rendered on its own so the
          topic marquee can sit directly beneath its "Browse Problems"
          button, matching the approved demo. */}
      <FeatureDetailsSection features={[FEATURE_DETAILS[0]]} startIndex={0} />

      <TopicMarquee />

      <FeatureDetailsSection
        features={FEATURE_DETAILS.slice(1)}
        startIndex={1}
      />

      <DifficultyBreakdownSection />
      <ExploreCTASection />
      <FooterPage />
    </Suspense>
  );
};
export default page;

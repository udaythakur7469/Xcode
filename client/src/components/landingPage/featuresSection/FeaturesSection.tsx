"use client";

import React from "react";
import FeatureCards from "../helperComponents/FeatureCards";
import { ArrowDown } from "lucide-react";
import data from "@/components/landingPage/landingPageData/data";
import { Button } from "../../ui/button";

type FeaturesSectionProps = {};

const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  const takeToFooterSection = () => {
    const element = document.getElementById("footer");
    element?.scrollIntoView({ behavior: "smooth", block: "end" });
  };
  return (
    <div id="featured" className="w-full h-screen flex flex-col">
      {/* Title Section */}
      <div className="flex flex-col items-center justify-center m-10 my-6 px-5">
        <p className="text-6xl font-bold py-5">Everything you need to Ace</p>
        <p className="text-6xl font-bold py-5">your Technical Interviews</p>
      </div>

      {/* Cards Section (Takes Remaining Space) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 px-10">
        {data.map((item, index) => (
          <FeatureCards
            key={index}
            logo={item.logo}
            title={item.title}
            description={item.description}
            footer={item.footer}
          />
        ))}
      </div>
      <div className="flex justify-center items-center">
        <Button
          variant="outline"
          className="m-5 p-7 text-lg border-2 border-white shadow"
          onClick={takeToFooterSection}
        >
          <ArrowDown /> Get Started
        </Button>
      </div>
    </div>
  );
};
export default FeaturesSection;

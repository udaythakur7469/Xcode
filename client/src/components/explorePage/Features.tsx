import React from "react";
import FeatureCards from "../landingPage/helperComponents/FeatureCards";
import data from "@/components/landingPage/landingPageData/data";

type FeaturesProps = {};

const Features: React.FC<FeaturesProps> = () => {
  return (
    <div className="w-full h-full flex flex-col py-8">
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
    </div>
  );
};
export default Features;

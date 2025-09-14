"use client";

import React from "react";
import TopSection from "./topSection/TopSection";
import MiddleSection from "./middleSection/MiddleSection";
import BottomSection from "./bottomSection/BottomSection";

const DiscussionSection: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full gap-2 px-3">
      <div className="h-[50px]">
        <TopSection />
      </div>
      <div className="h-[90px]">
        <MiddleSection />
      </div>
      <div className="flex-1">
        <BottomSection />
      </div>
    </div>
  );
};

export default DiscussionSection;

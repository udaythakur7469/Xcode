"use client";

import React from "react";
import TopSection from "./topSection/TopSection";
import MiddleSection from "./middleSection/MiddleSection";
import BottomSection from "./bottomSection/BottomSection";
import { usePostStore } from "@/features/postStore";
import { DiscussionSectionSkeleton } from "./DiscussionSectionSkeleton";

const DiscussionSection: React.FC = () => {
  const { isGettingPostCardData, isFetchingCombinedTags } = usePostStore();

  const isLoading = isGettingPostCardData || isFetchingCombinedTags;

  return (
    <div className="flex flex-col h-full w-full gap-2 px-3 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <DiscussionSectionSkeleton />
      )}

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

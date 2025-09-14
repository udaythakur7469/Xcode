"use client";

import React from "react";
import PostsTags from "./postsTags/PostsTags";
import ShareSolution from "./shareSolution/ShareSolution";

type MiddleSectionProps = {};

const MiddleSection: React.FC<MiddleSectionProps> = () => {
  return (
    <div className="flex flex-col h-full w-full gap-2">
      <div className="h-3/5 flex items-center select-none">
        <PostsTags />
      </div>
      <div className="h-2/5 w-full">
        <ShareSolution />
      </div>
    </div>
  );
};

export default MiddleSection;

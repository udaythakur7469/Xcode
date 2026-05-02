"use client";

import React from "react";
import { DraftPostData } from "@/features/postStore";

type DraftPostDropdownProps = {
  draftPosts: DraftPostData[];
  isGettingDraftPostData: boolean;
  draftPostError: any;
  onDraftClick: (draftId: string) => void;
  onClose?: () => void;
};

const DraftPostDropdown: React.FC<DraftPostDropdownProps> = ({
  draftPosts,
  isGettingDraftPostData,
  draftPostError,
  onDraftClick,
  onClose,
}) => {
  const truncateTitle = (title: string): string => {
    if (title.length > 30) {
      return title.substring(0, 30) + "...";
    }
    return title;
  };

  if (isGettingDraftPostData) {
    return <div>Loading drafts...</div>;
  }

  if (draftPostError) {
    return <div>Error loading drafts</div>;
  }

  return (
    <div className="relative">
      <div className="text-xl flex justify-center items-center mb-2">
        Saved Drafts
      </div>
      <div className="max-h-[180px] w-full pr-2 overflow-y-auto">
        <div className="space-y-3">
          {draftPosts.map((draftPost) => (
            <div
              className="h-full w-full py-1 px-2 bg-secondary rounded-md text-lg flex flex-row items-center justify-between"
              key={draftPost.id}
            >
              <div
                className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onDraftClick(draftPost.id.toString())}
              >
                {truncateTitle(draftPost.title)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DraftPostDropdown;

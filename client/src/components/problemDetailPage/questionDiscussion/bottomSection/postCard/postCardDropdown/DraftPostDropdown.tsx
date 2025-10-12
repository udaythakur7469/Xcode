import React from "react";
import { DraftPostData } from "@/features/postStore";
import { ScrollArea } from "@/components/ui/questionDiscussionScrollArea";

type DraftPostDropdownProps = {
  draftPosts: DraftPostData[];
  isGettingDraftPostData: boolean;
  draftPostError: any;
};

const DraftPostDropdown: React.FC<DraftPostDropdownProps> = ({
  draftPosts,
  isGettingDraftPostData,
  draftPostError,
}) => {
  const truncateTitle = (title: string): string => {
    if (title.length > 20) {
      return title.substring(0, 20) + "...";
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
    <ScrollArea className="h-[150px] w-full pr-2">
      <div className="space-y-3">
        {draftPosts.map((draftPost) => (
          <div
            className="h-full w-full py-1 px-2 bg-secondary rounded-xl cursor-pointer"
            key={draftPost.id}
          >
            {truncateTitle(draftPost.title)}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
export default DraftPostDropdown;

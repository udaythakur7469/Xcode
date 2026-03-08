import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ArrowLeft, Maximize, Minimize } from "lucide-react";
import { useCommentPanel } from "@/context/commentPanelContext";

type PostCommentsProps = {
  isMaximized: boolean;
  handleMaximizeMinimize: () => void;
};

const PostComments: React.FC<PostCommentsProps> = ({
  isMaximized,
  handleMaximizeMinimize,
}) => {
  const { setIsOpen } = useCommentPanel();
  return (
    <div className="h-full w-full bg-background">
      {/* Toolbar */}
      <div className="h-[40px] bg-secondary rounded-t-md flex flex-row justify-end px-1 items-center">
        <div className="flex justify-end mr-2 items-center">
          {/* Toggle between Maximize and Minimize icons */}
          {isMaximized ? (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Minimize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">Minimize</HoverCardContent>
            </HoverCard>
          ) : (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Maximize
                  className="ml-2 mr-2 cursor-pointer text-yellow-500 hover:text-yellow-600"
                  size={20}
                  onClick={handleMaximizeMinimize}
                />
              </HoverCardTrigger>
              <HoverCardContent className="mr-5 p-1">Maximize</HoverCardContent>
            </HoverCard>
          )}
        </div>
      </div>

      {/* Header — fixed, never scrolls */}
      <div className="flex items-center justify-start pb-1 mt-2 border-b shrink-0">
        <button
          onClick={() => setIsOpen(false)}
          className="flex flex-row items-center justify-center"
          aria-label="Close"
        >
          <ArrowLeft size={18} className="mx-1" />
          Back to editor
        </button>
      </div>
    </div>
  );
};
export default PostComments;

import React from "react";
import CommentTitle from "./commentTitle/CommentTitle";
import CommentResizablePanels from "./commentResizablePanels/CommentResizablePanels";
import CommentToolbar from "./commentToolbar/CommentToolbar";

type CommentBoxProps = {};

const CommentBox: React.FC<CommentBoxProps> = () => {
  return (
    <div className="bg-muted h-full w-full rounded-xl border-none flex flex-col">
      {/* Title: smaller height */}
      <div className="border-b rounded-t-xl flex-[2.5]">
        <CommentTitle />
      </div>

      {/* Toolbar: also small */}
      <div className="border-b flex-[0.5]">
        <CommentToolbar />
      </div>

      {/* Resizable panels: take rest of the space */}
      <div className="flex-[7] rounded-b-xl">
        <CommentResizablePanels />
      </div>
    </div>
  );
};

export default CommentBox;

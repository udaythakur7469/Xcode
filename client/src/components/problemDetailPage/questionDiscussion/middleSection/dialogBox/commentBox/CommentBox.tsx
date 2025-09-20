import React from "react";
import CommentTitle from "./commentTitle/CommentTitle";
import CommentToolbar from "./commentToolbar/CommentToolbar";
import CommentEditor from "./commentEditor/CommentEditor";

type CommentBoxProps = {};

const CommentBox: React.FC<CommentBoxProps> = () => {
  return (
    <div className="bg-muted h-full w-full rounded-xl border-none flex flex-col">
      {/* Title: smaller height */}
      <div className="border-b rounded-t-xl flex-[2.5] border">
        <CommentTitle />
      </div>

      {/* Toolbar: also small */}
      <div className="border-b flex-[0.5] border">
        <CommentToolbar />
      </div>

      {/* Resizable panels: take rest of the space */}
      <div className="flex-[7] rounded-b-xl border">
        <CommentEditor />
      </div>
    </div>
  );
};

export default CommentBox;

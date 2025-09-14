import React from "react";
import CommentDialogTitle from "./commentDialogTitle/CommentDialogTitle";
import CommentDialogTags from "./commentDialogTags/CommentDialogTags";
import CommentDialogButtons from "./commentDialogButtons/CommentDialogButtons";

type CommentTitleProps = {};

const CommentTitle: React.FC<CommentTitleProps> = () => {
  return (
    <div className="h-full w-full rounded-t-xl flex flex-row">
      <div className="h-full w-full rounded-tl-xl flex-[8] flex flex-col">
        <div className="rounded-tl-xl flex-[4]">
          <CommentDialogTitle />
        </div>
        <div className="flex-[6]">
          <CommentDialogTags />
        </div>
      </div>
      <div className="rounded-tr-xl flex-[2]">
        <CommentDialogButtons />
      </div>
    </div>
  );
};
export default CommentTitle;

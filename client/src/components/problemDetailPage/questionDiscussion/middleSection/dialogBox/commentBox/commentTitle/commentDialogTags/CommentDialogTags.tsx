import React from "react";
import AddNewTags from "./addNewTags.tsx/AddNewTags";
import NewlyAddedTags from "./newlyAddedTags/NewlyAddedTags";

type CommentDialogTagsProps = {};

const CommentDialogTags: React.FC<CommentDialogTagsProps> = () => {
  return (
    <div className="h-full w-full flex flex-row items-center justify-start ml-3">
      <div className="h-full w-auto flex flex-row items-center ml-3">
        <AddNewTags />
      </div>
      <div className="h-full w-full flex flex-row items-center">
        <NewlyAddedTags />
      </div>
    </div>
  );
};
export default CommentDialogTags;

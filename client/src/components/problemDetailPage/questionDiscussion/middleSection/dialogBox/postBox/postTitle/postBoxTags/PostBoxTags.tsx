import React, { useState } from "react";
import AddNewTags from "./addNewTags.tsx/AddNewTags";
import NewlyAddedTags from "./newlyAddedTags/NewlyAddedTags";

type PostBoxTagsProps = { selectedTags: string[]; setSelectedTags: () => void };

const PostBoxTags: React.FC<PostBoxTagsProps> = ({
  selectedTags,
  setSelectedTags,
}) => {
  const addTag = (tag: string) => {
    // Add tag only if it's not already selected
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="h-full w-full flex flex-row items-center justify-start ml-3">
      <div className="h-full w-auto flex flex-row items-center ml-3">
        <AddNewTags onAddTag={addTag} />
      </div>
      <div className="h-full w-full flex flex-row items-center">
        <NewlyAddedTags selectedTags={selectedTags} onRemoveTag={removeTag} />
      </div>
    </div>
  );
};
export default PostBoxTags;

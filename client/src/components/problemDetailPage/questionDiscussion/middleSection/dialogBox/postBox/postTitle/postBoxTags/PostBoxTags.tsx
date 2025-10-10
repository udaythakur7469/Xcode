import React from "react";
import AddNewTags from "./addNewTags.tsx/AddNewTags";
import NewlyAddedTags from "./newlyAddedTags/NewlyAddedTags";
import { useToast } from "@/hooks/use-toast";

type PostBoxTagsProps = {
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
};

const PostBoxTags: React.FC<PostBoxTagsProps> = ({
  selectedTags,
  setSelectedTags,
}) => {
  const { toast } = useToast();

  const addTag = (tag: string) => {
    // Add tag only if it's not already selected
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    } else {
      toast({
        title: "Tag already added!",
        description: "You’ve already added this tag.",
        duration: 2000,
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="h-full w-full flex flex-row items-center justify-start ml-3 select-none">
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

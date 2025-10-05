import React from "react";
import { X } from "lucide-react";

type PostTagsProps = {
  tag: string;
  onRemove: () => void;
};

const PostTags: React.FC<PostTagsProps> = ({ tag, onRemove }) => {
  return (
    <div className="bg-indigo-500 hover:bg-indigo-700 flex flex-row items-center cursor-default select-none rounded-3xl px-3 py-1 mr-1 transition-colors">
      <X
        className="h-4 w-4 mr-2 font-bold cursor-pointer rounded text-white"
        strokeWidth={3}
        onClick={onRemove}
      />
      <span className="text-white text-sm">{tag}</span>
    </div>
  );
};

export default PostTags;

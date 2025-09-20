import React from "react";
import { X } from "lucide-react";

type CommentTagsProps = {
  tag: string;
  onRemove: () => void;
};

const CommentTags: React.FC<CommentTagsProps> = ({ tag, onRemove }) => {
  return (
    <div className="bg-blue-600 hover:bg-blue-700 flex flex-row items-center rounded-3xl px-3 py-1 mr-1 transition-colors">
      <X
        className="h-4 w-4 mr-2 font-bold cursor-pointer hover:bg-blue-800 rounded text-white"
        strokeWidth={3}
        onClick={onRemove}
      />
      <span className="text-white text-sm">{tag}</span>
    </div>
  );
};

export default CommentTags;

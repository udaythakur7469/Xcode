import React from "react";
import { X } from "lucide-react";

type RenderedTagsProps = {
  tagName: string;
  onRemove: (tag: string) => void;
};

const RenderedTags: React.FC<RenderedTagsProps> = ({ tagName, onRemove }) => {
  return (
    <button
      className={`${
        tagName === "Deselect All" ? "bg-red-600" : "bg-indigo-600"
      } text-white font-semibold px-2 py-1 rounded-lg flex flex-row justify-center items-center gap-2 hover:${
        tagName === "Deselect All" ? "bg-red-700" : "bg-indigo-700"
      } transition-colors mb-4`}
      onClick={() => onRemove(tagName)} // Call onRemove when the button is clicked
    >
      <span>{tagName}</span>
      {tagName !== "Deselect All" && <X className="p-0 m-0" size={20} />}
    </button>
  );
};
export default RenderedTags;

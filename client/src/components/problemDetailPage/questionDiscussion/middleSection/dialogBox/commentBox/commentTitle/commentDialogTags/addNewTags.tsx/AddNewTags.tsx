import React, { useState } from "react";
import { CirclePlus } from "lucide-react";
import AddTagDialogBox from "../addTagDialogBox/AddTagDialogBox";

type AddNewTagsProps = { onAddTag: (tag: string) => void };

const AddNewTags: React.FC<AddNewTagsProps> = ({ onAddTag }) => {

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="w-auto rounded-3xl bg-primary-foreground px-3 py-2 mr-5 
                   border border-input text-sm flex flex-row items-center 
                   cursor-pointer select-none focus:outline-none focus:ring-1 
                   focus:ring-ring"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CirclePlus />
        <span className="ml-2 text-lg">Tag</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown content */}
          <div className="absolute top-full left-0 mt-1 z-20 min-w-[300px] max-h-96 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
            <AddTagDialogBox
              onAddTag={onAddTag}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AddNewTags;

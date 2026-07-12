import React, { forwardRef } from "react";

type TagsProps = {
  title: string;
  onTagClick?: (tagName: string) => void;
  isActive?: boolean;
  isDeselectAll?: boolean;
};

const Tags = forwardRef<HTMLDivElement, TagsProps>(
  ({ title, onTagClick, isActive = false, isDeselectAll = false }, ref) => {
    const handleClick = () => {
      if (onTagClick) {
        onTagClick(title);
      }
    };

    return (
      <div
        ref={ref}
        className={`w-auto flex justify-center items-center rounded-xl border px-2 py-1 cursor-pointer whitespace-nowrap transition-colors ${
          isDeselectAll
            ? "bg-red-600 text-white border-red-600"
            : isActive
              ? "bg-blue-500 text-white border-blue-600"
              : "bg-muted hover:bg-muted/80"
        }`}
        onClick={handleClick}
      >
        {title}
      </div>
    );
  },
);

Tags.displayName = "Tags";

export default Tags;

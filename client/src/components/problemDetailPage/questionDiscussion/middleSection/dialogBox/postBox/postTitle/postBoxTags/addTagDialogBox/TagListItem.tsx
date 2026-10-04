import React from "react";

type TagListItemProps = {
  tag: string;
  onSelect: (tag: string) => void;
};

const TagListItem: React.FC<TagListItemProps> = ({ tag, onSelect }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(tag);
  };

  return (
    <div
      className="px-3 py-2 hover:bg-accent cursor-pointer text-sm transition-colors rounded-lg"
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {tag}
    </div>
  );
};

export default TagListItem;

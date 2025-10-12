import React from "react";

type PostHeaderProps = {
  title: string;
  tags: { name: string }[];
};

const PostHeader: React.FC<PostHeaderProps> = ({ title, tags}) => {
  const displayTags = tags.slice(0, 5);
  const remainingTags = tags.length - 5;
  const hasMoreTags = tags.length > 5;

  return (
    <div className="mb-1">
      {/* Title */}
      <h2 className="text-lg font-bold text-white mb-1">{title}</h2>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {displayTags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-background text-gray-300 text-xs rounded"
          >
            {tag.name}
          </span>
        ))}
        {hasMoreTags && (
          <span className="px-2 py-1 bg-background text-gray-400 text-xs rounded">
            +{remainingTags}
          </span>
        )}
      </div>
    </div>
  );
};
export default PostHeader;

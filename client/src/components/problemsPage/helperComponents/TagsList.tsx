import React from "react";

type TagsListProps = {
  tags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
};

const TagsList: React.FC<TagsListProps> = ({
  tags,
  selectedTags,
  setSelectedTags,
}) => {
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove the tag if it's already selected
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      // Add the tag if it's not selected
      setSelectedTags([...selectedTags, tag]);
    }
  };
  return (
    <div>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => handleTagToggle(tag)}
          className={`${
            selectedTags.includes(tag) ? "bg-blue-600" : "bg-gray-700"
          } text-white m-1 p-2 rounded-lg`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};
export default TagsList;

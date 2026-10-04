import React, { useEffect, useRef, useState } from "react";
import { useTagSearch } from "@/hooks/useTagSearch";
import { TagsSectionSkeleton } from "./TagsSectionSkeleton";
import TagListItem from "./TagListItem";
import CustomTagOption from "./CustomTagOption";

type TagsSectionProps = {
  searchTerm: string;
  onAddTag: (tag: string) => void;
  error: string;
};

const TagsSection: React.FC<TagsSectionProps> = ({
  searchTerm,
  onAddTag,
  error,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const { filteredTags, isFetchingTag, tagFetchingError, customTagValidation } =
    useTagSearch(searchTerm);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [filteredTags, searchTerm]);

  const containerHeight = Math.min(contentHeight, 188);

  if (isFetchingTag) {
    return <TagsSectionSkeleton />;
  }

  if (tagFetchingError) {
    return (
      <div className="h-full w-full flex justify-center items-center text-red-500">
        Something went wrong!
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-y-auto transition-all duration-200"
      style={{
        height: `${containerHeight}px`,
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e1 transparent",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div ref={contentRef}>
        {filteredTags.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            <CustomTagOption
              searchTerm={searchTerm}
              validation={customTagValidation}
              error={error}
              onSelect={onAddTag}
            />
          </div>
        ) : (
          filteredTags.map((tag, index) => (
            <TagListItem
              key={`${tag}-${index}`}
              tag={tag}
              onSelect={onAddTag}
            />
          ))
        )}
      </div>

      {/* Custom scrollbar styling */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TagsSection;

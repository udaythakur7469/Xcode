import React, { useEffect, useMemo, useRef, useState } from "react";
import { commentTags } from "@/components/problemDetailPage/questionDiscussion/questionDiscussionData/QuestionDiscussionData";

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

  // Filter tags based on search term
  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) {
      return commentTags; // Show only top 4 when no search
    }

    // Filter tags that include the search term (case insensitive)
    const filtered = commentTags.filter((tag) =>
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // When searching, show all matching tags (not limited to 4)
    return filtered;
  }, [searchTerm]);

  // Calculate content height after render
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [filteredTags, searchTerm]);

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent select from closing
    e.preventDefault();
    onAddTag(tag);
  };

  // Calculate container height (max 188px, or content height if smaller)
  const containerHeight = Math.min(contentHeight, 188);

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
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div>{`No tags found for ${searchTerm}`}</div>
            )}
          </div>
        ) : (
          filteredTags.map((tag, index) => (
            <div
              key={`${tag}-${index}`}
              className="px-3 py-2 hover:bg-accent cursor-pointer text-sm transition-colors rounded-lg"
              onClick={(e) => handleTagClick(tag, e)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {tag}
            </div>
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

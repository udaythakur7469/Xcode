import React, { useRef, useState, useEffect } from "react";
import PostTags from "./PostTags";

type NewlyAddedTagsProps = {
  selectedTags: string[];
  onRemoveTag: (tag: string) => void;
};

const NewlyAddedTags: React.FC<NewlyAddedTagsProps> = ({
  selectedTags,
  onRemoveTag,
}) => {
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // replace the useEffect with:
  useEffect(() => {
    const checkScrollable = () => {
      if (contentRef.current && scrollRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        const containerHeight = scrollRef.current.clientHeight;
        if (contentHeight > containerHeight) {
          setShowBottomFade(true);
        } else {
          setShowTopFade(false);
          setShowBottomFade(false);
        }
      }
    };

    checkScrollable();

    const viewport = scrollRef.current;
    const handleScroll = () => {
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        setShowTopFade(scrollTop > 5);
        setShowBottomFade(scrollTop + clientHeight < scrollHeight - 5);
      }
    };

    if (viewport) {
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [selectedTags]);

  if (selectedTags.length === 0) {
    return null;
  }

  return (
    <div className="relative h-[99px] w-full">
      <div ref={scrollRef} className="h-full w-full overflow-y-auto">
        <div
          ref={contentRef}
          className="min-h-[95px] w-full flex flex-row items-center justify-start p-2"
        >
          <div className="flex flex-row items-center flex-wrap gap-2">
            {selectedTags.map((tag, index) => (
              <PostTags
                key={index}
                tag={tag}
                onRemove={() => onRemoveTag(tag)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top fade indicator - blends with dark background */}
      {showTopFade && (
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-[#1c1c1e] via-[#1c1c1e]/80 to-transparent pointer-events-none" />
      )}

      {/* Bottom fade indicator - blends with dark background */}
      {showBottomFade && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-[#1c1c1e] via-[#1c1c1e]/80 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default NewlyAddedTags;

"use client";

import React, { useEffect, useRef, useState } from "react";
import Tags from "./Tags";
import { tags } from "../../questionDiscussionData/QuestionDiscussionData";

type PostsTagsProps = {};

const PostsTags: React.FC<PostsTagsProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureTagRef = useRef<HTMLDivElement>(null);

  // State for UI calculations
  const [visibleTags, setVisibleTags] = useState(0);
  const [tagWidth, setTagWidth] = useState(0);

  // Constants
  const gap = 8; // gap-2 = 8px
  const padding = 16; // Account for container padding

  // Only set up measurements AFTER tags array is available
  useEffect(() => {
    if (tags.length === 0) return;

    // Measure tag width once data is available
    if (measureTagRef.current?.clientWidth) {
      setTagWidth(measureTagRef.current.clientWidth);
    }

    const updateVisibleTags = () => {
      if (!containerRef.current || tagWidth === 0) return;
      const containerWidth = containerRef.current.clientWidth;
      const availableWidth = containerWidth - padding;
      const maxTags = Math.floor((availableWidth + gap) / (tagWidth + gap));
      setVisibleTags(Math.max(0, Math.min(maxTags, tags.length)));
    };

    // Debounce function
    const debounce = (fn: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    const debouncedUpdate = debounce(updateVisibleTags, 100);
    const resizeObserver = new ResizeObserver(debouncedUpdate);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      updateVisibleTags(); // Initial calculation
    }

    return () => resizeObserver.disconnect();
  }, [tagWidth, tags.length]);

  // Show loading message if no tags
  if (tags.length === 0) {
    return <div className="py-2">No tags available</div>;
  }

  return (
    <>
      {/* Hidden tag for measurement */}
      <div className="absolute opacity-0 pointer-events-none">
        <Tags ref={measureTagRef} title={tags[0]} />
      </div>

      {/* Native horizontal scrolling container */}
      <div
        ref={containerRef}
        className="tags-container w-full h-full overflow-x-auto overflow-y-hidden"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 transparent",
        }}
      >
        <div className="flex flex-row gap-2 min-w-max h-full items-center pb-1">
          {/* Show all tags if visibleTags is 0 (still calculating), otherwise show calculated amount */}
          {(visibleTags > 0 ? tags.slice(0, visibleTags) : tags).map(
            (name, index) => (
              <Tags key={index} title={name} />
            )
          )}
        </div>

        {/* Custom webkit scrollbar styling*/}
        <style jsx global>{`
          .tags-container::-webkit-scrollbar {
            height: 6px;
          }
          .tags-container::-webkit-scrollbar-track {
            background: #ffffff;
          }
          .tags-container::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 3px;
          }
          .tags-container::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
          }
          .tags-container::-webkit-scrollbar-button {
            display: none;
            width: 0;
            height: 0;
          }
        `}</style>
      </div>
    </>
  );
};

export default PostsTags;

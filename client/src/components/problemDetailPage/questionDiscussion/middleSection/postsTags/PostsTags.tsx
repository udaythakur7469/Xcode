"use client";

import React, { useEffect, useRef, useState } from "react";
import Tags from "./Tags";
import { tags } from "../../questionDiscussionData/QuestionDiscussionData";
import { usePostStore } from "@/features/postStore";
import { useSearchParams } from "next/navigation";

type PostsTagsProps = {};

const PostsTags: React.FC<PostsTagsProps> = () => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title") as string;

  const [hasFetched, setHasFetched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const measureTagRef = useRef<HTMLDivElement>(null);

  const {
    searchPosts,
    searchResults,
    getCombinedTags,
    combinedTags,
    isFetchingCombinedTags,
  } = usePostStore();

  // State for UI calculations
  const [visibleTags, setVisibleTags] = useState(0);
  const [tagWidth, setTagWidth] = useState(0);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  // Constants
  const gap = 8; // gap-2 = 8px
  const padding = 16; // Account for container padding

  useEffect(() => {
    if (problemTitle && !isFetchingCombinedTags && !hasFetched) {
      getCombinedTags(problemTitle);
      setHasFetched(true);
    }
  }, [problemTitle, getCombinedTags, isFetchingCombinedTags, hasFetched]);

  const handleTagClick = (tagName: string) => {
    setActiveTags((prev) => {
      const newActiveTags = new Set(prev);

      if (newActiveTags.has(tagName)) {
        // Remove tag if already active
        newActiveTags.delete(tagName);
      } else {
        // Add tag if not active
        newActiveTags.add(tagName);
      }

      // Trigger search with active tags
      if (newActiveTags.size > 0) {
        const searchQuery = Array.from(newActiveTags).join(" ");
        searchPosts(searchQuery);
      } else {
        // Clear search if no tags are active
        usePostStore.setState({ searchResults: null });
      }

      return newActiveTags;
    });
  };

  const handleDeselectAll = () => {
    setActiveTags(new Set());
    usePostStore.setState({ searchResults: null });
  };

  // Reset active tag when search results are cleared
  useEffect(() => {
    if (!searchResults) {
      setActiveTags(new Set());
    }
  }, [searchResults]);

  // Only set up measurements AFTER tags array is available
  useEffect(() => {
    if (!combinedTags || combinedTags.length === 0) return;

    // Measure tag width once data is available
    if (measureTagRef.current?.clientWidth) {
      setTagWidth(measureTagRef.current.clientWidth);
    }

    const updateVisibleTags = () => {
      if (!containerRef.current || tagWidth === 0) return;
      const containerWidth = containerRef.current.clientWidth;
      const availableWidth = containerWidth - padding;
      const hasActiveTags = activeTags.size > 0;
      const totalTags = tags.length + (hasActiveTags ? 1 : 0);
      const maxTags = Math.floor((availableWidth + gap) / (tagWidth + gap));
      setVisibleTags(Math.max(0, Math.min(maxTags, totalTags)));
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
  }, [tagWidth, tags.length, activeTags.size]);

  // Show loading message if no tags
  if (!combinedTags || combinedTags.length === 0) {
    return <div className="py-2">No tags available</div>;
  }

  const displayTags =
    activeTags.size > 0 ? ["Deselect All", ...combinedTags] : combinedTags;

  return (
    <>
      {/* Hidden tag for measurement */}
      <div className="absolute opacity-0 pointer-events-none">
        <Tags
          ref={measureTagRef}
          title={tags[0]}
          onTagClick={handleTagClick}
          isActive={activeTags.has(tags[0])}
          isDeselectAll={false}
        />
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
          {(visibleTags > 0
            ? displayTags.slice(0, visibleTags)
            : displayTags
          ).map((name, index) => (
            <Tags
              key={index}
              title={name}
              onTagClick={
                name === "Deselect All" ? handleDeselectAll : handleTagClick
              }
              isActive={name !== "Deselect All" && activeTags.has(name)}
              isDeselectAll={name === "Deselect All"}
            />
          ))}
        </div>

        {/* Custom webkit scrollbar styling*/}
        <style jsx>{`
          .tags-container {
            scrollbar-width: none !important;
          }

          .tags-container:hover {
            scrollbar-width: thin !important;
            scrollbar-color: #cbd5e1 transparent;
          }

          .tags-container::-webkit-scrollbar {
            width: 0px !important;
            height: 0px !important;
            background: transparent !important;
          }

          .tags-container:hover::-webkit-scrollbar {
            width: 6px !important;
            height: 6px !important;
          }

          .tags-container::-webkit-scrollbar-track {
            background: transparent;
          }

          .tags-container::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 3px;
          }

          .tags-container::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
          }
        `}</style>
      </div>
    </>
  );
};

export default PostsTags;

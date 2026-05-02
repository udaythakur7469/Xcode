import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";
import { TagsSectionSkeleton } from "./TagsSectionSkeleton";

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
  const [postTags, setPostTags] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isValidatingCustomTag, setIsValidatingCustomTag] = useState(false);
  const [validationResults, setValidationResults] = useState<
    Map<string, { valid: boolean; message: string }>
  >(new Map());

  // Use refs to track current state without causing re-renders
  const isValidatingRef = useRef(false);
  const lastProcessedTermRef = useRef("");

  const {
    TagsList,
    isFetchingTag,
    tagFetchingError,
    fetchPostTags,
    validateTag,
  } = usePostStore();

  useEffect(() => {
    const fetchTags = async () => {
      await fetchPostTags();
      setHasLoaded(true);
    };
    fetchTags();
  }, [fetchPostTags]);

  useEffect(() => {
    if (TagsList?.data?.tags) {
      setPostTags(TagsList.data.tags);
    }
  }, [TagsList]);

  // Filter tags based on search term
  const filteredTags = useMemo(() => {
    if (!hasLoaded || !TagsList?.data?.tags) {
      return [];
    }

    if (!searchTerm.trim()) {
      return postTags;
    }

    const filtered = postTags.filter((tag) =>
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered;
  }, [searchTerm, postTags, TagsList?.data?.tags, hasLoaded]);

  // Check if tag exists in fetched tags first, then validate if not found
  useEffect(() => {
    const checkAndValidateTag = async () => {
      const currentSearchTerm = searchTerm.trim();

      // Exit conditions
      if (!hasLoaded || !currentSearchTerm || isValidatingRef.current) {
        return;
      }

      // If we already processed this exact term, don't process again
      if (lastProcessedTermRef.current === currentSearchTerm) {
        return;
      }

      // If we already have a validation result for this term, don't validate again
      if (validationResults.has(currentSearchTerm)) {
        lastProcessedTermRef.current = currentSearchTerm;
        return;
      }

      // First check if tag exists in the fetched tags (case insensitive)
      const tagExists = postTags.some(
        (tag) => tag.toLowerCase() === currentSearchTerm.toLowerCase()
      );

      if (tagExists) {
        // Tag exists in the list, mark as valid
        setValidationResults(
          (prev) =>
            new Map(
              prev.set(currentSearchTerm, {
                valid: true,
                message: "Tag exists",
              })
            )
        );
        lastProcessedTermRef.current = currentSearchTerm;
        return;
      }

      // Tag doesn't exist in the list, validate with backend
      if (filteredTags.length === 0) {
        isValidatingRef.current = true;
        setIsValidatingCustomTag(true);

        try {
          // Call validateTag but don't await if it updates the store
          // We'll handle the response directly
          const response = await validateTag(currentSearchTerm, "validate");

          // Use the response directly
          if (response) {
            setValidationResults(
              (prev) =>
                new Map(
                  prev.set(currentSearchTerm, {
                    valid: response.data.valid,
                    message: response.message,
                  })
                )
            );
          }
        } catch (error) {
          console.error("Error validating custom tag:", error);
          setValidationResults(
            (prev) =>
              new Map(
                prev.set(currentSearchTerm, {
                  valid: false,
                  message: "Error validating tag",
                })
              )
          );
        } finally {
          isValidatingRef.current = false;
          setIsValidatingCustomTag(false);
          lastProcessedTermRef.current = currentSearchTerm;
        }
      }
    };

    checkAndValidateTag();
  }, [searchTerm, filteredTags.length, hasLoaded, validateTag, postTags]);

  // Clear validation results and refs when search term becomes empty
  useEffect(() => {
    if (!searchTerm.trim()) {
      setValidationResults(new Map());
      lastProcessedTermRef.current = "";
      isValidatingRef.current = false;
    }
  }, [searchTerm]);

  // Calculate content height after render
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [filteredTags, searchTerm]);

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAddTag(tag);
  };

  const containerHeight = Math.min(contentHeight, 188);

  // Get validation result for current search term
  const currentValidation = searchTerm.trim()
    ? validationResults.get(searchTerm.trim())
    : null;
  const isTagValid = currentValidation?.valid;
  const validationMessage = currentValidation?.message;

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
            {isValidatingCustomTag ? (
              <div className="flex items-center justify-center">
                <MoonLoader size={20} color="#ffffff" className="mr-2" />
                Validating tag...
              </div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : searchTerm.trim() && isTagValid ? (
              // Render the valid custom tag as a clickable item
              <div
                className="px-3 py-2 hover:bg-accent cursor-pointer text-sm transition-colors rounded-lg"
                onClick={(e) => handleTagClick(searchTerm.trim(), e)}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {searchTerm.trim()}
                <span className="ml-2 text-xs text-green-400">(New tag)</span>
              </div>
            ) : searchTerm.trim() ? (
              <div className="text-center">No matching tags</div>
            ) : (
              <div className="text-center">No tags available</div>
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

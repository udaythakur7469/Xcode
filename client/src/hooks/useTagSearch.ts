import { useEffect, useMemo, useState } from "react";
import { usePostStore } from "@/features/postStore";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type CustomTagValidation = {
  isValidating: boolean;
  isValid: boolean | null;
  message: string;
};

/**
 * Owns everything TagsSection needs to render: fetching the official
 * tag list, filtering it against the search term, and validating a
 * search term that doesn't match anything (the "custom tag" case).
 * All validation goes through usePostStore().validateTagCached, so
 * this hook never talks to the AI directly and never duplicates the
 * caching logic that already lives in the store.
 */
export const useTagSearch = (searchTerm: string) => {
  const [customTagValidation, setCustomTagValidation] =
    useState<CustomTagValidation>({
      isValidating: false,
      isValid: null,
      message: "",
    });

  const { TagsList, isFetchingTag, tagFetchingError, fetchPostTags, validateTagCached } =
    usePostStore();

  useEffect(() => {
    fetchPostTags();
  }, [fetchPostTags]);

  const postTags = TagsList?.data?.tags || [];

  const filteredTags = useMemo(() => {
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch) {
      return postTags;
    }

    return postTags.filter((tag) =>
      tag.toLowerCase().includes(trimmedSearch.toLowerCase()),
    );
  }, [searchTerm, postTags]);

  // Only validate as a "custom tag" once nothing in the list matches -
  // debounced so we don't fire on every keystroke.
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 600);

  useEffect(() => {
    const trimmedTerm = debouncedSearchTerm.trim();

    if (!trimmedTerm || filteredTags.length > 0) {
      setCustomTagValidation({ isValidating: false, isValid: null, message: "" });
      return;
    }

    let isStale = false;

    setCustomTagValidation((prev) => ({ ...prev, isValidating: true }));

    validateTagCached(trimmedTerm)
      .then((result) => {
        if (isStale) return;
        setCustomTagValidation({
          isValidating: false,
          isValid: result.valid,
          message: result.message,
        });
      })
      .catch(() => {
        if (isStale) return;
        setCustomTagValidation({
          isValidating: false,
          isValid: false,
          message: "Error validating tag",
        });
      });

    return () => {
      isStale = true;
    };
  }, [debouncedSearchTerm, filteredTags.length, validateTagCached]);

  return {
    filteredTags,
    isFetchingTag,
    tagFetchingError,
    customTagValidation,
  };
};

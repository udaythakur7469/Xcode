"use client";

import { Input } from "@/components/ui/input";
import { usePostStore } from "@/features/postStore";
import { Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";

type TopSectionProps = {};

const TopSection: React.FC<TopSectionProps> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { searchPosts, isSearchingPosts } = usePostStore();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleClear = () => {
    setSearchQuery("");
    usePostStore.setState({
      searchResults: null,
      searchPagination: null,
      activeSearchQuery: null,
    });
  };

  // Effect to trigger search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchPosts(searchQuery.trim());
      }, 500); // Simple debounce

      return () => clearTimeout(timeoutId);
    } else {
      // When search query becomes empty, clear search results
      usePostStore.setState({
        searchResults: null,
        searchPagination: null,
        activeSearchQuery: null,
      });
    }
  }, [searchQuery, searchPosts]);

  return (
    <div className="relative w-full">
      {/* Search Icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />

      {/* Input Field */}
      <Input
        className="w-full border-white bg-secondary h-[40px] pl-12 pr-10 placeholder-white text-xl"
        placeholder="Search posts"
        value={searchQuery}
        onChange={handleSearch}
        disabled={isSearchingPosts}
      />

      {/* Clear (X) Icon */}
      {searchQuery && ( // Only show the X icon if there is text in the search bar
        <X
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer"
          onClick={handleClear}
        />
      )}
    </div>
  );
};
export default TopSection;

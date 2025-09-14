import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useProblemStore } from "@/features/problemStore";

type SearchBarProps = {};

const SearchBar: React.FC<SearchBarProps> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { searchProblems } = useProblemStore();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchProblems(query); // Call the search function
  };

  const handleClear = () => {
    setSearchQuery(""); // Clear the search query
    searchProblems(""); // Reset search results
  };

  return (
    <div className="relative w-full">
      {/* Search Icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />

      {/* Input Field */}
      <Input
        className="w-full border-white bg-secondary h-[40px] pl-12 pr-10 placeholder-white text-xl"
        placeholder="Search problems"
        value={searchQuery}
        onChange={handleSearch}
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

export default SearchBar;

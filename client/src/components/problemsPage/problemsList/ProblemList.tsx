import React from "react";
import SearchBar from "./header/SearchBar";
import DifficultyDropdown from "./dropdowns/DifficultyDropdown";
import StatusDropdown from "./dropdowns/StatusDropdown";
import TagsDropdown from "./dropdowns/TagsDropdown";
import RenderedTags from "../helperComponents/RenderedTags";
import ProblemTable from "../problemsTable/ProblemTable";
import { useProblemStore } from "@/features/problemStore"; // Import the store

type ProblemListProps = {};

const ProblemList: React.FC<ProblemListProps> = () => {
  const { tagsFilter, setTagsFilter } = useProblemStore(); // Get tagsFilter and setTagsFilter from the store

  // Tag removal function
  const handleRemoveTag = (tag: string) => {
    const updatedTags = tagsFilter.filter((t) => t !== tag); // Ensure updatedTags is an array
    setTagsFilter(updatedTags); // Update the Zustand store
  };

  // Deselect all tags function
  const handleDeselectAll = () => {
    setTagsFilter([]); // Clear all selected tags
  };

  return (
    <div className="w-full">
      <SearchBar />
      <div className="flex flex-row mt-4 gap-4 w-full">
        <div className="flex-1">
          <DifficultyDropdown />
        </div>
        <div className="flex-1">
          <StatusDropdown />
        </div>
        <div className="flex-1">
          <TagsDropdown />
        </div>
      </div>
      {/* Rendering list of selected tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tagsFilter.map((tag) => (
          <RenderedTags key={tag} tagName={tag} onRemove={handleRemoveTag} />
        ))}
        {tagsFilter.length > 0 && (
          <RenderedTags
            key="deselect-all"
            tagName="Deselect All"
            onRemove={handleDeselectAll}
          />
        )}
      </div>
      <div className="w-full mb-5">
        {" "}
        {/* Ensure the container takes full width */}
        <ProblemTable />
      </div>
    </div>
  );
};

export default ProblemList;

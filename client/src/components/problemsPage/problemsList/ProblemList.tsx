"use client";

import React from "react";
import SearchBar from "./header/SearchBar";
import DifficultyDropdown from "./dropdowns/DifficultyDropdown";
import StatusDropdown from "./dropdowns/StatusDropdown";
import TagsDropdown from "./dropdowns/TagsDropdown";
import RenderedTags from "../helperComponents/RenderedTags";
import ProblemTable from "../problemsTable/ProblemTable";
import { useProblemStore } from "@/features/problemStore";
import DateFilterChip from "../analyticsPanel/DateFilterChip";

const ProblemList: React.FC = () => {
  const { tagsFilter, setTagsFilter } = useProblemStore();

  const handleRemoveTag = (tag: string) => {
    setTagsFilter(tagsFilter.filter((t) => t !== tag));
  };

  const handleDeselectAll = () => {
    setTagsFilter([]);
  };

  return (
    <div className="w-full">
      <SearchBar />

      <div className="mt-4 flex flex-row gap-4 w-full">
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

      {/* Tag chips — unchanged */}
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

      {/* ← NEW: date filter chip (only visible when a date/range is selected) */}
      <DateFilterChip />

      <div className="w-full mb-5">
        <ProblemTable />
      </div>
    </div>
  );
};

export default ProblemList;

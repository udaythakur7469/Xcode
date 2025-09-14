import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/tagsDropdownMenu";
import { Button } from "@/components/ui/button";
import { ClipboardPenLine, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import TagsList from "../../helperComponents/TagsList";
import { topicTags } from "@/components/landingPage/landingPageData/data";
import { useProblemStore } from "@/features/problemStore"; // Import the store

type TagsDropdownProps = {};

const TagsDropdown: React.FC<TagsDropdownProps> = () => {
  const { tagsFilter, setTagsFilter } = useProblemStore(); // Get tagsFilter and setTagsFilter from the store
  const [searchTerm, setSearchTerm] = useState("");

  // Controller function for managing tag search
  const filteredTags = topicTags.filter((tag) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full text-xl" variant="secondary">
          Problem Tags
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
          <Input
            className="w-full border-white bg-secondary h-[40px] pl-10 placeholder-white text-xl"
            placeholder="Search tags"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </DropdownMenuLabel>
        <DropdownMenuLabel>
          <div className="flex flex-row ">
            <p className="text-base">Topics</p>
            <ClipboardPenLine className="ml-2" />
          </div>
        </DropdownMenuLabel>
        <Separator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <TagsList
            tags={filteredTags}
            selectedTags={tagsFilter} // Pass tagsFilter from the store
            setSelectedTags={setTagsFilter} // Pass setTagsFilter from the store
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default TagsDropdown;

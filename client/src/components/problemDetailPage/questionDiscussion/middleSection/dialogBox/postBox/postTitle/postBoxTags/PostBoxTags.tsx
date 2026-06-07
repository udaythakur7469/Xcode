import React, { useState } from "react";
import AddNewTags from "./addNewTags.tsx/AddNewTags";
import NewlyAddedTags from "./newlyAddedTags/NewlyAddedTags";
import { Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";

type PostBoxTagsProps = {
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  onSuggestTags: () => Promise<string[]>;
  isSuggestingTags: boolean;
};

const PostBoxTags: React.FC<PostBoxTagsProps> = ({
  selectedTags,
  setSelectedTags,
  onSuggestTags,
  isSuggestingTags,
}) => {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(
    new Set(),
  );

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    } else {
      toast.error("Tag already added!");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSuggestTags = async () => {
    setSuggestedTags([]);
    setAddedSuggestions(new Set());
    const suggestions = await onSuggestTags();
    // Filter out any tags the user already has selected
    const filtered = suggestions.filter((t) => !selectedTags.includes(t));
    setSuggestedTags(filtered);
  };

  const handleAddSuggestion = (tag: string) => {
    addTag(tag);
    setAddedSuggestions((prev) => new Set(prev).add(tag));
  };

  const handleDismissSuggestions = () => {
    setSuggestedTags([]);
    setAddedSuggestions(new Set());
  };

  return (
    <div className="h-full w-full flex flex-col justify-center ml-3 select-none gap-1">
      {/* Tags row */}
      <div className="flex flex-row items-center">
        <div className="h-full w-auto flex flex-row items-center ml-3">
          <AddNewTags onAddTag={addTag} />
        </div>
        <div className="h-full w-full flex flex-row items-center">
          <NewlyAddedTags selectedTags={selectedTags} onRemoveTag={removeTag} />
        </div>

        {/* AI suggest tags button */}
        <button
          onClick={handleSuggestTags}
          disabled={isSuggestingTags}
          className="mr-3 flex items-center gap-1.5 rounded-full border border-violet-500/50 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          title="Suggest tags with AI"
        >
          {isSuggestingTags ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Sparkles size={12} />
          )}
          {isSuggestingTags ? "Suggesting..." : "✨ Suggest tags"}
        </button>
      </div>

      {/* AI suggested tag chips — shown below the tags row */}
      {suggestedTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap ml-3 pl-3">
          <span className="text-xs text-muted-foreground">AI suggests:</span>
          {suggestedTags.map((tag) => {
            const isAdded = addedSuggestions.has(tag);
            return (
              <button
                key={tag}
                onClick={() => !isAdded && handleAddSuggestion(tag)}
                disabled={isAdded}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition-all ${
                  isAdded
                    ? "border-muted-foreground/30 text-muted-foreground/40 line-through cursor-default"
                    : "border-violet-500/50 bg-violet-50 text-violet-600 hover:bg-violet-100 cursor-pointer dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50"
                }`}
              >
                {tag}
              </button>
            );
          })}
          <button
            onClick={handleDismissSuggestions}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Dismiss suggestions"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PostBoxTags;

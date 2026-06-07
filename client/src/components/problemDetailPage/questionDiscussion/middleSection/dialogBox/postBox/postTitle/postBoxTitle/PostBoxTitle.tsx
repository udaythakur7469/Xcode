import React from "react";
import { Input } from "@/components/ui/postTitleInput";
import { X, Sparkles, Loader2 } from "lucide-react";

type PostBoxTitleProps = {
  postTitle: string;
  setPostTitle: React.Dispatch<React.SetStateAction<string>>;
  onSuggestTitle: () => void;
  isSuggestingTitle: boolean;
};

const PostBoxTitle: React.FC<PostBoxTitleProps> = ({
  postTitle,
  setPostTitle,
  onSuggestTitle,
  isSuggestingTitle,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostTitle(e.target.value);
  };

  const handleClear = () => {
    setPostTitle("");
  };

  return (
    <div className="relative w-full h-full ml-3 flex items-center gap-2 pr-3">
      {/* Title input */}
      <div className="relative flex-1">
        <Input
          placeholder="Enter the title"
          value={postTitle}
          onChange={handleChange}
          className="text-2xl placeholder:text-2xl pr-10"
        />
        {postTitle && (
          <X
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer"
            onClick={handleClear}
          />
        )}
      </div>

      {/* AI suggest title button */}
      <button
        onClick={onSuggestTitle}
        disabled={isSuggestingTitle}
        className="flex items-center gap-1.5 rounded-full border border-violet-500/50 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap flex-shrink-0"
        title="Suggest title with AI"
      >
        {isSuggestingTitle ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Sparkles size={12} />
        )}
        {isSuggestingTitle ? "Suggesting..." : "✨ Suggest"}
      </button>
    </div>
  );
};

export default PostBoxTitle;

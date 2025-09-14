import { Input } from "@/components/ui/commentTitleInput";
import { X } from "lucide-react";
import React, { useState } from "react";

type CommentDialogTitleProps = {};

const CommentDialogTitle: React.FC<CommentDialogTitleProps> = () => {
  const [commentTitle, setCommentTitle] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommentTitle(e.target.value);
    console.log("Title entered:", e.target.value);
  };

  const handleClear = () => {
    setCommentTitle("");
  };

  return (
    <div className="relative w-full h-full ml-3">
      <Input
        placeholder="Enter the title"
        value={commentTitle}
        onChange={handleChange}
        className="text-2xl placeholder:text-2xl"
      />
      {commentTitle && (
        <X
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer"
          onClick={handleClear}
        />
      )}
    </div>
  );
};

export default CommentDialogTitle;

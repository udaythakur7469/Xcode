import React, { useState } from "react";
import { Input } from "@/components/ui/postTitleInput";
import { X } from "lucide-react";

type PostBoxTitleProps = {};

const PostBoxTitle: React.FC<PostBoxTitleProps> = () => {
  const [postTitle, setPostTitle] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostTitle(e.target.value);
    console.log("Title entered:", e.target.value);
  };

  const handleClear = () => {
    setPostTitle("");
  };

  return (
    <div className="relative w-full h-full ml-3">
      <Input
        placeholder="Enter the title"
        value={postTitle}
        onChange={handleChange}
        className="text-2xl placeholder:text-2xl"
      />
      {postTitle && (
        <X
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer"
          onClick={handleClear}
        />
      )}
    </div>
  );
};

export default PostBoxTitle;

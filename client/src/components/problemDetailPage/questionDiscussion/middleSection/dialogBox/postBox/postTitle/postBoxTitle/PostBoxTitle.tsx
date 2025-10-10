import React from "react";
import { Input } from "@/components/ui/postTitleInput";
import { X } from "lucide-react";

type PostBoxTitleProps = {
  postTitle: string;
  setPostTitle: React.Dispatch<React.SetStateAction<string>>;
};

const PostBoxTitle: React.FC<PostBoxTitleProps> = ({
  postTitle,
  setPostTitle,
}) => {
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
        className="text-2xl placeholder:text-2xl pr-10"
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

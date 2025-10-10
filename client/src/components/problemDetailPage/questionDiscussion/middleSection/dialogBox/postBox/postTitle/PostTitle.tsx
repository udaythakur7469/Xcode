import React from "react";
import PostBoxTitle from "./postBoxTitle/PostBoxTitle";
import PostBoxTags from "./postBoxTags/PostBoxTags";
import PostBoxButtons from "./postBoxButtons/PostBoxButtons";

type PostTitleProps = {
  onClose: () => void;
  postTitle: string;
  setPostTitle: () => void;
  selectedTags: string[];
  setSelectedTags: () => void;
};

const PostTitle: React.FC<PostTitleProps> = ({
  onClose,
  postTitle,
  setPostTitle,
  selectedTags,
  setSelectedTags,
}) => {
  return (
    <div className="h-full w-full rounded-t-xl flex flex-row">
      <div className="h-full w-full rounded-tl-xl flex-[8] flex flex-col">
        <div className="rounded-tl-xl flex-[4]">
          <PostBoxTitle postTitle={postTitle} setPostTitle={setPostTitle} />
        </div>
        <div className="flex-[6]">
          <PostBoxTags
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
        </div>
      </div>
      <div className="rounded-tr-xl flex-[2]">
        <PostBoxButtons onClose={onClose} />
      </div>
    </div>
  );
};
export default PostTitle;

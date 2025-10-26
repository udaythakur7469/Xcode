import React from "react";
import PostImage from "./postImage/PostImage";
import PostAuthor from "./postAuthor/PostAuthor";
import PostHeader from "./postHeader/PostHeader";
import PostFooter from "./postFooter/PostFooter";
import { PostCardData } from "@/features/postStore";

type PostCardProps = { data: PostCardData; onClick?: () => void };

const PostCard: React.FC<PostCardProps> = ({ data, onClick }) => {
  return (
    <div
      className="h-full w-full flex flex-row bg-secondary rounded-lg cursor-pointer select-none"
      onClick={onClick}
    >
      <PostImage />
      <div className="flex flex-col">
        <PostAuthor name={data.author.name} />
        <PostHeader title={data.title} tags={data.tags} />
        <PostFooter
          postId={data.id}
          likes={data.likes}
          dislikes={data.dislikes}
          comments={data.comments}
          userReaction={data.userReaction}
        />
      </div>
    </div>
  );
};
export default PostCard;

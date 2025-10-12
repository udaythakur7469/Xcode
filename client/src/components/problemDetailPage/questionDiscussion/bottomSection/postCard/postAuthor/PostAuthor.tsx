import React from "react";

type PostAuthorProps = { name: string };

const PostAuthor: React.FC<PostAuthorProps> = ({ name }) => {
  return <div className="h-full w-full">{name}</div>;
};
export default PostAuthor;

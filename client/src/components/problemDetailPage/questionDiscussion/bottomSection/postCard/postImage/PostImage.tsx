import React, { useEffect } from "react";
import { useUserStore } from "@/features/userStore";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/accountAvatar";

type PostImageProps = {};

const PostImage: React.FC<PostImageProps> = () => {
  const { userData } = useUserStore();


  const name = userData?.name;

  const picture = userData?.picture ?? "";
  const firstLetter = name ? name[0] : null;

  const defaultPicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTM3FwFWSj9qohGE7FhrwJ-PlcK4-tLdWSlGg&s";

  return (
    <div>
      <Avatar className="rounded-full w-9 h-9 mt-3 mx-2">
        <AvatarImage src={picture || defaultPicture} />
        <AvatarFallback>{firstLetter}</AvatarFallback>
      </Avatar>
    </div>
  );
};
export default PostImage;

import React from "react";
import { useUserStore } from "@/features/userStore";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/accountAvatar";
import { DEFAULT_PROFILE_PICTURE } from "@/constants/avatar";

type PostImageProps = {};

const PostImage: React.FC<PostImageProps> = () => {
  const { userData } = useUserStore();

  const name = userData?.name;

  const picture: string | unknown = userData?.picture;
  const firstLetter = name ? name[0] : null;

  return (
    <div>
      <Avatar className="rounded-full w-9 h-9 mt-3 mx-2">
        <AvatarImage src={(picture as string) || DEFAULT_PROFILE_PICTURE} />
        <AvatarFallback>{firstLetter}</AvatarFallback>
      </Avatar>
    </div>
  );
};
export default PostImage;

import React from "react";
import moment from "moment";
import { CalendarDays, Heart, HeartOff } from "lucide-react";
import { FullPostData } from "@/features/postStore";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/accountAvatar";
import PostDataContent from "./PostDataContent";

type PostDataProps = { fullPostData: FullPostData };

const PostData: React.FC<PostDataProps> = ({ fullPostData }) => {
  const formatTitle = (title: string): string => {
    if (!title) return title;
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  const formattedDate = (date: string): string => {
    return moment().format("MMM Do YYYY");
  };

  const name = fullPostData.author.name;
  const firstLetter = name ? name[0] : null;
  const picture = fullPostData.author.picture;
  const defaultPicture =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTM3FwFWSj9qohGE7FhrwJ-PlcK4-tLdWSlGg&s";

  return (
    /*
      ✅ No h-full here — this div grows to fit its content naturally.
      The parent scroll container in FullPostPanel handles all scrolling.
    */
    <div className="w-full flex flex-col justify-start p-4 font-sans overflow-x-hidden">
      {/* Title */}
      <div className="text-3xl pb-3 font-bold overflow-x-hidden whitespace-normal break-words">
        {formatTitle(fullPostData.title)}
      </div>

      {/* Author + meta */}
      <div className="flex flex-row items-center">
        <Avatar className="rounded-full w-11 h-11 mt-3">
          <AvatarImage src={picture || defaultPicture} />
          <AvatarFallback>{firstLetter}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col justify-center ml-4 text-lg mt-1">
          <div className="text-md mb-1">{name}</div>
          <div className="flex flex-row items-center justify-start gap-4 text-sm">
            <div className="flex flex-row items-center text-green-500 cursor-default">
              <Heart size={18} className="mr-1" />
              {fullPostData.likes}
            </div>
            <div className="flex flex-row items-center text-red-500 cursor-default">
              <HeartOff size={18} className="mr-1" />
              {fullPostData.dislikes}
            </div>
            <div className="flex flex-row items-center cursor-default">
              <CalendarDays size={18} className="mr-1" />
              {formattedDate(fullPostData.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-row justify-start gap-2 mt-5 ml-1">
        {fullPostData.tags.map((tag, index) => (
          <div
            key={index}
            className="bg-secondary px-2 py-1 rounded-md text-sm"
          >
            {tag}
          </div>
        ))}
      </div>

      {/* 
        ✅ No flex-1, no overflow here — just a normal div that grows
        with its content and feeds into the parent scroll container.
      */}
      <div className="mt-4 overflow-x-hidden whitespace-normal break-words">
        <PostDataContent markdown={fullPostData.content} />
      </div>
    </div>
  );
};

export default PostData;

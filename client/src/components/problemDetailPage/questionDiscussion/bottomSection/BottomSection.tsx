"use client";

import React, { useEffect, useRef, useState } from "react";
import PostCard from "./postCard/PostCard";
import {
  DraftPostData,
  PostCardData,
  usePostStore,
} from "@/features/postStore";
import { useSearchParams } from "next/navigation";
import { MoonLoader } from "react-spinners";
import { List } from "lucide-react";
import DraftPostDropdown from "./postCard/postCardDropdown/DraftPostDropdown";
import { ScrollArea } from "@/components/ui/questionDiscussionScrollArea";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type BottomSectionProps = {};

const BottomSection: React.FC<BottomSectionProps> = () => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title") as string;

  const {
    getPostCards,
    getPostCardData,
    isGettingPostCardData,
    postCardError,
  } = usePostStore();

  const { getDraftPosts, DraftPosts, isGettingDraftPosts, DraftPostError } =
    usePostStore();

  const [draftPosts, setDraftPosts] = useState<DraftPostData[]>([]);
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [showDraftPostsDropdown, setShowDraftPostsDropdown] =
    useState<boolean>(false);
  const [draftPostsExist, setDraftPostsExist] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (problemTitle) {
      getPostCards(problemTitle);
      getDraftPosts(problemTitle);
    }
  }, [problemTitle, getPostCards, getDraftPosts]);

  useEffect(() => {
    if (getPostCardData) {
      setPosts(getPostCardData);
      console.log("Posts data:", getPostCardData);
    }
    if (DraftPosts) {
      setDraftPosts(DraftPosts);
      console.log("Draft Posts data:", DraftPosts);
    }

    if (draftPosts.length > 0) {
      setDraftPostsExist(true);
    }
  }, [getPostCardData, DraftPosts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDraftPostsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFloatingButtonClick = () => {
    setShowDraftPostsDropdown((prev) => !prev);
    console.log("draft post button clicked!");
  };

  if (isGettingPostCardData) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <MoonLoader size={150} color="#ffffff" />
      </div>
    );
  }

  if (postCardError) {
    return (
      <div className="flex justify-center items-center h-full w-full text-red-500 text-xl">
        {postCardError}
      </div>
    );
  }

  return (
    <div className="relative">
      {draftPostsExist ? (
        <HoverCard>
          <HoverCardTrigger asChild>
            <button
              ref={buttonRef}
              onClick={handleFloatingButtonClick}
              className="absolute top-0 right-2 w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center z-10"
              aria-label="Add new post"
            >
              <List className="text-lg font-semibold" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="right" className="px-1">See draft posts</HoverCardContent>
        </HoverCard>
      ) : null}
      {showDraftPostsDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-8 right-2 z-30 p-2 bg-background rounded-xl"
        >
          <DraftPostDropdown
            draftPosts={draftPosts}
            isGettingDraftPosts={isGettingDraftPosts}
            DraftPostError={DraftPostError}
          />
        </div>
      )}

      <ScrollArea className="h-[435px] w-full mt-3">
        <div className="space-y-3 mr-2 pb-2">
          {posts.length > 0 ? (
            posts.map((post, index) => <PostCard key={index} data={post} />)
          ) : (
            <div className="flex justify-center items-center h-full w-full text-white">
              No posts found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BottomSection;

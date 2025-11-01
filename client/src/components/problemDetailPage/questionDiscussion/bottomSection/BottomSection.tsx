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
  import PostDialogBox from "../middleSection/dialogBox/PostDialogBox";
  import FullPostPanel from "./postCard/fullPostPanel/FullPostPanel";
  import { AnimatePresence } from "framer-motion";

  type BottomSectionProps = {};

  const BottomSection: React.FC<BottomSectionProps> = () => {
    const searchParams = useSearchParams();
    const problemTitle = searchParams.get("title") as string;

    const {
      getPostCards,
      getPostCardData,
      postCardError,
      searchResults,
      isSearchingPosts,
      searchPostsError,
      isGettingPostCardData,
      isFetchingCombinedTags,
    } = usePostStore();

    const { getDraftPosts, DraftPosts, isGettingDraftPosts, DraftPostError } =
      usePostStore();

    const [draftPosts, setDraftPosts] = useState<DraftPostData[]>([]);
    const [posts, setPosts] = useState<PostCardData[]>([]);
    const [showDraftPostsDropdown, setShowDraftPostsDropdown] =
      useState<boolean>(false);
    const [draftPostsExist, setDraftPostsExist] = useState<boolean>(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [isPostDialogBoxOpen, setIsPostDialogBoxOpen] = useState(false);
    const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isFullPostPanelOpen, setIsFullPostPanelOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      // Only make API calls if we're not already loading and have problemTitle
      if (
        problemTitle &&
        !isGettingPostCardData &&
        !isFetchingCombinedTags &&
        !hasFetched
      ) {
        getPostCards(problemTitle);
        getDraftPosts(problemTitle);
        setHasFetched(true);
      }
    }, [
      problemTitle,
      getPostCards,
      getDraftPosts,
      isGettingPostCardData,
      isFetchingCombinedTags,
      hasFetched,
    ]);

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

    // Use search results if available, otherwise use regular posts
    const displayPosts = searchResults ? searchResults : posts;

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

    const handleDraftClick = (draftId: string) => {
      setSelectedDraftId(draftId);
      setIsPostDialogBoxOpen(true);
      setShowDraftPostsDropdown(false); // Close dropdown after selection
    };

    const handleDialogClose = () => {
      setIsPostDialogBoxOpen(false);
      setSelectedDraftId(null);
      // Refresh draft posts to show updated data
      if (problemTitle) {
        getDraftPosts(problemTitle);
      }
    };

    // Add this handler for PostCard clicks
    const handlePostCardClick = (postId: string) => {
      setSelectedPostId(postId);
      setIsFullPostPanelOpen(true);
    };

    // Add this handler to close FullPostPanel
    const handleFullPostPanelClose = () => {
      setIsFullPostPanelOpen(false);
      setSelectedPostId(null);
    };

    if (isSearchingPosts) {
      return (
        <div className="flex justify-center items-center h-full w-full">
          <MoonLoader size={150} color="#ffffff" />
        </div>
      );
    }

    if (postCardError || searchPostsError) {
      return (
        <div className="flex justify-center items-center h-full w-full text-red-500 text-xl">
          {postCardError || searchPostsError}
        </div>
      );
    }

    return (
      <>
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
              <HoverCardContent side="right" className="px-1">
                See draft posts
              </HoverCardContent>
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
                onDraftClick={handleDraftClick}
              />
            </div>
          )}

          <ScrollArea className="h-[435px] w-full mt-3">
            <div className="space-y-3 mr-2 pb-3">
              {displayPosts.length > 0 ? (
                displayPosts.map((post, index) => (
                  <PostCard
                    key={index}
                    data={post}
                    onClick={() => handlePostCardClick(post.id)}
                  />
                ))
              ) : (
                <div className="flex justify-center items-center h-[400px] w-full text-white">
                  {searchResults && searchResults.length === 0
                    ? "No posts found for your search"
                    : "No posts found"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* PostDialogBox for editing draft - lifted to parent */}
        <PostDialogBox
          isOpen={isPostDialogBoxOpen}
          onClose={handleDialogClose}
          draftId={selectedDraftId}
        />
        {/* Add FullPostPanel with AnimatePresence */}
        <AnimatePresence mode="wait">
          {isFullPostPanelOpen && (
            <FullPostPanel
              postId={selectedPostId}
              onClose={handleFullPostPanelClose}
            />
          )}
        </AnimatePresence>
      </>
    );
  };

  export default BottomSection;

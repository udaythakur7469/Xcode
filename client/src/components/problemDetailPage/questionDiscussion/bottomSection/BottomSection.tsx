"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import PostCard from "./postCard/PostCard";
import {
  DraftPostData,
  PostCardData,
  usePostStore,
} from "@/features/postStore";
import { useRouter, useSearchParams } from "next/navigation";
import { MoonLoader } from "react-spinners";
import { List } from "lucide-react";
import DraftPostDropdown from "./postCard/postCardDropdown/DraftPostDropdown";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import PostDialogBox from "../middleSection/dialogBox/PostDialogBox";
import FullPostPanel from "./postCard/fullPostPanel/FullPostPanel";
import { AnimatePresence } from "framer-motion";
import { useCommentPanel } from "@/context/commentPanelContext";
import { useSocket } from "@/context/socketContext";

const SCROLL_THRESHOLD = 80;

type BottomSectionProps = {};

const BottomSection: React.FC<BottomSectionProps> = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title") as string;

  // Read post ID from URL — this is the source of truth for which post is open
  const postIdFromUrl = searchParams.get("post");

  const {
    getPostCards,
    loadMorePosts,
    getPostCardData,
    postCardError,
    postsPagination,
    isLoadingMorePosts,
    searchResults,
    isSearchingPosts,
    searchPostsError,
    searchPagination,
    isLoadingMoreSearch,
    loadMoreSearchResults,
    isGettingPostCardData,
    isFetchingCombinedTags,
    applyRemotePostReaction,
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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Stable refs — updated every render so the scroll handler always reads
  // the latest values without needing to be re-registered
  const hasNextPageRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const isInSearchModeRef = useRef(false);
  const problemTitleRef = useRef(problemTitle);
  const loadMoreRef = useRef<() => void>(() => {});

  const { setPostId, setIsOpen } = useCommentPanel();
  const { socket } = useSocket();

  // ── Derive panel open state from URL ─────────────────────────────────────
  // isFullPostPanelOpen and selectedPostId are now derived from the URL,
  // not from local state. This makes them reload-proof and shareable.
  const isFullPostPanelOpen = postIdFromUrl !== null;
  const selectedPostId = postIdFromUrl;

  // ── Sync comment panel context when URL post param changes ────────────────
  // On initial load with ?post=123 in URL: open comment panel + set postId.
  // On close (post param removed): close comment panel.
  useEffect(() => {
    if (postIdFromUrl) {
      setPostId(postIdFromUrl);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [postIdFromUrl]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !getPostCardData) return;
    const postIds = getPostCardData.map((p) => p.id);
    postIds.forEach((id) => socket.emit("post:join", id));
    const handleReactionUpdate = (payload: {
      postId: number;
      likes: number;
      dislikes: number;
    }) => applyRemotePostReaction(payload);
    socket.on("post:reaction:updated", handleReactionUpdate);
    return () => {
      postIds.forEach((id) => socket.emit("post:leave", id));
      socket.off("post:reaction:updated", handleReactionUpdate);
    };
  }, [socket, getPostCardData, applyRemotePostReaction]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  // Post list fetch is non-blocking — FullPostPanel fetches its own data
  // independently via getFullPostById, so even if this hasn't completed,
  // the panel can load and display the post.
  useEffect(() => {
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

  // ── Sync store → local state ──────────────────────────────────────────────
  useEffect(() => {
    if (getPostCardData) setPosts(getPostCardData);
    if (DraftPosts) setDraftPosts(DraftPosts);
    if (draftPosts.length > 0) setDraftPostsExist(true);
  }, [getPostCardData, DraftPosts]);

  // ── Derived values ────────────────────────────────────────────────────────
  const isInSearchMode = searchResults !== null;
  const displayPosts = isInSearchMode ? searchResults! : posts;
  const hasNextPage = isInSearchMode
    ? (searchPagination?.hasNextPage ?? false)
    : (postsPagination?.hasNextPage ?? false);
  const isLoadingMore = isInSearchMode
    ? isLoadingMoreSearch
    : isLoadingMorePosts;

  // ── Keep refs fresh every render ──────────────────────────────────────────
  hasNextPageRef.current = hasNextPage;
  isLoadingMoreRef.current = isLoadingMore;
  isInSearchModeRef.current = isInSearchMode;
  problemTitleRef.current = problemTitle;
  loadMoreRef.current = () => {
    if (isLoadingMoreRef.current || !hasNextPageRef.current) return;
    if (isInSearchModeRef.current) {
      loadMoreSearchResults();
    } else {
      loadMorePosts(problemTitleRef.current);
    }
  };

  // ── Attach scroll listener + check if content fits ───────────────────────
  useEffect(() => {
    if (isSearchingPosts) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
        loadMoreRef.current();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    const { scrollHeight, clientHeight } = container;
    if (scrollHeight <= clientHeight) {
      loadMoreRef.current();
    }

    return () => container.removeEventListener("scroll", handleScroll);
  }, [isSearchingPosts, displayPosts.length]);

  // ── Click-outside closes draft dropdown ───────────────────────────────────
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFloatingButtonClick = () =>
    setShowDraftPostsDropdown((prev) => !prev);

  const handleDraftClick = (draftId: string) => {
    setSelectedDraftId(draftId);
    setIsPostDialogBoxOpen(true);
    setShowDraftPostsDropdown(false);
  };

  const handleDialogClose = () => {
    setIsPostDialogBoxOpen(false);
    setSelectedDraftId(null);
    if (problemTitle) getDraftPosts(problemTitle);
  };

  // Opening a post: router.push so back button closes the panel naturally
  const handlePostCardClick = (postId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "discussion");
    params.set("post", postId);
    router.push(`?${params.toString()}`);
  };

  // Closing a post: router.replace so it doesn't add a history entry
  const handleFullPostPanelClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("post");
    router.replace(`?${params.toString()}`);
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
                className="absolute top-0 right-2 w-8 h-8 bg-indigo-500 text-white rounded-lg flex items-center justify-center z-9"
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
            className="absolute top-8 right-2 z-9 p-2 bg-background rounded-xl"
          >
            <DraftPostDropdown
              draftPosts={draftPosts}
              isGettingDraftPosts={isGettingDraftPosts}
              DraftPostError={DraftPostError}
              onDraftClick={handleDraftClick}
            />
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="h-[435px] w-full mt-3 overflow-y-auto"
        >
          <div className="space-y-3 mr-2 pb-3">
            {displayPosts.length > 0 ? (
              <>
                {displayPosts.map((post, index) => (
                  <PostCard
                    key={index}
                    data={post}
                    onClick={() => handlePostCardClick(post.id)}
                    onCommentsClick={() => handlePostCardClick(post.id)}
                  />
                ))}

                {isLoadingMore && (
                  <div className="flex justify-center py-4">
                    <MoonLoader size={30} color="#ffffff" />
                  </div>
                )}

                {!hasNextPage && displayPosts.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground pb-2">
                    You&apos;ve reached the end
                  </p>
                )}
              </>
            ) : (
              <div className="flex justify-center items-center h-[400px] w-full text-white">
                {isInSearchMode
                  ? "No posts found for your search"
                  : "No posts found"}
              </div>
            )}
          </div>
        </div>
      </div>

      <PostDialogBox
        isOpen={isPostDialogBoxOpen}
        onClose={handleDialogClose}
        draftId={selectedDraftId}
      />

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

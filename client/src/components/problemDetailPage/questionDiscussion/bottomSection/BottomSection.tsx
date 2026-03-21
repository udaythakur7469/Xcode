"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
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
import { useCommentPanel } from "@/context/commentPanelContext";
import { useSocket } from "@/context/socketContext";

type BottomSectionProps = {};

const BottomSection: React.FC<BottomSectionProps> = () => {
  const searchParams = useSearchParams();
  const problemTitle = searchParams.get("title") as string;

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
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isFullPostPanelOpen, setIsFullPostPanelOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sentinel: invisible div at the bottom of the list that triggers load-more
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Inner scrollable viewport of the shadcn ScrollArea — used as IntersectionObserver root
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const { setPostId } = useCommentPanel();
  const { socket } = useSocket();

  // ── Socket: join/leave post rooms for real-time reaction updates ──────────
  useEffect(() => {
    if (!socket || !getPostCardData) return;

    const postIds = getPostCardData.map((p) => p.id);
    postIds.forEach((id) => socket.emit("post:join", id));

    const handleReactionUpdate = (payload: {
      postId: number;
      likes: number;
      dislikes: number;
    }) => {
      applyRemotePostReaction(payload);
    };

    socket.on("post:reaction:updated", handleReactionUpdate);

    return () => {
      postIds.forEach((id) => socket.emit("post:leave", id));
      socket.off("post:reaction:updated", handleReactionUpdate);
    };
  }, [socket, getPostCardData, applyRemotePostReaction]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
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

  // ── Derived values: which post list and pagination to use ─────────────────
  const isInSearchMode = searchResults !== null;
  const displayPosts = isInSearchMode ? searchResults! : posts;
  const hasNextPage = isInSearchMode
    ? (searchPagination?.hasNextPage ?? false)
    : (postsPagination?.hasNextPage ?? false);
  const isLoadingMore = isInSearchMode
    ? isLoadingMoreSearch
    : isLoadingMorePosts;

  // ── handleLoadMore: called by IntersectionObserver when sentinel is visible ─
  // In search mode, loadMoreSearchResults() reads activeSearchQuery from the
  // Zustand store — no need to pass the query as a prop or ref.
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasNextPage) return;

    if (isInSearchMode) {
      loadMoreSearchResults();
    } else if (problemTitle) {
      loadMorePosts(problemTitle);
    }
  }, [
    isLoadingMore,
    hasNextPage,
    isInSearchMode,
    loadMoreSearchResults,
    loadMorePosts,
    problemTitle,
  ]);

  // ── IntersectionObserver watching the sentinel div ────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      {
        // Root must be the ScrollArea viewport, not the browser window.
        // Without this, the sentinel would always appear "visible" to the window
        // and every page would load simultaneously on mount.
        root: scrollViewportRef.current ?? null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

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

  const handleFloatingButtonClick = () => {
    setShowDraftPostsDropdown((prev) => !prev);
  };

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

  const handlePostCardClick = (postId: string) => {
    setSelectedPostId(postId);
    setIsFullPostPanelOpen(true);
    setPostId(postId);
  };

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

        {/*
          ScrollArea ref callback: shadcn does not expose the inner scrollable
          viewport via a forwarded ref, so we reach it via querySelector after
          mount and store it in scrollViewportRef for IntersectionObserver.
        */}
        <ScrollArea
          className="h-[435px] w-full mt-3"
          ref={(el) => {
            if (el) {
              const viewport = el.querySelector(
                "[data-radix-scroll-area-viewport]",
              ) as HTMLDivElement | null;
              if (viewport) {
                (
                  scrollViewportRef as React.MutableRefObject<HTMLDivElement | null>
                ).current = viewport;
              }
            }
          }}
        >
          <div className="space-y-3 mr-2 pb-3">
            {displayPosts.length > 0 ? (
              <>
                {displayPosts.map((post, index) => (
                  <PostCard
                    key={index}
                    data={post}
                    onClick={() => handlePostCardClick(post.id)}
                  />
                ))}

                {/* Sentinel — becomes visible when user scrolls to bottom */}
                <div ref={sentinelRef} className="h-4 w-full" aria-hidden />

                {/* Spinner shown while next page is loading */}
                {isLoadingMore && (
                  <div className="flex justify-center py-4">
                    <MoonLoader size={30} color="#ffffff" />
                  </div>
                )}

                {/* End-of-list indicator */}
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
        </ScrollArea>
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

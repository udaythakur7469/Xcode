import React from "react";
import { Heart, HeartOff, MessagesSquare } from "lucide-react";
import { usePostStore } from "@/features/postStore";
import { formatCount } from "@/services/countService";
import { useCommentPanel } from "@/context/commentPanelContext";

type PostFooterProps = {
  postId: string;
  likes: number;
  dislikes: number;
  comments: number;
  userReaction?: "like" | "dislike" | null;
};

const PostFooter: React.FC<PostFooterProps> = ({
  postId,
  likes,
  dislikes,
  comments,
  userReaction,
}) => {
  const { reactToPost, isReactingToPost, getPostCardData } = usePostStore();

  // Get current post data from the store (optimistic values live here)
  const currentPost = getPostCardData?.find((post) => post.id === postId);

  // Use store data if available (post-optimistic-update), otherwise fall back to props
  const displayLikes = currentPost?.likes ?? likes;
  const displayDislikes = currentPost?.dislikes ?? dislikes;
  const displayUserReaction = currentPost?.userReaction ?? userReaction;

  const { setIsOpen } = useCommentPanel();

  const handleReaction = async (action: "like" | "dislike") => {
    // Guard against double-clicks while API call is in-flight
    if (isReactingToPost) return;
    try {
      await reactToPost(postId, action);
    } catch (error) {
      // Error is handled inside the store (state rolled back)
      console.error("Reaction failed:", error);
    }
  };

  return (
    <div className="flex flex-row items-center pb-1 mt-2 gap-x-3">
      {/* Like button */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleReaction("like");
        }}
        className={`gap-x-2 flex flex-row items-center px-2 py-0.5 bg-background rounded cursor-pointer transition-colors ${
          isReactingToPost
            ? "opacity-70 cursor-not-allowed"
            : "hover:opacity-80"
        }`}
      >
        <Heart
          size={16}
          className={`transition-all duration-150 ${
            displayUserReaction === "like"
              ? "text-green-500 fill-green-500 scale-110"
              : "text-green-500"
          }`}
        />
        <span className="text-gray-300">{formatCount(displayLikes)}</span>
      </div>

      {/* Dislike button */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleReaction("dislike");
        }}
        className={`gap-x-2 flex flex-row items-center px-2 py-0.5 bg-background rounded cursor-pointer transition-colors ${
          isReactingToPost
            ? "opacity-70 cursor-not-allowed"
            : "hover:opacity-80"
        }`}
      >
        <HeartOff
          size={16}
          className={`transition-all duration-150 ${
            displayUserReaction === "dislike"
              ? "text-red-500 fill-red-500 scale-110"
              : "text-red-500"
          }`}
        />
        <span className="text-gray-300">{formatCount(displayDislikes)}</span>
      </div>

      {/* Comments */}
      <div
        className="gap-x-2 flex flex-row items-center px-2 py-0.5 bg-background text-gray-300 rounded cursor-pointer transition-colors hover:opacity-80"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
      >
        <MessagesSquare size={16} className="text-blue-500" />
        {formatCount(comments)}
      </div>
    </div>
  );
};

export default PostFooter;

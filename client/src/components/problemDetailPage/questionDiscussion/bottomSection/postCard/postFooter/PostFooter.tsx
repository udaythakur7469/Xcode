import { Heart, HeartOff, MessagesSquare } from "lucide-react";
import React, { useState, useEffect } from "react";
import { usePostStore } from "@/features/postStore";
import { MoonLoader } from "react-spinners";

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
  const {
    reactToPost,
    refreshPostReactions,
    isReactingToPost,
    getPostCardData,
  } = usePostStore();
  const [clickedAction, setClickedAction] = useState<"like" | "dislike" | null>(
    null
  );

  // Get current post data from the store
  const currentPost = getPostCardData?.find((post) => post.id === postId);

  // Use store data if available, otherwise fall back to props
  const displayLikes = currentPost?.likes ?? likes;
  const displayDislikes = currentPost?.dislikes ?? dislikes;
  const displayUserReaction = currentPost?.userReaction ?? userReaction;

  // Setup a refresh interval for likes/dislikes
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshPostReactions(postId).catch(console.error);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(intervalId);
  }, [postId, refreshPostReactions]);

  const handleReaction = async (action: "like" | "dislike") => {
    if (isReactingToPost) return;

    try {
      setClickedAction(action);
      await reactToPost(postId, action);
    } catch (error) {
      console.error("Error handling reaction:", error);
    } finally {
      setClickedAction(null);
    }
  };

  return (
    <div className="flex flex-row items-center pb-1 mt-2 gap-x-3">
      {/* Like button */}
      <div
        onClick={() => handleReaction("like")}
        className={`gap-x-2 flex flex-row items-center px-2 py-0.5 bg-background rounded cursor-pointer transition-colors ${
          displayUserReaction === "like" ? "bg-background" : "bg-background"
        } ${isReactingToPost ? "cursor-not-allowed" : "bg-background"}`}
        style={{ pointerEvents: isReactingToPost ? "none" : "auto" }}
      >
        {isReactingToPost && clickedAction === "like" ? (
          <MoonLoader size={14} color="#22c55e" />
        ) : (
          <Heart
            size={16}
            className={`${
              displayUserReaction === "like"
                ? "text-green-500 fill-green-500"
                : "text-green-500"
            }`}
          />
        )}
        <span className="text-gray-300">{displayLikes}</span>
      </div>

      {/* Dislike button */}
      <div
        onClick={() => handleReaction("dislike")}
        className={`gap-x-2 flex flex-row items-center px-2 py-0.5 bg-background rounded cursor-pointer transition-colors ${
          displayUserReaction === "dislike" ? "bg-background" : "bg-background"
        } ${isReactingToPost ? "cursor-not-allowed" : "bg-background"}`}
        style={{ pointerEvents: isReactingToPost ? "none" : "auto" }}
      >
        {isReactingToPost && clickedAction === "dislike" ? (
          <MoonLoader size={14} color="#ef4444" />
        ) : (
          <HeartOff
            size={16}
            className={`${
              displayUserReaction === "dislike"
                ? "text-red-500 fill-red-500"
                : "text-red-500"
            }`}
          />
        )}
        <span className="text-gray-300">{displayDislikes}</span>
      </div>

      {/* Comments */}
      <div className="gap-x-2 flex flex-row items-center px-2 py-0.5 bg-background text-gray-300 rounded">
        <MessagesSquare size={16} className="text-blue-500" />
        {comments}
      </div>
    </div>
  );
};

export default PostFooter;

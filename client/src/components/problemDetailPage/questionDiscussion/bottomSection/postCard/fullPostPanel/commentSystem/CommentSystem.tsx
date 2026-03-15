"use client";

import React, { useState, useEffect } from "react";
import { useCommentStore } from "@/features/commentStore";
import Comment from "./Comment";

interface CommentSystemProps {
  postId: string | null;
  currentUserId: number | null;
  onOpenLogin?: () => void;
}

const CommentSystem: React.FC<CommentSystemProps> = ({
  postId,
  currentUserId,
  onOpenLogin,
}) => {
  const {
    comments,
    hasMore,
    nextCursor,
    isLoadingComments,
    error,
    getCommentsByPost,
    createComment,
    resetComments,
  } = useCommentStore();

  const [newCommentText, setNewCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    getCommentsByPost(postId);
    return () => resetComments();
  }, [postId]);

  const handlePostComment = async () => {
    if (!newCommentText.trim()) return;
    setIsPosting(true);
    await createComment(postId, newCommentText.trim(), null);
    setNewCommentText("");
    setIsPosting(false);
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await getCommentsByPost(postId, nextCursor);
    setIsLoadingMore(false);
  };

  return (
    <div className="w-full">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-base font-semibold text-zinc-200">
          {comments.length > 0 ? `${comments.length} Comments` : "Comments"}
        </h3>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* ── New comment input ───────────────────────────────────── */}
      {currentUserId ? (
        <div className="mb-6">
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Add a comment…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500 min-h-[88px] transition-colors"
            disabled={isPosting}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                handlePostComment();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-zinc-600">Shift+Enter to post</span>
            <button
              onClick={handlePostComment}
              disabled={isPosting || !newCommentText.trim()}
              className="px-4 py-1.5 text-sm bg-zinc-200 text-zinc-900 rounded-lg font-semibold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPosting ? "Posting…" : "Comment"}
            </button>
          </div>
        </div>
      ) : (
        // Guest user — button opens the login dialog instead of navigating
        <div className="mb-6 py-4 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center">
          <p className="text-sm text-zinc-500">
            <button
              onClick={() => onOpenLogin?.()}
              className="text-zinc-300 hover:text-white underline underline-offset-2 transition-colors"
            >
              Sign in
            </button>{" "}
            to leave a comment
          </p>
        </div>
      )}

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Comment list ────────────────────────────────────────── */}
      {isLoadingComments && comments.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-zinc-800 rounded" />
                <div className="h-3 w-full bg-zinc-800 rounded" />
                <div className="h-3 w-3/4 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 text-sm">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-1 divide-y divide-zinc-800/50">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              depth={0}
              currentUserId={currentUserId}
              postId={postId}
              onOpenLogin={onOpenLogin}
            />
          ))}
        </div>
      )}

      {/* ── Load more top-level comments ────────────────────────── */}
      {hasMore && (
        <div className="mt-6 mb-3 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 text-sm text-white border border-zinc-700 rounded-lg hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-40"
          >
            {isLoadingMore ? "Loading…" : "Load more comments"}
          </button>
        </div>
      )}

      {!hasMore && comments.length > 0 && (
        <p className="mt-6 text-center text-xs text-zinc-700">
          All comments loaded
        </p>
      )}
    </div>
  );
};

export default CommentSystem;

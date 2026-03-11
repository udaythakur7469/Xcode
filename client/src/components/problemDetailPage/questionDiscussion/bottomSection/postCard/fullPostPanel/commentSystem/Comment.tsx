"use client";

import React, { useState, useRef, useEffect } from "react";
import { CommentData, useCommentStore } from "@/features/commentStore";
import { formatCount, formatDate } from "@/services/commentService";
import Avatar from "./Avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CommentProps {
  comment: CommentData;
  depth: number;
  currentUserId: number | null;
  postId: string | null;
  onOpenLogin?: () => void;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  depth,
  currentUserId,
  postId,
  onOpenLogin,
}) => {
  const {
    getRepliesForComment,
    createComment,
    reactToComment,
    editComment,
    deleteComment,
    retryFailedComment,
  } = useCommentStore();

  // ── Local UI state ──────────────────────────────────────────────
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Derived values ──────────────────────────────────────────────
  const MAX_CHARS = 220;
  const isLong = comment.content.length > MAX_CHARS;
  const displayedText =
    isExpanded || isEditing
      ? comment.content
      : comment.content.slice(0, MAX_CHARS);

  const isAuthor = !!currentUserId && comment.author.id === currentUserId;
  const isPending = comment.status === "pending";
  const isFailed = comment.status === "failed";
  const replies = comment.replies ?? [];
  const hasLoadedReplies = replies.length > 0;
  const canShowReplies = comment.replyCount > 0 && !hasLoadedReplies;

  useEffect(() => {
    if (showReplyBox && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showReplyBox]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleShowReplies = async () => {
    setIsLoadingReplies(true);
    await getRepliesForComment(comment.id as number, true, null);
    setIsLoadingReplies(false);
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await getRepliesForComment(
      comment.id as number,
      false,
      comment.nextCursor ?? null,
    );
    setIsLoadingMore(false);
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    await createComment(postId, replyText.trim(), comment.id as number);
    setReplyText("");
    setShowReplyBox(false);
    setIsSubmittingReply(false);
  };

  const handleReact = async (action: "like" | "dislike") => {
    if (!currentUserId) {
      onOpenLogin?.();
      return;
    }
    await reactToComment(comment.id as number, action);
  };

  const handleReply = () => {
    if (!currentUserId) {
      onOpenLogin?.();
      return;
    }
    setShowReplyBox((p) => !p);
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === comment.content) {
      setIsEditing(false);
      return;
    }
    setIsSubmittingEdit(true);
    try {
      await editComment(comment.id as number, editText.trim());
      setIsEditing(false);
    } catch {
      // error surfaced in store
    }
    setIsSubmittingEdit(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      await deleteComment(comment.id as number);
    } catch {
      setIsDeleting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-row justify-center">
              Delete comment?
            </AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col justify-center">
              <span className="flex flex-row justify-center">
                This comment and all its replies will be permanently deleted.
              </span>
              <span className="flex flex-row justify-center">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center space-x-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`relative ${isPending ? "opacity-60" : ""} ${
          isFailed ? "opacity-80" : ""
        }`}
      >
        {/* Vertical threading line */}
        {depth > 0 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-zinc-700/50"
            style={{ left: -12 }}
          />
        )}

        <div
          className={`flex gap-3 py-3 px-1 rounded-lg transition-colors ${
            isFailed ? "border border-red-500/40 bg-red-500/5" : ""
          }`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0 pt-0.5">
            <Avatar
              name={comment.author.name}
              picture={comment.author.picture}
              size={depth === 0 ? 32 : 26}
            />
          </div>

          {/* Main content column */}
          <div className="flex-1 min-w-0">
            {/* ── Header row ─────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-zinc-200">
                {comment.author.name || "Anonymous"}
              </span>
              <span className="text-xs text-zinc-500">
                {formatDate(comment.createdAt)}
              </span>
              {comment.createdAt !== comment.updatedAt && !isPending && (
                <span className="text-xs text-zinc-600 italic">(edited)</span>
              )}
              {isPending && (
                <span className="text-xs text-zinc-500 italic">sending…</span>
              )}
              {isFailed && (
                <span className="text-xs text-red-400 font-medium">
                  failed to send
                </span>
              )}
            </div>

            {/* ── Comment body ────────────────────────────────────── */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-400 min-h-[80px]"
                  disabled={isSubmittingEdit}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    disabled={isSubmittingEdit || !editText.trim()}
                    className="px-3 py-1 text-xs bg-zinc-200 text-zinc-900 rounded-md font-semibold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmittingEdit ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditText(comment.content);
                    }}
                    className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                  {displayedText}
                  {isLong && !isExpanded && "…"}
                </p>
                {isLong && (
                  <button
                    onClick={() => setIsExpanded((p) => !p)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 mt-0.5 transition-colors"
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {/* ── Action row ──────────────────────────────────────── */}
            {!isEditing && !isPending && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {/* Like */}
                <button
                  onClick={() => handleReact("like")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    comment.userReaction === "like"
                      ? "text-emerald-400 bg-emerald-400/10"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  {comment.likes > 0 && (
                    <span>{formatCount(comment.likes)}</span>
                  )}
                </button>

                {/* Dislike */}
                <button
                  onClick={() => handleReact("dislike")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                    comment.userReaction === "dislike"
                      ? "text-red-400 bg-red-400/10"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                  </svg>
                  {comment.dislikes > 0 && (
                    <span>{formatCount(comment.dislikes)}</span>
                  )}
                </button>

                <div className="w-px h-3 bg-zinc-700 mx-1" />

                {/* Reply — opens login dialog if not authenticated */}
                <button
                  onClick={handleReply}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  Reply
                </button>

                {/* Edit — author only */}
                {isAuthor && (
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setEditText(comment.content);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                )}

                {/* Delete — author only */}
                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                )}
              </div>
            )}

            {/* ── Failed comment retry ─────────────────────────────── */}
            {isFailed && (
              <button
                onClick={() => retryFailedComment(comment.id as string)}
                className="mt-2 px-3 py-1 text-xs bg-red-500/20 border border-red-500/40 text-red-400 rounded-md hover:bg-red-500/30 transition-colors font-medium"
              >
                ↺ Retry
              </button>
            )}

            {/* ── Reply textarea ───────────────────────────────────── */}
            {showReplyBox && (
              <div className="mt-3 space-y-2">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.author.name || "this comment"}…`}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500 min-h-[72px] transition-colors"
                  disabled={isSubmittingReply}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReply();
                    }
                  }}
                />
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleSubmitReply}
                    disabled={isSubmittingReply || !replyText.trim()}
                    className="px-3 py-1.5 text-xs bg-zinc-200 text-zinc-900 rounded-md font-semibold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmittingReply ? "Posting…" : "Post Reply"}
                  </button>
                  <button
                    onClick={() => {
                      setShowReplyBox(false);
                      setReplyText("");
                    }}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <span className="text-xs text-zinc-600 ml-auto">
                    Shift+Enter to send
                  </span>
                </div>
              </div>
            )}

            {/* ── Nested replies ───────────────────────────────────── */}
            {hasLoadedReplies && (
              <div className="mt-3 space-y-0">
                {replies.map((reply, index) => {
                  const isLast = index === replies.length - 1;
                  return (
                    <div
                      key={reply.id}
                      className="relative"
                      style={{ paddingLeft: 20 }}
                    >
                      {/* Recurse — same component, depth + 1, onOpenLogin passed through */}
                      <Comment
                        comment={reply}
                        depth={depth + 1}
                        currentUserId={currentUserId}
                        postId={postId}
                        onOpenLogin={onOpenLogin}
                      />

                      {/* Load More — only on the last reply when parent hasMore=true */}
                      {isLast && comment.hasMore && (
                        <button
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          className="flex items-center gap-1.5 mt-1 mb-2 ml-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
                        >
                          {isLoadingMore ? (
                            <>
                              <svg
                                className="w-3 h-3 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8z"
                                />
                              </svg>
                              Loading…
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                              Load more replies
                            </>
                          )}
                        </button>
                      )}

                      {isLast && !comment.hasMore && replies.length >= 2 && (
                        <p className="text-xs text-zinc-700 ml-1 mt-1 mb-2">
                          All replies loaded
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Show X replies button ────────────────────────────── */}
            {canShowReplies && (
              <button
                onClick={handleShowReplies}
                disabled={isLoadingReplies}
                className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
              >
                {isLoadingReplies ? (
                  <>
                    <svg
                      className="w-3 h-3 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Loading replies…
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    {comment.replyCount === 1
                      ? "Show 1 reply"
                      : `Show ${formatCount(comment.replyCount)} replies`}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Comment;

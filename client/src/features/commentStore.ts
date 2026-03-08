import { create } from "zustand";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface CommentAuthor {
  id: number;
  name: string | null;
  picture: string | null;
}

export interface CommentData {
  id: number | string; // string for optimistic temp IDs like "temp-1234"
  content: string;
  postId: number;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  likes: number;
  dislikes: number;
  userReaction: "like" | "dislike" | null;
  replyCount: number;
  // ── Client-side only fields (never come from backend) ──
  replies?: CommentData[];
  hasMore?: boolean;
  nextCursor?: string | null;
  status?: "pending" | "posted" | "failed";
}

interface CommentStoreState {
  comments: CommentData[];
  hasMore: boolean;
  nextCursor: string | null;
  isLoadingComments: boolean;
  isPostingComment: boolean;
  isReactingToComment: boolean;
  error: string | null;

  getCommentsByPost: (postId: number, cursor?: string | null) => Promise<void>;
  getRepliesForComment: (
    commentId: number,
    initial: boolean,
    cursor?: string | null,
  ) => Promise<void>;
  createComment: (
    postId: number,
    content: string,
    parentId?: number | null,
  ) => Promise<void>;
  reactToComment: (
    commentId: number,
    action: "like" | "dislike",
  ) => Promise<void>;
  editComment: (commentId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  retryFailedComment: (tempId: string) => Promise<void>;
  resetComments: () => void;
}

// ─────────────────────────────────────────────────────────────────
// RECURSIVE HELPERS
// Pure functions — never mutate. Always return new objects so React
// re-renders only the subtree that actually changed.
// ─────────────────────────────────────────────────────────────────

/**
 * recursiveUpdate
 * Walks the tree, finds the first node where matcher(node) === true,
 * applies updater to it and returns a new array. Ancestor nodes on
 * the path also get new references (immutability for React diffing).
 */
const recursiveUpdate = (
  list: CommentData[],
  matcher: (c: CommentData) => boolean,
  updater: (c: CommentData) => CommentData,
): CommentData[] => {
  return list.map((c) => {
    if (matcher(c)) return updater(c);
    if (c.replies && c.replies.length > 0) {
      const updatedReplies = recursiveUpdate(c.replies, matcher, updater);
      if (updatedReplies !== c.replies)
        return { ...c, replies: updatedReplies };
    }
    return c;
  });
};

/**
 * setRepliesForParent
 * Updates the replies[] of a specific comment by parentId.
 * mode:
 *   replace → fresh load (Show Replies, first time)
 *   append  → load more (older replies go below existing)
 *   prepend → new reply posted (newest goes to top)
 */
const setRepliesForParent = (
  comments: CommentData[],
  parentId: number | string,
  newReplies: CommentData[],
  hasMore: boolean,
  nextCursor: string | null,
  mode: "replace" | "append" | "prepend",
): CommentData[] => {
  const normalized = newReplies.map((r) => ({
    ...r,
    replies: r.replies ?? [],
    hasMore: r.hasMore ?? false,
    nextCursor: r.nextCursor ?? null,
    status: r.status ?? ("posted" as const),
  }));

  return recursiveUpdate(
    comments,
    (c) => c.id === parentId,
    (c) => {
      const existing = c.replies ?? [];
      const updatedReplies =
        mode === "replace"
          ? normalized
          : mode === "append"
            ? [...existing, ...normalized]
            : [...normalized, ...existing];

      return { ...c, replies: updatedReplies, hasMore, nextCursor };
    },
  );
};

// ─────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────

export const useCommentStore = create<CommentStoreState>()((set, get) => ({
  comments: [],
  hasMore: false,
  nextCursor: null,
  isLoadingComments: false,
  isPostingComment: false,
  isReactingToComment: false,
  error: null,

  resetComments: () => {
    set({ comments: [], hasMore: false, nextCursor: null, error: null });
  },

  getCommentsByPost: async (postId, cursor = null) => {
    set({ isLoadingComments: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/comment/post/${postId}`, {
        params: { limit: 10, ...(cursor && { cursor }) },
      });

      const { comments, hasMore, nextCursor } = response.data;

      const normalized: CommentData[] = comments.map((c) => ({
        ...c,
        replies: [],
        hasMore: false,
        nextCursor: null,
        status: "posted" as const,
      }));

      set((state) => ({
        isLoadingComments: false,
        comments: cursor ? [...state.comments, ...normalized] : normalized,
        hasMore,
        nextCursor,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error fetching comments",
        isLoadingComments: false,
      });
    }
  },

  getRepliesForComment: async (commentId, initial, cursor = null) => {
    try {
      const response = await axios.get(
        `${API_URL}/comment/${commentId}/replies`,
        { params: { initial, limit: 10, ...(cursor && { cursor }) } },
      );

      const { replies, hasMore, nextCursor } = response.data;

      const normalized: CommentData[] = replies.map((r) => ({
        ...r,
        replies: [],
        hasMore: false,
        nextCursor: null,
        status: "posted" as const,
      }));

      set((state) => ({
        comments: setRepliesForParent(
          state.comments,
          commentId,
          normalized,
          hasMore,
          nextCursor,
          initial || !cursor ? "replace" : "append",
        ),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Error fetching replies" });
    }
  },

  createComment: async (postId, content, parentId = null) => {
    const tempId = `temp-${Date.now()}`;

    const optimistic: CommentData = {
      id: tempId,
      content,
      postId,
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: { id: 0, name: "You", picture: null },
      likes: 0,
      dislikes: 0,
      userReaction: null,
      replyCount: 0,
      replies: [],
      hasMore: false,
      nextCursor: null,
      status: "pending",
    };

    if (parentId) {
      set((state) => ({
        comments: setRepliesForParent(
          state.comments,
          parentId,
          [optimistic],
          false,
          null,
          "prepend",
        ),
      }));
    } else {
      set((state) => ({ comments: [optimistic, ...state.comments] }));
    }

    try {
      const response = await axios.post(`${API_URL}/comment/create`, {
        postId,
        content,
        ...(parentId && { parentId }),
      });

      const real: CommentData = {
        ...response.data.comment,
        replies: [],
        hasMore: false,
        nextCursor: null,
        status: "posted",
      };

      if (parentId) {
        set((state) => ({
          comments: recursiveUpdate(
            state.comments,
            (c) => c.id === parentId,
            (parent) => ({
              ...parent,
              replies: (parent.replies ?? []).map((r) =>
                r.id === tempId ? real : r,
              ),
            }),
          ),
        }));
      } else {
        set((state) => ({
          comments: state.comments.map((c) => (c.id === tempId ? real : c)),
        }));
      }
    } catch {
      const failed: CommentData = { ...optimistic, status: "failed" };

      if (parentId) {
        set((state) => ({
          comments: recursiveUpdate(
            state.comments,
            (c) => c.id === parentId,
            (parent) => ({
              ...parent,
              replies: (parent.replies ?? []).map((r) =>
                r.id === tempId ? failed : r,
              ),
            }),
          ),
        }));
      } else {
        set((state) => ({
          comments: state.comments.map((c) => (c.id === tempId ? failed : c)),
        }));
      }
    }
  },

  retryFailedComment: async (tempId) => {
    let failedComment: CommentData | null = null;

    const find = (list: CommentData[]) => {
      for (const c of list) {
        if (c.id === tempId) {
          failedComment = c;
          return;
        }
        if (c.replies) find(c.replies);
      }
    };
    find(get().comments);
    if (!failedComment) return;

    const remove = (list: CommentData[]): CommentData[] =>
      list
        .filter((c) => c.id !== tempId)
        .map((c) => ({ ...c, replies: c.replies ? remove(c.replies) : [] }));

    set((state) => ({ comments: remove(state.comments) }));

    await get().createComment(
      (failedComment as CommentData).postId,
      (failedComment as CommentData).content,
      (failedComment as CommentData).parentId,
    );
  },

  reactToComment: async (commentId, action) => {
    set({ isReactingToComment: true, error: null });

    set((state) => ({
      comments: recursiveUpdate(
        state.comments,
        (c) => c.id === commentId,
        (c) => {
          const isSame = c.userReaction === action;
          const wasLiked = c.userReaction === "like";
          const wasDisliked = c.userReaction === "dislike";

          let newLikes = c.likes;
          let newDislikes = c.dislikes;
          let newReaction: "like" | "dislike" | null = action;

          if (isSame) {
            newReaction = null;
            if (action === "like") newLikes--;
            else newDislikes--;
          } else {
            if (action === "like") {
              newLikes++;
              if (wasDisliked) newDislikes--;
            } else {
              newDislikes++;
              if (wasLiked) newLikes--;
            }
          }

          return {
            ...c,
            likes: newLikes,
            dislikes: newDislikes,
            userReaction: newReaction,
          };
        },
      ),
    }));

    try {
      const response = await axios.post(
        `${API_URL}/comment/${commentId}/react`,
        { action },
      );

      set((state) => ({
        isReactingToComment: false,
        comments: recursiveUpdate(
          state.comments,
          (c) => c.id === commentId,
          (c) => ({
            ...c,
            likes: response.data.likes,
            dislikes: response.data.dislikes,
            userReaction: response.data.userReaction,
          }),
        ),
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error processing reaction",
        isReactingToComment: false,
      });
    }
  },

  editComment: async (commentId, content) => {
    try {
      const response = await axios.patch(`${API_URL}/comment/${commentId}`, {
        content,
      });

      set((state) => ({
        comments: recursiveUpdate(
          state.comments,
          (c) => c.id === commentId,
          (c) => ({
            ...c,
            content: response.data.comment.content,
            updatedAt: response.data.comment.updatedAt,
          }),
        ),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Error editing comment" });
      throw error;
    }
  },

  deleteComment: async (commentId) => {
    try {
      await axios.delete(`${API_URL}/comment/${commentId}`);

      const remove = (list: CommentData[]): CommentData[] =>
        list
          .filter((c) => c.id !== commentId)
          .map((c) => ({ ...c, replies: c.replies ? remove(c.replies) : [] }));

      set((state) => ({ comments: remove(state.comments) }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Error deleting comment" });
      throw error;
    }
  },
}));

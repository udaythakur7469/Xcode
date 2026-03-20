import axios from "axios";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

axios.defaults.withCredentials = true;

interface TagValidation {
  success: boolean;
  message: string;
  data: {
    tag: string;
    valid: boolean;
    added: boolean;
  };
}

interface TagsList {
  success: boolean;
  message: string;
  data: {
    tags: string[];
    source: string;
  };
}

interface CreatePost {
  success: boolean;
  message: string;
  data: CreatePostData;
}

interface CreatePostData {
  id: string;
  title: string;
  authorId: string;
  problemId: string;
  content: string;
  isDraftPost: boolean;
  tags?: CreatePostTags[];
  createdAt: string;
  updatedAt: string;
}

interface CreatePostTags {
  id: string;
  name: string;
  PostId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostCardData {
  id: string;
  title: string;
  tags: {
    name: string;
  }[];
  author: {
    name: string;
    picture: string;
  };
  likes: number;
  dislikes: number;
  comments: number;
  userReaction?: "like" | "dislike" | null;
}

export interface SearchPostData {
  id: string;
  title: string;
  tags: {
    name: string;
  }[];
  author: {
    name: string;
    picture: string;
  };
  likes: number;
  dislikes: number;
  comments: number;
  userReaction?: "like" | "dislike" | null;
}

export interface DraftPostData {
  id: string;
  title: string;
}

export interface DraftPostDetailsData {
  id: number;
  title: string;
  content: string;
  tags: string[];
}

export interface FullPostData {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    name: string;
    picture: string;
  };
  tags: string[];
  likes: number;
  dislikes: number;
  userReaction: "like" | "dislike" | null;
}

interface PostData {
  postBaseTemplate: string | null;
  isPostBaseTemplateLoading: boolean;
  postBaseTemplateError: any | null;
  TagsList: TagsList | null;
  isFetchingTag: boolean;
  tagFetchingError: any | null;
  TagValidation: TagValidation | null;
  isTagGettingValidated: boolean;
  tagValidationError: any | null;
  createPost: CreatePost | null;
  isCreatingPost: boolean;
  createPostError: any | null;
  getPostCardData: PostCardData[] | null;
  isGettingPostCardData: boolean;
  postCardError: any | null;
  DraftPosts: DraftPostData[] | null;
  isGettingDraftPosts: boolean;
  DraftPostError: any | null;
  searchResults: SearchPostData[] | null;
  isSearchingPosts: boolean;
  searchPostsError: any | null;
  combinedTags: string[] | null;
  isFetchingCombinedTags: boolean;
  combinedTagsError: any | null;
  isReactingToPost: boolean;
  postReactionError: any | null;
  draftPostDetails: DraftPostDetailsData | null;
  isGettingDraftPostDetails: boolean;
  draftPostDetailsError: any | null;
  isUpdatingDraftPost: boolean;
  updateDraftPostError: any | null;
  isManagingDraftPost: boolean;
  manageDraftPostError: any | null;
  fullPostData: FullPostData | null;
  isGettingFullPost: boolean;
  fullPostError: any | null;

  manageDraftPost: (
    id: string,
    action: "rename" | "post" | "delete",
    title?: string,
  ) => Promise<void>;
  getPostBaseTemplate: (title: string) => Promise<void>;
  fetchPostTags: () => Promise<void>;
  validateTag: (tag: string, action: string) => Promise<TagValidation>;
  createNewPost: (
    title: string,
    problemTitle: string,
    postTags: string[],
    content: string,
    isDraftPost: boolean,
  ) => Promise<void>;
  getPostCards: (problemTitle: string) => Promise<void>;
  getDraftPosts: (problemTitle: string) => Promise<void>;
  searchPosts: (query: string) => Promise<void>;
  getCombinedTags: (problemTitle: string) => Promise<void>;
  reactToPost: (postId: string, action: "like" | "dislike") => Promise<void>;
  refreshPostReactions: (postId: string) => Promise<void>;
  getDraftPostData: (id: string) => Promise<DraftPostDetailsData>;
  updateDraftPost: (
    id: string,
    title: string,
    tags: string[],
    content: string,
    publish: boolean,
  ) => Promise<any>;
  getFullPostById: (id: string) => Promise<FullPostData>;
  applyRemotePostReaction: (payload: {
    postId: number;
    likes: number;
    dislikes: number;
  }) => void;
}

export const usePostStore = create<PostData>()((set, get) => ({
  postBaseTemplate: null,
  isPostBaseTemplateLoading: false,
  postBaseTemplateError: null,
  TagsList: null,
  isFetchingTag: false,
  tagFetchingError: null,
  TagValidation: null,
  isTagGettingValidated: false,
  tagValidationError: null,
  createPost: null,
  isCreatingPost: false,
  createPostError: null,
  getPostCardData: null,
  isGettingPostCardData: false,
  postCardError: null,
  DraftPosts: null,
  isGettingDraftPosts: false,
  DraftPostError: null,
  searchResults: null,
  isSearchingPosts: false,
  searchPostsError: null,
  combinedTags: null,
  isFetchingCombinedTags: false,
  combinedTagsError: null,
  isReactingToPost: false,
  postReactionError: null,
  draftPostDetails: null,
  isGettingDraftPostDetails: false,
  draftPostDetailsError: null,
  isUpdatingDraftPost: false,
  updateDraftPostError: null,
  isManagingDraftPost: false,
  manageDraftPostError: null,
  fullPostData: null,
  isGettingFullPost: false,
  fullPostError: null,

  getPostBaseTemplate: async (title) => {
    set({ isPostBaseTemplateLoading: true, postBaseTemplateError: null });
    try {
      const response = await axios.get(`${API_URL}/post/getBasePostTemplate`, {
        params: { title },
      });

      set({
        postBaseTemplate: response.data.data,
        isPostBaseTemplateLoading: false,
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to get post base template";

      set({ postBaseTemplateError: errMsg, isPostBaseTemplateLoading: false });
    }
  },

  fetchPostTags: async () => {
    set({ isFetchingTag: true, TagsList: null });

    try {
      const response = await axios.get(`${API_URL}/post/fetch`);

      set({ TagsList: response.data, isFetchingTag: false });
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Error fetching tag";
      set({ tagFetchingError: errMsg, isFetchingTag: false });
    }
  },

  validateTag: async (tag, action) => {
    set({ isTagGettingValidated: true, tagValidationError: null });

    try {
      const response = await axios.post(
        `${API_URL}/post/validateTag`,
        { tag },
        { params: { action } },
      );

      const validationData: TagValidation = response.data;
      set({ TagValidation: validationData, isTagGettingValidated: false });

      return validationData;
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Error checking the tag";
      set({ isTagGettingValidated: false, tagValidationError: errMsg });

      throw error;
    }
  },
  createNewPost: async (title, problemTitle, tags, content, isDraftPost) => {
    set({ isCreatingPost: true, createPostError: null });

    try {
      const response = await axios.post(`${API_URL}/post/createPost`, {
        title,
        problemTitle,
        tags: tags || [],
        content,
        isDraftPost,
      });

      set({ createPost: response.data, isCreatingPost: false });
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Error creating post";
      set({ createPostError: errMsg, isCreatingPost: false });

      throw error;
    }
  },
  getPostCards: async (problemTitle) => {
    set({ isGettingPostCardData: true, postCardError: null });

    try {
      const response = await axios.get(`${API_URL}/post/getPosts`, {
        params: { problemTitle },
      });

      set({
        getPostCardData: response.data.data,
        isGettingPostCardData: false,
      });
    } catch (error) {
      const errMsg =
        error?.response?.data?.message || "Error fetching post card data";
      set({ postCardError: errMsg, isGettingPostCardData: false });

      throw error;
    }
  },

  getDraftPosts: async (problemTitle) => {
    set({ isGettingDraftPosts: true, DraftPostError: null });

    try {
      const response = await axios.get(`${API_URL}/post/getDraftPosts`, {
        params: { problemTitle },
      });

      set({
        DraftPosts: response.data.data,
        isGettingDraftPosts: false,
      });
    } catch (error) {
      const errMsg =
        error?.response?.data?.message || "Error fetching draft posts data";
      set({ DraftPostError: errMsg, isGettingDraftPosts: false });

      throw error;
    }
  },

  searchPosts: async (query) => {
    set({ isSearchingPosts: true, searchPostsError: null });

    try {
      const response = await axios.get(`${API_URL}/post/searchPosts`, {
        params: { query },
      });

      set({
        searchResults: response.data.data,
        isSearchingPosts: false,
      });
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Error searching posts";
      set({ searchPostsError: errMsg, isSearchingPosts: false });
      throw error;
    }
  },

  getCombinedTags: async (problemTitle) => {
    set({ isFetchingCombinedTags: true, combinedTagsError: null });

    try {
      const response = await axios.get(`${API_URL}/post/getPostTags`, {
        params: { problemTitle },
      });

      set({
        combinedTags: response.data.data,
        isFetchingCombinedTags: false,
      });
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message || "Error fetching combined tags";
      set({ combinedTagsError: errMsg, isFetchingCombinedTags: false });
      throw error;
    }
  },

  reactToPost: async (postId: string, action: "like" | "dislike") => {
    set({ postReactionError: null });

    const currentPosts = get().getPostCardData;
    const currentPost = currentPosts?.find((p) => p.id === postId);

    // Nothing to update if the post isn't in the store yet
    if (!currentPost || !currentPosts) return;

    // ── Step 1: Snapshot for rollback ──────────────────────────────────────
    const snapshot = currentPosts;

    // ── Step 2: Calculate optimistic state ────────────────────────────────
    const prevReaction = currentPost.userReaction ?? null;
    const isSameAction = prevReaction === action;
    const isSwitch = prevReaction !== null && prevReaction !== action;

    // New userReaction: toggle off if same, switch/set otherwise
    const newReaction: "like" | "dislike" | null = isSameAction ? null : action;

    // Delta for likes
    let likesDelta = 0;
    if (action === "like") {
      likesDelta = isSameAction ? -1 : 1; // toggle off → -1, add/switch → +1
    } else if (isSwitch && prevReaction === "like") {
      likesDelta = -1; // switching away from like
    }

    // Delta for dislikes
    let dislikesDelta = 0;
    if (action === "dislike") {
      dislikesDelta = isSameAction ? -1 : 1; // toggle off → -1, add/switch → +1
    } else if (isSwitch && prevReaction === "dislike") {
      dislikesDelta = -1; // switching away from dislike
    }

    // ── Step 3: Apply optimistic update ───────────────────────────────────
    const optimisticPosts = currentPosts.map((post) =>
      post.id === postId
        ? {
            ...post,
            likes: Math.max(0, post.likes + likesDelta),
            dislikes: Math.max(0, post.dislikes + dislikesDelta),
            userReaction: newReaction,
          }
        : post,
    );

    set({ getPostCardData: optimisticPosts, isReactingToPost: true });

    // ── Step 4: Fire API call ──────────────────────────────────────────────
    try {
      const response = await axios.post(
        `${API_URL}/post/postReaction`,
        { action },
        { params: { postId } },
      );

      // ── Step 5a: Reconcile with server truth ──────────────────────────
      // The server is the source of truth for final counts; use its values.
      const reconciledPosts = get().getPostCardData!.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: response.data.likes,
              dislikes: response.data.dislikes,
              userReaction: response.data.message.includes("removed")
                ? null
                : action,
            }
          : post,
      );

      set({ getPostCardData: reconciledPosts, isReactingToPost: false });
      return response.data;
    } catch (error: any) {
      // ── Step 5b: Roll back on failure ─────────────────────────────────
      const errMsg =
        error.response?.data?.message || "Error processing reaction";
      set({
        getPostCardData: snapshot,
        isReactingToPost: false,
        postReactionError: errMsg,
      });
      throw error;
    }
  },

  refreshPostReactions: async (postId: string) => {
    try {
      const response = await axios.get(`${API_URL}/post/getPostReactions`, {
        params: { postId: postId },
      });

      // Update the specific post in the post cards array
      const currentPosts = get().getPostCardData;
      if (currentPosts) {
        const updatedPosts = currentPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: response.data.likes,
              dislikes: response.data.dislikes,
              userReaction: response.data.userReaction,
            };
          }
          return post;
        });

        set({ getPostCardData: updatedPosts });
      }

      return response.data;
    } catch (error: any) {
      console.error("Error refreshing post reactions:", error);
      throw new Error("Failed to refresh post reactions");
    }
  },

  applyRemotePostReaction: ({ postId, likes, dislikes }) => {
    const currentPosts = get().getPostCardData;
    if (!currentPosts) return;

    const updatedPosts = currentPosts.map((post) =>
      // postId from socket is a number; post.id is a string — coerce to compare
      post.id === String(postId) ? { ...post, likes, dislikes } : post,
    );
    set({ getPostCardData: updatedPosts });
  },

  getDraftPostData: async (id: string) => {
    set({ isGettingDraftPostDetails: true, draftPostDetailsError: null });
    try {
      const response = await axios.get(`${API_URL}/post/getDraftPostById`, {
        params: { id },
      });

      const draftData: DraftPostDetailsData = response.data.data;

      set({
        draftPostDetails: draftData,
        isGettingDraftPostDetails: false,
      });

      return draftData;
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to fetch draft post details";

      set({
        draftPostDetailsError: errMsg,
        isGettingDraftPostDetails: false,
      });

      throw error;
    }
  },

  updateDraftPost: async (
    id: string,
    title: string,
    tags: string[],
    content: string,
    publish: boolean,
  ) => {
    set({ isUpdatingDraftPost: true, updateDraftPostError: null });

    try {
      const response = await axios.put(
        `${API_URL}/post/updateDraftPost`,
        {
          title,
          tags: tags || [],
          content,
          publish,
        },
        {
          params: { id },
        },
      );

      set({ isUpdatingDraftPost: false });

      // Return the response for success message handling
      return response.data;
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message || "Error updating draft post";
      set({ updateDraftPostError: errMsg, isUpdatingDraftPost: false });

      throw error;
    }
  },

  manageDraftPost: async (
    id: string,
    action: "rename" | "post" | "delete",
    title?: string,
  ) => {
    set({ isManagingDraftPost: true, manageDraftPostError: null });

    try {
      const requestBody: any = { id };

      // Add title to body only for rename action
      if (action === "rename") {
        if (!title || title.trim() === "") {
          throw new Error("Title is required for rename action");
        }
        requestBody.title = title;
      }

      const response = await axios.put(
        `${API_URL}/post/manageDraftPost`,
        requestBody,
        {
          params: { action },
        },
      );

      // If action is delete or post, remove the draft from the DraftPosts list
      if (action === "delete" || action === "post") {
        const currentDrafts = get().DraftPosts;
        if (currentDrafts) {
          const updatedDrafts = currentDrafts.filter(
            (draft) => draft.id !== id,
          );
          set({ DraftPosts: updatedDrafts });
        }
      }

      // If action is rename, update the draft title in the DraftPosts list
      if (action === "rename" && title) {
        const currentDrafts = get().DraftPosts;
        if (currentDrafts) {
          const updatedDrafts = currentDrafts.map((draft) =>
            draft.id === id ? { ...draft, title } : draft,
          );
          set({ DraftPosts: updatedDrafts });
        }
      }

      set({ isManagingDraftPost: false });

      return response.data;
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message || "Error managing draft post";
      set({ manageDraftPostError: errMsg, isManagingDraftPost: false });

      throw error;
    }
  },

  getFullPostById: async (id: string) => {
    set({ isGettingFullPost: true, fullPostError: null });

    try {
      const response = await axios.get(`${API_URL}/post/getPostDataById`, {
        params: { id },
      });

      const postData: FullPostData = response.data.data;

      set({
        fullPostData: postData,
        isGettingFullPost: false,
      });

      return postData;
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to fetch post details";

      set({
        fullPostError: errMsg,
        isGettingFullPost: false,
      });

      throw error;
    }
  },
}));

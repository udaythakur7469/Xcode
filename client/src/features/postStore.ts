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

export interface DraftPostData {
  id: string;
  title: string;
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
  isReactingToPost: boolean;
  postReactionError: any | null;

  getPostBaseTemplate: (title: string) => Promise<void>;
  fetchPostTags: () => Promise<void>;
  validateTag: (tag: string, action: string) => Promise<TagValidation>;
  createNewPost: (
    title: string,
    problemTitle: string,
    postTags: string[],
    content: string,
    isDraftPost: boolean
  ) => Promise<void>;
  getPostCards: (problemTitle: string) => Promise<void>;
  getDraftPosts: (problemTitle: string) => Promise<void>;
  reactToPost: (postId: string, action: "like" | "dislike") => Promise<void>;
  refreshPostReactions: (postId: string) => Promise<void>;
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
  isReactingToPost: false,
  postReactionError: null,

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
        { params: { action } }
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

  reactToPost: async (postId: string, action: "like" | "dislike") => {
    set({ isReactingToPost: true, postReactionError: null });
    try {
      const response = await axios.post(
        `${API_URL}/post/postReaction`,
        { action },
        { params: { postId: postId } }
      );

      // Update the specific post in the post cards array
      const currentPosts = get().getPostCardData;
      if (currentPosts) {
        const updatedPosts = currentPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              likes: response.data.likes,
              dislikes: response.data.dislikes,
              userReaction: response.data.message.includes("removed")
                ? null
                : action,
            };
          }
          return post;
        });

        set({
          getPostCardData: updatedPosts,
          isReactingToPost: false,
        });
      }

      return response.data;
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Error processing reaction";
      set({ postReactionError: errMsg, isReactingToPost: false });
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
}));

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

  getPostBaseTemplate: (title: string) => Promise<void>;
  fetchPostTags: () => Promise<void>;
  validateTag: (tag: string, action: string) => Promise<TagValidation>;
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
}));

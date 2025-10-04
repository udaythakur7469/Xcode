import { create } from "zustand";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

axios.defaults.withCredentials = true;

interface PostData {
  postBaseTemplate: string | null;
  isPostBaseTemplateLoading: boolean;
  postBaseTemplateError: any | null;

  getPostBaseTemplate: (title: string) => Promise<void>;
}

export const usePostStore = create<PostData>()((set, get) => ({
  postBaseTemplate: null,
  isPostBaseTemplateLoading: false,
  postBaseTemplateError: null,

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
}));

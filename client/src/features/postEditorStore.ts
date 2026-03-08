import axios from "axios";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

axios.defaults.withCredentials = true;

interface UploadPostImage {
  success: boolean;
  url: string;
}

interface PostEditorData {
  uploadedImageUrl: string | null;
  isUploadingImage: boolean;
  uploadImageError: any | null;

  uploadPostImage: (file: File) => Promise<UploadPostImage>;
}

export const usePostEditorStore = create<PostEditorData>()((set) => ({
  uploadedImageUrl: null,
  isUploadingImage: false,
  uploadImageError: null,

  uploadPostImage: async (file: File) => {
    set({ isUploadingImage: true, uploadImageError: null });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/postEditor/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      const uploadData: UploadPostImage = response.data;

      set({
        uploadedImageUrl: uploadData.url,
        isUploadingImage: false,
      });

      return uploadData;
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || "Error uploading image";
      set({ uploadImageError: errMsg, isUploadingImage: false });

      throw error;
    }
  },
}));

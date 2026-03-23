import axios from "@/lib/axiosInstance";
import { create } from "zustand";
import { User } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface authData {
  userData: User | null;
  isUserAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
  isDataUpdating: boolean;
  isCheckingUserAuth: boolean;
  message: string | null;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  clearUser: () => void;
  updateDescription: (description: string) => Promise<void>;
  updateLinks: (links: Record<string, string>) => Promise<void>;
  updateProfileData: (data: {
    description?: string;
    links?: Record<string, string>;
  }) => Promise<void>;
  userLinks: Record<string, string> | null;
  solvedLanguages: { language: string; count: number }[] | null;
  fetchSolvedLanguages: () => Promise<void>;
  updateInstitution: (institution: string) => Promise<void>;
  heatmapData: Record<string, number> | null;
  fetchHeatmapData: () => Promise<void>;
  updateProfilePicture: (file: File) => Promise<void>;
}

export const useUserStore = create<authData>()((set) => ({
  userData: null,
  isUserAuthenticated: false,
  error: null,
  isLoading: false,
  isDataUpdating: false,
  isCheckingUserAuth: true,
  message: null,
  userLinks: null,
  solvedLanguages: null,
  heatmapData: null,
  setUser: (user: User) =>
    set({
      userData: user,
      isUserAuthenticated: true,
      isCheckingUserAuth: false,
    }),

  clearUser: () =>
    set({
      userData: null,
      isUserAuthenticated: false,
      isCheckingUserAuth: false,
    }),

  checkAuth: async () => {
    set({
      isCheckingUserAuth: true,
      error: null,
      isLoading: true,
    });
    try {
      const response = await axios.get(`${API_URL}/user/checkUser`);

      // Format links if they exist
      const userLinks = response.data.user.links
        ? response.data.user.links
        : null;

      set({
        userData: response.data.user,
        userLinks,
        isUserAuthenticated: true,
        isCheckingUserAuth: false,
        isLoading: false,
      });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Error getting user data";
      set({
        error: errMsg,
        isCheckingUserAuth: false,
        isUserAuthenticated: false,
        userData: null,
        userLinks: null,
        isLoading: false,
      });
      throw error;
    }
  },
  updateDescription: async (description: string) => {
    try {
      set({ isDataUpdating: true });
      await axios.patch(`${API_URL}/user/profile`, { description });
      set((state) => ({
        userData: state.userData ? { ...state.userData, description } : null,
        isDataUpdating: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update description",
        isDataUpdating: false,
      });
      throw error;
    }
  },

  updateLinks: async (links: Record<string, string>) => {
    try {
      set({ isDataUpdating: true });
      await axios.patch(`${API_URL}/user/profile`, { links });
      set({ isDataUpdating: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update links",
        isDataUpdating: false,
      });
      throw error;
    }
  },

  updateInstitution: async (institution: string) => {
    try {
      set({ isDataUpdating: true });
      await axios.patch(`${API_URL}/user/profile`, { institution });
      set((state) => ({
        userData: state.userData ? { ...state.userData, institution } : null,
        isDataUpdating: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update institution",
        isDataUpdating: false,
      });
      throw error;
    }
  },

  updateProfileData: async (data: {
    description?: string;
    links?: Record<string, string>;
  }) => {
    try {
      set({ isDataUpdating: true });
      const response = await axios.patch(`${API_URL}/user/profile`, data);

      // Update user data in store if description was updated
      if (data.description) {
        set((state) => ({
          userData: state.userData
            ? { ...state.userData, description: data.description }
            : null,
          isDataUpdating: false,
        }));
      } else {
        set({ isDataUpdating: false });
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update profile data",
        isDataUpdating: false,
      });
      throw error;
    }
  },
  fetchSolvedLanguages: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.get(`${API_URL}/user/userLanguages`);
      set({
        solvedLanguages: response.data.languages,
        isLoading: false,
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to fetch solved languages";
      set({
        error: errMsg,
        isLoading: false,
        solvedLanguages: null,
      });
      throw error;
    }
  },
  fetchHeatmapData: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axios.get(`${API_URL}/user/heatmap`);
      set({
        heatmapData: response.data.heatmapData,
        isLoading: false,
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to fetch heatmap data";
      set({
        error: errMsg,
        isLoading: false,
        heatmapData: null,
      });
      throw error;
    }
  },
  updateProfilePicture: async (file: File) => {
    try {
      set({ isDataUpdating: true });

      // Create FormData
      const formData = new FormData();
      formData.append("picture", file);

      // Upload to backend
      const response = await axios.patch(
        `${API_URL}/user/profile/picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Update local state with new user data
      set((state) => ({
        userData: state.userData
          ? { ...state.userData, picture: response.data.imageUrl }
          : null,
        isDataUpdating: false,
      }));
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || "Failed to update profile picture",
        isDataUpdating: false,
      });
      throw error;
    }
  },
}));

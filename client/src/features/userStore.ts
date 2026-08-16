import axios from "@/lib/axiosInstance";
import { create } from "zustand";
import { User } from "./authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface authData {
  userData: User | null;
  isUserAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
  isLanguagesLoading: boolean;
  isHeatmapLoading: boolean;
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
  deleteProfilePicture: () => Promise<void>;
}

let checkAuthRequestId = 0;

export const useUserStore = create<authData>()((set) => ({
  userData: null,
  isUserAuthenticated: false,
  error: null,
  isLoading: false,
  isLanguagesLoading: false,
  isHeatmapLoading: false,
  isDataUpdating: false,
  isCheckingUserAuth: true,
  message: null,
  userLinks: null,
  solvedLanguages: null,
  heatmapData: null,
  setUser: (user: User) => {
    checkAuthRequestId++; // invalidate any in-flight checkAuth() calls
    set({
      userData: user,
      isUserAuthenticated: true,
      isCheckingUserAuth: false,
    });
  },

  clearUser: () => {
    checkAuthRequestId++; // invalidate any in-flight checkAuth() calls
    set({
      userData: null,
      isUserAuthenticated: false,
      isCheckingUserAuth: false,
    });
  },

  checkAuth: async () => {
    // Tag this call. Only the most recently started checkAuth() (or the
    // most recent setUser/clearUser) is allowed to write to the store —
    // anything older is a straggler and must be ignored.
    const requestId = ++checkAuthRequestId;

    set({
      isCheckingUserAuth: true,
      error: null,
      isLoading: true,
    });
    try {
      const response = await axios.get(`${API_URL}/user/checkUser`);
      if (requestId !== checkAuthRequestId) return; // stale — ignore

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
      if (requestId !== checkAuthRequestId) return; // stale — ignore

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

  updateLinks: async (links) => {
    try {
      set({ isDataUpdating: true });
      await axios.patch(`${API_URL}/user/profile`, { links });
      set({ isDataUpdating: false, userLinks: links }); // ✅ sync local state
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

  updateProfileData: async (data) => {
    try {
      set({ isDataUpdating: true });
      await axios.patch(`${API_URL}/user/profile`, data);

      set((state) => ({
        userData: state.userData
          ? {
              ...state.userData,
              ...(data.description !== undefined && {
                description: data.description,
              }),
              ...(data.links !== undefined && { links: data.links }), // ✅ sync links into userData
            }
          : null,
        ...(data.links !== undefined && { userLinks: data.links }), // ✅ sync userLinks too
        isDataUpdating: false,
      }));
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
      set({ isLanguagesLoading: true, error: null });
      const response = await axios.get(`${API_URL}/user/userLanguages`);
      set({
        solvedLanguages: response.data.languages,
        isLanguagesLoading: false,
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to fetch solved languages";
      set({
        error: errMsg,
        isLanguagesLoading: false,
        solvedLanguages: null,
      });
      throw error;
    }
  },

  fetchHeatmapData: async () => {
    try {
      set({ isHeatmapLoading: true, error: null });
      const response = await axios.get(`${API_URL}/user/heatmap`);
      set({
        heatmapData: response.data.heatmapData,
        isHeatmapLoading: false,
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message || "Failed to fetch heatmap data";
      set({
        error: errMsg,
        isHeatmapLoading: false,
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

  deleteProfilePicture: async () => {
    try {
      set({ isDataUpdating: true });

      const response = await axios.delete(`${API_URL}/user/profile/picture`);

      // Update local state with the default picture URL the server reset to
      set((state) => ({
        userData: state.userData
          ? { ...state.userData, picture: response.data.imageUrl }
          : null,
        isDataUpdating: false,
      }));
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || "Failed to delete profile picture",
        isDataUpdating: false,
      });
      throw error;
    }
  },
}));
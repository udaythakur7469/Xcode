import { create } from "zustand";
import axios from "@/lib/axiosInstance";
import { useUserStore } from "./userStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface User {
  id: number;
  name: string;
  email: string;
  picture: string;
  token: string;
  provider?: string;
  description?: string;
  institution?: string;
  links?: {
    LinkedIn?: string;
    Github?: string;
    "Personal site"?: string;
  };
  stats?: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    languages: Array<{ language: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  password?: string;
  contestRating?: number;
  peakRating?: number;
}

interface AuthData {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
  isSendingMagicLink : boolean;
  message: string | null;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  clearMessage: () => void;
}

export const useAuthStore = create<AuthData>((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  isSendingMagicLink: false,
  message: null,

  clearError: () => set({ error: null }),
  clearMessage: () => set({ message: null }),

  signUp: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name,
      });
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      useUserStore.getState().setUser(response.data.user);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Error signing up";
      set({ error: errMsg, isLoading: false });
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      set({
        user: response.data.user,
        isAuthenticated: true,
        error: null,
        isLoading: false,
      });
      useUserStore.getState().setUser(response.data.user);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Error logging in";
      set({ error: errMsg, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/auth/logout`);
      set({ user: null, isAuthenticated: false, error: null, isLoading: false });
      useUserStore.getState().clearUser();
    } catch (error: any) {
      set({ error: "Error logging out", isLoading: false });
      throw error;
    }
  },

  sendMagicLink: async (email: string) => {
    set({ isSendingMagicLink: true, error: null, message: null });
    try {
      await axios.post(`${API_URL}/auth/magic-link/send`, { email });
      set({
        isSendingMagicLink: false,
        message: "Magic link sent! Check your email.",
      });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to send magic link";
      set({ error: errMsg, isLoading: false });
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null, message: null });
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      set({
        isLoading: false,
        message: "If an account exists for that email, a reset link has been sent.",
      });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to send reset email";
      set({ error: errMsg, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    set({ isLoading: true, error: null, message: null });
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
      set({
        isLoading: false,
        message: "Password reset successfully. Please sign in with your new password.",
      });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to reset password";
      set({ error: errMsg, isLoading: false });
      throw error;
    }
  },
}));
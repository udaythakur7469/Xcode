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
    languages: Array<{
      language: string;
      count: number;
    }>;
    tags: Array<{
      tag: string;
      count: number;
    }>;
  };
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  password?: string;
}

interface authData {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
  message: string | null;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<authData>((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  message: null,

  signUp: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name,
      });
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
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
      set({
        user: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      });
      useUserStore.getState().clearUser();
    } catch (error: any) {
      set({ error: "Error logging out", isLoading: false });
      throw error;
    }
  },
}));

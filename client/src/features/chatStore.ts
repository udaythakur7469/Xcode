import axios from "axios";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ChatCreationResponse {
  success: boolean;
  message: string;
  chatId: string;
  isGuest: boolean;
}

interface ChatDeletionResponse {
  success: boolean;
  message: string;
}

interface SendMessageResponse {
  success: boolean;
  userMessage: { id: string; role: string; text: string };
  aiMessage: { id: string; role: string; text: string };
  isGuest: boolean;
}

export interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  status: "sent" | "sending" | "error";
  updatedAt: string;
}

interface getChatsResponse {
  id: string;
  title: string;
}

interface ChatDetails {
  chatCreation: ChatCreationResponse | null;
  isCreatingChat: boolean;
  chatCreationError: string | null;
  chatDeletion: ChatDeletionResponse | null;
  isDeletingChat: boolean;
  chatDeletionError: string | null;
  sentMessage: SendMessageResponse | null;
  isSendingMessage: boolean;
  messageSendingError: string | null;
  chatMessage: Message[];
  isGettingChatMessages: boolean;
  chatMessagesError: string | null;
  userChats: getChatsResponse[] | null;
  isLoadingUserChats: boolean;
  UserChatsError: string | null;

  createChat: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, message: string) => Promise<void>;
  getChatMessages: (chatId: string) => Promise<void>;
  getUserChats: () => Promise<void>;
}

export const useChatStore = create<ChatDetails>()((set, get) => ({
  chatCreation: null,
  isCreatingChat: false,
  chatCreationError: null,
  chatDeletion: null,
  isDeletingChat: false,
  chatDeletionError: null,
  sentMessage: null,
  isSendingMessage: false,
  messageSendingError: null,
  chatMessage: [],
  isGettingChatMessages: false,
  chatMessagesError: null,
  userChats: [],
  isLoadingUserChats: false,
  UserChatsError: null,

  createChat: async () => {
    set({ isCreatingChat: true, chatCreationError: null });
    try {
      const response = await axios.post(`${API_URL}/chat/createChat`);
      set({
        chatCreation: response.data,
        isCreatingChat: false,
        chatCreationError: null,
      });
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while creating chat";
      set({ isCreatingChat: false, chatCreationError: errMsg });
      throw new Error(errMsg);
    }
  },

  deleteChat: async (chatId) => {
    set({ isDeletingChat: true, chatDeletionError: null });

    try {
      const response = await axios.delete(`${API_URL}/chat/deleteChat`, {
        params: { chatId },
      });
      set({
        chatDeletion: response.data,
        isDeletingChat: false,
        chatDeletionError: null,
      });
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred during deleting chat";
      set({ isDeletingChat: false, chatDeletionError: errMsg });
      throw new Error(errMsg);
    }
  },

  sendMessage: async (chatId, message) => {
    set({ isSendingMessage: true, messageSendingError: null });

    try {
      const response = await axios.post(
        `${API_URL}/chat/sendMessage`,
        { message },
        { params: { chatId } }
      );
      set({
        sentMessage: response.data,
        isSendingMessage: false,
        messageSendingError: null,
      });
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while sending message";
      set({ isSendingMessage: false, messageSendingError: errMsg });
      throw new Error(errMsg);
    }
  },

  getChatMessages: async (chatId) => {
    set({ isGettingChatMessages: true, chatMessagesError: null });

    try {
      const response = await axios.get(`${API_URL}/chat/getMessages`, {
        params: { chatId },
      });
      set({
        chatMessage: response.data,
        isGettingChatMessages: false,
        chatMessagesError: null,
      });
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while getting chat messages";
      set({ isGettingChatMessages: false, chatMessagesError: errMsg });
      throw new Error(errMsg);
    }
  },

  getUserChats: async () => {
    set({ isLoadingUserChats: true, UserChatsError: null });

    try {
      const response = await axios.get(`${API_URL}/chat/getUserChats`);

      set({
        userChats: response.data,
        isLoadingUserChats: false,
        UserChatsError: null,
      });
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while getting user chats";
      set({ isLoadingUserChats: false, UserChatsError: errMsg });
      throw new Error(errMsg);
    }
  },
}));

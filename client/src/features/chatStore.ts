import axios from "axios";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

axios.defaults.withCredentials = true;

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
  userMessage: Message;
  aiMessage: Message;
  isGuest: boolean;
}

export interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  status: "sent" | "sending" | "error";
  updatedAt: string;
}

export interface getChatsResponse {
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
  userChats: getChatsResponse[];
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
    // Generate temporary ID for optimistic message
    const tempId = `temp-${Date.now()}`;

    // STEP 1: Add optimistic user message immediately
    const optimisticUserMessage: Message = {
      id: tempId,
      text: message,
      role: "user",
      status: "sending",
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      isSendingMessage: true,
      messageSendingError: null,
      chatMessage: [...state.chatMessage, optimisticUserMessage],
    }));

    try {
      // STEP 2: Send to backend
      const response = await axios.post(
        `${API_URL}/chat/sendMessage`,
        { message },
        { params: { chatId } }
      );

      // STEP 3: Replace optimistic message with real messages from server
      set((state) => {
        const messagesWithoutTemp = state.chatMessage.filter(
          (m) => m.id !== tempId
        );

        return {
          sentMessage: response.data,
          isSendingMessage: false,
          messageSendingError: null,
          chatMessage: [
            ...messagesWithoutTemp,
            response.data.userMessage,
            response.data.aiMessage,
          ],
        };
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while sending message";

      // STEP 4: Mark optimistic message as error
      set((state) => ({
        isSendingMessage: false,
        messageSendingError: errMsg,
        chatMessage: state.chatMessage.map((msg) =>
          msg.id === tempId ? { ...msg, status: "error" as const } : msg
        ),
      }));

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
        userChats: response.data.chats,
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

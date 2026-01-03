import axios from "axios";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

axios.defaults.withCredentials = true;

interface ChatCreationResponse {
  success: boolean;
  message: string;
  chatId: string;
}

interface ChatDeletionResponse {
  success: boolean;
  message: string;
}

interface SendMessageResponse {
  success: boolean;
  userMessage: Message;
  aiMessage: Message;
}

export interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  status: "sent" | "sending" | "thinking" | "error" | "aborted";
  updatedAt: string;
}

export interface getChatsResponse {
  id: string;
  title: string;
}

interface ChatDetails {
  // View state
  activeChatId: string | null;

  // Data state - chat-scoped
  chatMessageMap: Record<string, Message[]>;

  // Derived UI state (computed from activeChatId)
  chatMessage: Message[];

  // Deletion tracking
  deletedChatIds: Set<string>;

  // Polling management - message-scoped
  activePollingSessions: Map<string, string>; // messageId -> chatId

  // Loading states
  chatCreation: ChatCreationResponse | null;
  isCreatingChat: boolean;
  chatCreationError: string | null;
  chatDeletion: ChatDeletionResponse | null;
  isDeletingChat: boolean;
  chatDeletionError: string | null;
  sentMessage: SendMessageResponse | null;
  isSendingMessage: boolean;
  messageSendingError: string | null;
  isGettingChatMessages: boolean;
  chatMessagesError: string | null;
  userChats: getChatsResponse[];
  isLoadingUserChats: boolean;
  UserChatsError: string | null;
  isAIGenerating: boolean;

  // Actions
  createChat: () => Promise<string | null>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, message: string) => Promise<void>;
  getChatMessages: (chatId: string) => Promise<void>;
  getUserChats: () => Promise<void>;
  moveChatToTop: (chatId: string) => void;
  setActiveChatId: (chatId: string | null) => void;
  resetStore: () => void;
  abortAIGeneration: (messageId: string) => void;
}

export const useChatStore = create<ChatDetails>()((set, get) => ({
  // View state
  activeChatId: null,

  // Data state
  chatMessageMap: {},
  chatMessage: [],

  // Deletion tracking
  deletedChatIds: new Set(),

  // Polling
  activePollingSessions: new Map(),

  // Loading states
  chatCreation: null,
  isCreatingChat: false,
  chatCreationError: null,
  chatDeletion: null,
  isDeletingChat: false,
  chatDeletionError: null,
  sentMessage: null,
  isSendingMessage: false,
  messageSendingError: null,
  isGettingChatMessages: false,
  chatMessagesError: null,
  userChats: [],
  isLoadingUserChats: false,
  UserChatsError: null,
  isAIGenerating: false,

  createChat: async () => {
    const tempId = `temp-chat-${Date.now()}`;

    const optimisticChat: getChatsResponse = {
      id: tempId,
      title: "New Chat",
    };

    set((state) => ({
      isCreatingChat: true,
      chatCreationError: null,
      userChats: [optimisticChat, ...state.userChats],
    }));

    try {
      const response = await axios.post(`${API_URL}/chat/createChat`);

      set((state) => ({
        chatCreation: response.data,
        isCreatingChat: false,
        chatCreationError: null,
        userChats: state.userChats.map((chat) =>
          chat.id === tempId
            ? { id: response.data.chatId, title: "New Chat" }
            : chat
        ),
      }));

      return response.data.chatId;
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while creating chat";

      set((state) => ({
        isCreatingChat: false,
        chatCreationError: errMsg,
        userChats: state.userChats.filter((chat) => chat.id !== tempId),
      }));

      throw new Error(errMsg);
    }
  },

  deleteChat: async (chatId) => {
    const { activePollingSessions, deletedChatIds, activeChatId } = get();

    set({ isDeletingChat: true, chatDeletionError: null });

    // 1️⃣ MARK CHAT AS DELETED (ATOMIC & FINAL)
    const newDeletedIds = new Set(deletedChatIds);
    newDeletedIds.add(chatId);

    // 2️⃣ KILL ALL POLLING FOR THIS CHAT
    const newPollingSessions = new Map(activePollingSessions);
    const sessionsToRemove: string[] = [];

    activePollingSessions.forEach((chatIdForSession, messageId) => {
      if (chatIdForSession === chatId) {
        sessionsToRemove.push(messageId);
      }
    });

    sessionsToRemove.forEach((msgId) => newPollingSessions.delete(msgId));

    // 3️⃣ REMOVE FROM MESSAGE MAP
    set((state) => {
      const newMessageMap = { ...state.chatMessageMap };
      delete newMessageMap[chatId];

      return {
        deletedChatIds: newDeletedIds,
        activePollingSessions: newPollingSessions,
        isAIGenerating: newPollingSessions.size > 0,
        chatMessageMap: newMessageMap,
        userChats: state.userChats.filter((chat) => chat.id !== chatId),
        ...(activeChatId === chatId
          ? {
              activeChatId: null,
              chatMessage: [],
            }
          : {}),
      };
    });

    try {
      const response = await axios.delete(`${API_URL}/chat/deleteChat`, {
        params: { chatId },
      });

      set({
        chatDeletion: response.data,
        isDeletingChat: false,
        chatDeletionError: null,
      });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred during deleting chat";
      set({ isDeletingChat: false, chatDeletionError: errMsg });

      try {
        const response = await axios.get(`${API_URL}/chat/getUserChats`);
        set({ userChats: response.data.chats });
      } catch (refetchError) {
        console.error("Failed to refetch after delete error:", refetchError);
      }

      throw new Error(errMsg);
    }
  },

  sendMessage: async (chatId, message) => {
    const { deletedChatIds, chatMessageMap } = get();

    if (deletedChatIds.has(chatId)) {
      console.error("Cannot send message to deleted chat");
      return;
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticUserMessage: Message = {
      id: tempId,
      text: message,
      role: "user",
      status: "sending",
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      const currentMessages = state.chatMessageMap[chatId] || [];
      const newMessageMap = {
        ...state.chatMessageMap,
        [chatId]: [...currentMessages, optimisticUserMessage],
      };

      return {
        isSendingMessage: true,
        messageSendingError: null,
        chatMessageMap: newMessageMap,
        ...(state.activeChatId === chatId
          ? {
              chatMessage: newMessageMap[chatId],
            }
          : {}),
      };
    });

    try {
      const response = await axios.post(
        `${API_URL}/chat/sendMessage`,
        { message },
        { params: { chatId } }
      );

      const currentState = get();

      if (currentState.deletedChatIds.has(chatId)) {
        console.log("Chat was deleted during send, discarding response");
        return;
      }

      set((state) => {
        const currentMessages = state.chatMessageMap[chatId] || [];
        const messagesWithoutTemp = currentMessages.filter(
          (m) => m.id !== tempId
        );

        const newMessageMap = {
          ...state.chatMessageMap,
          [chatId]: [
            ...messagesWithoutTemp,
            response.data.userMessage,
            response.data.aiMessage,
          ],
        };

        return {
          sentMessage: response.data,
          isSendingMessage: false,
          messageSendingError: null,
          chatMessageMap: newMessageMap,
          isAIGenerating: true,
          ...(state.activeChatId === chatId
            ? {
                chatMessage: newMessageMap[chatId],
              }
            : {}),
        };
      });

      // 🔥 START MESSAGE-SCOPED POLLING (NOT CHAT-SCOPED)
      if (!response.data.isGuest) {
        const aiMessageId = response.data.aiMessage.id;
        startPollingForSingleMessage(chatId, aiMessageId, set, get);
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while sending message";

      set((state) => {
        const currentMessages = state.chatMessageMap[chatId] || [];
        const newMessageMap = {
          ...state.chatMessageMap,
          [chatId]: currentMessages.map((msg) =>
            msg.id === tempId ? { ...msg, status: "error" as const } : msg
          ),
        };

        return {
          isSendingMessage: false,
          messageSendingError: errMsg,
          isAIGenerating: false,
          chatMessageMap: newMessageMap,
          ...(state.activeChatId === chatId
            ? {
                chatMessage: newMessageMap[chatId],
              }
            : {}),
        };
      });

      throw new Error(errMsg);
    }
  },

  // 🔥 CRITICAL: This is THE ONLY place that fetches full message list
  getChatMessages: async (chatId) => {
    const { deletedChatIds } = get();

    if (deletedChatIds.has(chatId)) {
      console.log("Chat is deleted, skipping fetch");
      return;
    }

    set({ isGettingChatMessages: true, chatMessagesError: null });

    try {
      const response = await axios.get(`${API_URL}/chat/getMessages`, {
        params: { chatId },
      });

      const currentState = get();

      if (currentState.deletedChatIds.has(chatId)) {
        console.log("Chat was deleted during fetch, discarding messages");
        set({ isGettingChatMessages: false });
        return;
      }

      const messages: Message[] = response.data;

      // Store in chat-scoped map
      set((state) => {
        const newMessageMap = {
          ...state.chatMessageMap,
          [chatId]: messages,
        };

        return {
          chatMessageMap: newMessageMap,
          isGettingChatMessages: false,
          chatMessagesError: null,
          ...(state.activeChatId === chatId
            ? {
                chatMessage: newMessageMap[chatId],
              }
            : {}),
        };
      });

      // Resume polling for any thinking messages
      const thinkingMessages = messages.filter(
        (msg) => msg.status === "thinking" && msg.role === "assistant"
      );

      if (thinkingMessages.length > 0) {
        console.log(
          `Found ${thinkingMessages.length} thinking message(s), resuming polling...`
        );

        set({ isAIGenerating: true });

        thinkingMessages.forEach((msg) => {
          startPollingForSingleMessage(chatId, msg.id, set, get);
        });
      }
    } catch (error: any) {
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
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while getting user chats";
      set({ isLoadingUserChats: false, UserChatsError: errMsg });
      throw new Error(errMsg);
    }
  },

  moveChatToTop: (chatId: string) => {
    set((state) => {
      const chatIndex = state.userChats.findIndex((chat) => chat.id === chatId);
      if (chatIndex === -1 || chatIndex === 0) return state;

      const newChats = [...state.userChats];
      const [movedChat] = newChats.splice(chatIndex, 1);
      newChats.unshift(movedChat);

      return { userChats: newChats };
    });
  },

  setActiveChatId: (chatId: string | null) => {
    set((state) => {
      const chatMessage = chatId ? state.chatMessageMap[chatId] || [] : [];

      return {
        activeChatId: chatId,
        chatMessage,
      };
    });
  },

  resetStore: () => {
    const { activePollingSessions } = get();
    activePollingSessions.clear();

    set({
      activeChatId: null,
      chatMessageMap: {},
      chatMessage: [],
      deletedChatIds: new Set(),
      activePollingSessions: new Map(),
      chatCreation: null,
      isCreatingChat: false,
      chatCreationError: null,
      chatDeletion: null,
      isDeletingChat: false,
      chatDeletionError: null,
      sentMessage: null,
      isSendingMessage: false,
      messageSendingError: null,
      isGettingChatMessages: false,
      chatMessagesError: null,
      userChats: [],
      isLoadingUserChats: false,
      UserChatsError: null,
      isAIGenerating: false,
    });
  },

  abortAIGeneration: async (messageId: string) => {
    const { activePollingSessions } = get();

    const chatId = activePollingSessions.get(messageId);
    if (!chatId) {
      console.log("No active polling session for message", messageId);
      return;
    }

    // 🔥 CRITICAL: Update UI state FIRST, then cancel polling
    // This ensures UI shows "aborted" before polling loop checks cancellation
    set((state) => {
      const newSessions = new Map(state.activePollingSessions);
      newSessions.delete(messageId);

      const currentMessages = state.chatMessageMap[chatId] || [];
      const newMessageMap = {
        ...state.chatMessageMap,
        [chatId]: currentMessages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: "aborted" as const,
                text: "Generation aborted by user",
              }
            : msg
        ),
      };

      return {
        activePollingSessions: newSessions,
        isAIGenerating: newSessions.size > 0,
        chatMessageMap: newMessageMap,
        ...(state.activeChatId === chatId
          ? {
              chatMessage: newMessageMap[chatId],
            }
          : {}),
      };
    });

    // Call backend to persist abort (non-blocking)
    try {
      await axios.post(`${API_URL}/chat/abortMessage`, null, {
        params: { messageId },
      });
      console.log(`Aborted AI generation for message ${messageId}`);
    } catch (error) {
      console.error("Failed to abort message on server:", error);
    }
  },
}));

// =========================================================
// 🔥 MESSAGE-SCOPED POLLING - FETCHES ONLY ONE MESSAGE
// =========================================================
const startPollingForSingleMessage = async (
  chatId: string,
  messageId: string,
  set: any,
  get: any
) => {
  const { activePollingSessions, deletedChatIds } = get();

  if (deletedChatIds.has(chatId)) {
    console.log(`Chat ${chatId} is deleted, not starting polling`);
    return;
  }

  if (activePollingSessions.has(messageId)) {
    console.log(`Polling already active for message ${messageId}`);
    return;
  }

  // Register polling session
  const newSessions = new Map(activePollingSessions);
  newSessions.set(messageId, chatId);

  set({
    activePollingSessions: newSessions,
    isAIGenerating: true,
  });

  const maxAttempts = 60;
  const pollInterval = 1000;
  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;

      const currentState = get();

      // Check if chat was deleted
      if (currentState.deletedChatIds.has(chatId)) {
        console.log(`Chat ${chatId} was deleted, stopping polling`);

        const updatedSessions = new Map(currentState.activePollingSessions);
        updatedSessions.delete(messageId);

        set({
          activePollingSessions: updatedSessions,
          isAIGenerating: updatedSessions.size > 0,
        });
        return;
      }

      // Check if polling was cancelled
      if (!currentState.activePollingSessions.has(messageId)) {
        console.log(`Polling session ${messageId} was cancelled`);
        return;
      }

      // 🔥 CRITICAL: Fetch ONLY this single message (not entire chat)
      const response = await axios.get(`${API_URL}/chat/message/${messageId}`);

      // Handle chat deletion response
      if (response.status === 410) {
        console.log(`Chat was deleted for message ${messageId}`);

        const updatedSessions = new Map(currentState.activePollingSessions);
        updatedSessions.delete(messageId);

        set({
          activePollingSessions: updatedSessions,
          isAIGenerating: updatedSessions.size > 0,
        });
        return;
      }

      const stateAfterFetch = get();

      if (stateAfterFetch.deletedChatIds.has(chatId)) {
        console.log(`Chat ${chatId} was deleted during fetch, stopping`);
        return;
      }

      const updatedMessage: Message = response.data.message;

      // 🔥 CRITICAL: Check if message was aborted while we were fetching
      const stateAfterFetch2 = get();
      if (!stateAfterFetch2.activePollingSessions.has(messageId)) {
        console.log(
          `Message ${messageId} was aborted during fetch, not updating`
        );
        return;
      }

      // Also check the current state - if already aborted, don't overwrite
      const currentMessages = stateAfterFetch2.chatMessageMap[chatId] || [];
      const existingMessage = currentMessages.find((m) => m.id === messageId);
      if (existingMessage?.status === "aborted") {
        console.log(`Message ${messageId} is already aborted, not updating`);
        return;
      }

      // 🔥 UPDATE ONLY THIS ONE MESSAGE (never replace entire array)
      set((state: any) => {
        const currentMessages = state.chatMessageMap[chatId] || [];
        const newMessageMap = {
          ...state.chatMessageMap,
          [chatId]: currentMessages.map((msg: Message) =>
            msg.id === messageId ? updatedMessage : msg
          ),
        };

        return {
          chatMessageMap: newMessageMap,
          ...(state.activeChatId === chatId
            ? {
                chatMessage: newMessageMap[chatId],
              }
            : {}),
        };
      });

      // Stop if complete
      if (
        updatedMessage.status === "sent" ||
        updatedMessage.status === "error" ||
        updatedMessage.status === "aborted"
      ) {
        console.log(`Message ${messageId} completed: ${updatedMessage.status}`);

        const finalState = get();
        const finalSessions = new Map(finalState.activePollingSessions);
        finalSessions.delete(messageId);

        set({
          activePollingSessions: finalSessions,
          isAIGenerating: finalSessions.size > 0,
        });
        return;
      }

      // Continue polling
      if (attempts < maxAttempts && updatedMessage.status === "thinking") {
        setTimeout(poll, pollInterval);
      } else if (attempts >= maxAttempts) {
        console.warn(`Polling timeout for message ${messageId}`);

        set((state: any) => {
          const finalSessions = new Map(state.activePollingSessions);
          finalSessions.delete(messageId);

          const currentMessages = state.chatMessageMap[chatId] || [];
          const newMessageMap = {
            ...state.chatMessageMap,
            [chatId]: currentMessages.map((msg: Message) =>
              msg.id === messageId
                ? { ...msg, status: "error" as const, text: "Response timeout" }
                : msg
            ),
          };

          return {
            chatMessageMap: newMessageMap,
            activePollingSessions: finalSessions,
            isAIGenerating: finalSessions.size > 0,
            ...(state.activeChatId === chatId
              ? {
                  chatMessage: newMessageMap[chatId],
                }
              : {}),
          };
        });
      }
    } catch (error: any) {
      console.error("Error polling for message:", error);

      // Handle 404/410 (message or chat deleted)
      if (error.response?.status === 404 || error.response?.status === 410) {
        console.log(`Message or chat no longer exists: ${messageId}`);

        const errorState = get();
        const errorSessions = new Map(errorState.activePollingSessions);
        errorSessions.delete(messageId);

        set({
          activePollingSessions: errorSessions,
          isAIGenerating: errorSessions.size > 0,
        });
        return;
      }

      // Retry on network errors
      if (attempts < 3) {
        setTimeout(poll, pollInterval * 2);
      } else {
        const errorState = get();
        const errorSessions = new Map(errorState.activePollingSessions);
        errorSessions.delete(messageId);

        set({
          activePollingSessions: errorSessions,
          isAIGenerating: errorSessions.size > 0,
        });
      }
    }
  };

  setTimeout(poll, pollInterval);
};

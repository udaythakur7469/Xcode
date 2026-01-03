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
  activePollingSessions: Set<string>;
  isAIGenerating: boolean;

  createChat: () => Promise<string | null>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, message: string) => Promise<void>;
  getChatMessages: (chatId: string) => Promise<void>;
  getUserChats: () => Promise<void>;
  moveChatToTop: (chatId: string) => void;
  clearMessages: () => void;
  resetStore: () => void;
  abortAIGeneration: (messageId: string) => void;
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
  activePollingSessions: new Set(),
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
    set({ isDeletingChat: true, chatDeletionError: null });

    // ✅ Stop all polling sessions for this chat
    const { activePollingSessions } = get();
    const sessionsToCancel = Array.from(activePollingSessions).filter(
      (session) => session.startsWith(`${chatId}-`)
    );

    sessionsToCancel.forEach((session) => {
      activePollingSessions.delete(session);
    });

    set({
      activePollingSessions: new Set(activePollingSessions),
      isAIGenerating: activePollingSessions.size > 0,
    });

    // ✅ Optimistically remove from UI
    set((state) => ({
      userChats: state.userChats.filter((chat) => chat.id !== chatId),
    }));

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

      // ✅ On error, refetch to get correct state
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
    const tempId = `temp-${Date.now()}`;

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
      const response = await axios.post(
        `${API_URL}/chat/sendMessage`,
        { message },
        { params: { chatId } }
      );

      set((state) => {
        const messagesWithoutTemp = state.chatMessage.filter(
          (m) => m.id !== tempId
        );

        const updatedChats = state.userChats;

        return {
          sentMessage: response.data,
          isSendingMessage: false,
          messageSendingError: null,
          chatMessage: [
            ...messagesWithoutTemp,
            response.data.userMessage,
            response.data.aiMessage,
          ],
          userChats: updatedChats,
          isAIGenerating: true,
        };
      });

      // 4️⃣ START POLLING FOR AI MESSAGE UPDATES (For logged-in users only)
      if (!response.data.isGuest) {
        const aiMessageId = response.data.aiMessage.id;
        startPollingForMessage(chatId, aiMessageId, set, get);
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        "An error occurred while sending message";

      set((state) => ({
        isSendingMessage: false,
        messageSendingError: errMsg,
        isAIGenerating: false,
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

      const messages: Message[] = response.data;

      set({
        chatMessage: response.data,
        isGettingChatMessages: false,
        chatMessagesError: null,
      });

      const thinkingMessages = messages.filter(
        (msg) => msg.status === "thinking" && msg.role === "assistant"
      );

      if (thinkingMessages.length > 0) {
        console.log(
          `Found ${thinkingMessages.length} thinking message(s), resuming polling...`
        );

        set({ isAIGenerating: true });

        thinkingMessages.forEach((msg) => {
          startPollingForMessage(chatId, msg.id, set, get);
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

  clearMessages: () => {
    set({ chatMessage: [] });
  },

  resetStore: () => {
    const { activePollingSessions } = get();
    activePollingSessions.clear();

    set({
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
    });
  },

  abortAIGeneration: async (messageId: string) => {
    const { activePollingSessions } = get();

    // Find and remove the polling session for this message
    const sessionToRemove = Array.from(activePollingSessions).find((session) =>
      session.endsWith(`-${messageId}`)
    );

    if (sessionToRemove) {
      // Remove the polling session (this will stop the polling loop)
      set((state) => {
        const newSessions = new Set(state.activePollingSessions);
        newSessions.delete(sessionToRemove);

        return {
          activePollingSessions: newSessions,
          isAIGenerating: newSessions.size > 0,
          chatMessage: state.chatMessage.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  status: "aborted" as const,
                  text: "Generation aborted by user",
                }
              : msg
          ),
        };
      });

      // ✅ Call backend to mark message as aborted in database
      try {
        await axios.post(`${API_URL}/chat/abortMessage`, null, {
          params: { messageId },
        });
        console.log(`Aborted AI generation for message ${messageId}`);
      } catch (error) {
        console.error("Failed to abort message on server:", error);
      }
    }
  },
}));

const startPollingForMessage = async (
  chatId: string,
  aiMessageId: string,
  set: any,
  get: any
) => {
  // Prevent duplicate polling sessions for the same message
  const { activePollingSessions } = get();
  const sessionKey = `${chatId}-${aiMessageId}`;

  if (activePollingSessions.has(sessionKey)) {
    console.log(
      `Polling already active for message ${aiMessageId}, skipping...`
    );
    return;
  }

  // Mark this session as active
  set((state: any) => ({
    activePollingSessions: new Set(state.activePollingSessions).add(sessionKey),
    isAIGenerating: true,
  }));

  const maxAttempts = 60;
  const pollInterval = 1000;
  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;

      // ✅ Check if polling session is still active (abort check)
      const currentState = get();
      if (!currentState.activePollingSessions.has(sessionKey)) {
        console.log(`Polling session ${sessionKey} was cancelled`);
        set((state: any) => ({
          isAIGenerating: state.activePollingSessions.size > 0,
        }));
        return;
      }

      // Fetch updated messages
      const response = await axios.get(`${API_URL}/chat/getMessages`, {
        params: { chatId },
      });

      const messages: Message[] = response.data;
      const aiMessage = messages.find((m) => m.id === aiMessageId);

      // ✅ If AI message not found, it might have been deleted with the chat
      if (!aiMessage) {
        console.log(
          `AI message ${aiMessageId} not found - chat may have been deleted`
        );

        set((state: any) => {
          const newSessions = new Set(state.activePollingSessions);
          newSessions.delete(sessionKey);
          return {
            activePollingSessions: newSessions,
            isAIGenerating: newSessions.size > 0,
          };
        });
        return;
      }

      // Update the AI message in state
      set((state: any) => ({
        chatMessage: state.chatMessage.map((msg: Message) =>
          msg.id === aiMessageId ? aiMessage : msg
        ),
      }));

      // Stop polling if AI message is complete or aborted
      if (
        aiMessage.status === "sent" ||
        aiMessage.status === "error" ||
        aiMessage.status === "aborted"
      ) {
        console.log(
          `AI message ${aiMessageId} completed with status: ${aiMessage.status}`
        );

        set((state: any) => {
          const newSessions = new Set(state.activePollingSessions);
          newSessions.delete(sessionKey);
          return {
            activePollingSessions: newSessions,
            isAIGenerating: newSessions.size > 0,
          };
        });
        return;
      }

      // Continue polling if still thinking and under max attempts
      if (attempts < maxAttempts && aiMessage.status === "thinking") {
        setTimeout(poll, pollInterval);
      } else if (attempts >= maxAttempts) {
        console.warn(`Polling timeout for message ${aiMessageId}`);

        set((state: any) => {
          const newSessions = new Set(state.activePollingSessions);
          newSessions.delete(sessionKey);

          return {
            chatMessage: state.chatMessage.map((msg: Message) =>
              msg.id === aiMessageId
                ? { ...msg, status: "error" as const, text: "Response timeout" }
                : msg
            ),
            activePollingSessions: newSessions,
            isAIGenerating: newSessions.size > 0,
          };
        });
      }
    } catch (error) {
      console.error("Error polling for AI message update:", error);

      // On error, retry a few times before giving up
      if (attempts < 3) {
        setTimeout(poll, pollInterval * 2);
      } else {
        set((state: any) => {
          const newSessions = new Set(state.activePollingSessions);
          newSessions.delete(sessionKey);
          return {
            activePollingSessions: newSessions,
            isAIGenerating: newSessions.size > 0,
          };
        });
      }
    }
  };

  setTimeout(poll, pollInterval);
};

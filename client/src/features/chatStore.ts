import axios from "axios";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

axios.defaults.withCredentials = true;

// ─────────────────────────────────────────────
// localStorage helpers
// Drafts are persisted per chatId.
// Key format: nova_input_draft_{chatId}
// ─────────────────────────────────────────────

const LS_PREFIX = "nova_input_draft_";

function lsGetDraft(chatId: string): string {
  try {
    return localStorage.getItem(LS_PREFIX + chatId) ?? "";
  } catch {
    return "";
  }
}

function lsSetDraft(chatId: string, text: string) {
  try {
    if (text) {
      localStorage.setItem(LS_PREFIX + chatId, text);
    } else {
      localStorage.removeItem(LS_PREFIX + chatId);
    }
  } catch {}
}

function lsRemoveDraft(chatId: string) {
  try {
    localStorage.removeItem(LS_PREFIX + chatId);
  } catch {}
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  status: "sent" | "sending" | "thinking" | "error" | "aborted";
  updatedAt: string;
  createdAt: string;
}

export interface ChatListItem {
  id: string;
  title: string;
}

export type AiModel = "chatgpt" | "claude" | "gemini";

export interface EditingState {
  chatId: string;
  messageId: string;
}

interface ChatState {
  // View
  activeChatId: string | null;
  aiModel: AiModel;

  // Data
  chatMessageMap: Record<string, Message[]>;
  chatMessage: Message[];

  // Guards
  deletedChatIds: Set<string>;
  activePollingSessions: Map<string, string>; // messageId → chatId

  // Chats list
  userChats: ChatListItem[];
  isLoadingUserChats: boolean;
  UserChatsError: string | null;

  // Loading flags
  isCreatingChat: boolean;
  isDeletingChat: boolean;
  isSendingMessage: boolean;
  isGettingChatMessages: boolean;
  isAIGenerating: boolean;

  // Error flags
  chatCreationError: string | null;
  chatDeletionError: string | null;
  messageSendingError: string | null;
  chatMessagesError: string | null;

  // Draft & edit state
  inputDrafts: Record<string, string>;
  editingState: EditingState | null;

  // Actions
  setAiModel: (model: AiModel) => void;
  setActiveChatId: (chatId: string | null) => void;

  // Draft actions
  setInputDraft: (chatId: string, text: string) => void;
  clearInputDraft: (chatId: string) => void;
  getInputDraft: (chatId: string) => string;

  // Edit state
  setEditingState: (state: EditingState | null) => void;

  // Chat actions
  createChat: () => Promise<string | null>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, message: string) => Promise<void>;
  regenerateMessage: (chatId: string, userMessageId: string) => Promise<void>;
  editAndResendMessage: (
    chatId: string,
    userMessageId: string,
    newText: string,
  ) => Promise<void>;
  getChatMessages: (chatId: string) => Promise<void>;
  getUserChats: () => Promise<void>;
  moveChatToTop: (chatId: string) => void;
  abortAIGeneration: (messageId: string) => Promise<void>;
  resetStore: () => void;
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useChatStore = create<ChatState>()((set, get) => ({
  activeChatId: null,
  aiModel: "chatgpt",
  chatMessageMap: {},
  chatMessage: [],
  deletedChatIds: new Set(),
  activePollingSessions: new Map(),
  userChats: [],
  isLoadingUserChats: false,
  UserChatsError: null,
  isCreatingChat: false,
  isDeletingChat: false,
  isSendingMessage: false,
  isGettingChatMessages: false,
  isAIGenerating: false,
  chatCreationError: null,
  chatDeletionError: null,
  messageSendingError: null,
  chatMessagesError: null,
  inputDrafts: {},
  editingState: null,

  // ── Setters ──────────────────────────────────

  setAiModel: (model) => set({ aiModel: model }),

  setActiveChatId: (chatId) => {
    set((state) => ({
      activeChatId: chatId,
      chatMessage: chatId ? (state.chatMessageMap[chatId] ?? []) : [],
    }));
  },

  // ── Draft actions ─────────────────────────────

  setInputDraft: (chatId, text) => {
    lsSetDraft(chatId, text);
    set((state) => ({
      inputDrafts: { ...state.inputDrafts, [chatId]: text },
    }));
  },

  clearInputDraft: (chatId) => {
    lsRemoveDraft(chatId);
    set((state) => {
      const next = { ...state.inputDrafts };
      delete next[chatId];
      return { inputDrafts: next };
    });
  },

  getInputDraft: (chatId) => lsGetDraft(chatId),

  // ── Edit state ────────────────────────────────

  setEditingState: (editingState) => set({ editingState }),

  // ── Create Chat ───────────────────────────────

  createChat: async () => {
    const tempId = `temp-${Date.now()}`;
    set((state) => ({
      isCreatingChat: true,
      chatCreationError: null,
      userChats: [{ id: tempId, title: "New Chat" }, ...state.userChats],
    }));

    try {
      const res = await axios.post(`${API_URL}/chat/createChat`);
      const realId: string = res.data.chatId;
      set((state) => ({
        isCreatingChat: false,
        userChats: state.userChats.map((c) =>
          c.id === tempId ? { id: realId, title: "New Chat" } : c,
        ),
      }));
      return realId;
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to create chat";
      set((state) => ({
        isCreatingChat: false,
        chatCreationError: msg,
        userChats: state.userChats.filter((c) => c.id !== tempId),
      }));
      throw new Error(msg);
    }
  },

  // ── Delete Chat ───────────────────────────────

  deleteChat: async (chatId) => {
    const { activePollingSessions, deletedChatIds, activeChatId } = get();

    const newDeletedIds = new Set(deletedChatIds);
    newDeletedIds.add(chatId);

    const newSessions = new Map(activePollingSessions);
    newSessions.forEach((cId, msgId) => {
      if (cId === chatId) newSessions.delete(msgId);
    });

    lsRemoveDraft(chatId);

    set((state) => {
      const newMap = { ...state.chatMessageMap };
      delete newMap[chatId];

      const newDrafts = { ...state.inputDrafts };
      delete newDrafts[chatId];

      return {
        isDeletingChat: true,
        chatDeletionError: null,
        deletedChatIds: newDeletedIds,
        activePollingSessions: newSessions,
        isAIGenerating: newSessions.size > 0,
        chatMessageMap: newMap,
        inputDrafts: newDrafts,
        userChats: state.userChats.filter((c) => c.id !== chatId),
        editingState:
          state.editingState?.chatId === chatId ? null : state.editingState,
        ...(activeChatId === chatId
          ? { activeChatId: null, chatMessage: [] }
          : {}),
      };
    });

    try {
      await axios.delete(`${API_URL}/chat/deleteChat`, { params: { chatId } });
      set({ isDeletingChat: false });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to delete chat";
      set({ isDeletingChat: false, chatDeletionError: msg });
      try {
        const res = await axios.get(`${API_URL}/chat/getUserChats`);
        set({ userChats: res.data.chats });
      } catch {}
      throw new Error(msg);
    }
  },

  // ── Send Message ──────────────────────────────

  sendMessage: async (chatId, message) => {
    const { deletedChatIds, aiModel } = get();
    if (deletedChatIds.has(chatId)) return;

    const tempId = `temp-msg-${Date.now()}`;
    const now = new Date().toISOString();

    const optimisticMsg: Message = {
      id: tempId,
      text: message,
      role: "user",
      status: "sending",
      updatedAt: now,
      createdAt: now,
    };

    set((state) => {
      const current = state.chatMessageMap[chatId] ?? [];
      const newMap = {
        ...state.chatMessageMap,
        [chatId]: [...current, optimisticMsg],
      };
      return {
        isSendingMessage: true,
        messageSendingError: null,
        chatMessageMap: newMap,
        ...(state.activeChatId === chatId
          ? { chatMessage: newMap[chatId] }
          : {}),
      };
    });

    try {
      const res = await axios.post(
        `${API_URL}/chat/sendMessage`,
        { message, regenerate: false, aiModel },
        { params: { chatId } },
      );

      if (get().deletedChatIds.has(chatId)) return;

      const { userMessage, aiMessage } = res.data;

      set((state) => {
        const current = state.chatMessageMap[chatId] ?? [];
        const withoutTemp = current.filter((m) => m.id !== tempId);
        const newMap = {
          ...state.chatMessageMap,
          [chatId]: [...withoutTemp, userMessage, aiMessage],
        };
        return {
          isSendingMessage: false,
          messageSendingError: null,
          isAIGenerating: true,
          chatMessageMap: newMap,
          ...(state.activeChatId === chatId
            ? { chatMessage: newMap[chatId] }
            : {}),
        };
      });

      startPolling(chatId, aiMessage.id, set, get);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to send message";
      set((state) => {
        const current = state.chatMessageMap[chatId] ?? [];
        const newMap = {
          ...state.chatMessageMap,
          [chatId]: current.map((m) =>
            m.id === tempId ? { ...m, status: "error" as const } : m,
          ),
        };
        return {
          isSendingMessage: false,
          messageSendingError: msg,
          isAIGenerating: false,
          chatMessageMap: newMap,
          ...(state.activeChatId === chatId
            ? { chatMessage: newMap[chatId] }
            : {}),
        };
      });
      throw new Error(msg);
    }
  },

  // ── Regenerate Message ────────────────────────

  regenerateMessage: async (chatId, userMessageId) => {
    const { deletedChatIds, aiModel, chatMessageMap } = get();
    if (deletedChatIds.has(chatId)) return;

    const msgs = chatMessageMap[chatId] ?? [];
    const userMsgIndex = msgs.findIndex((m) => m.id === userMessageId);
    if (userMsgIndex === -1) return;

    const userMsg = msgs[userMsgIndex];
    const now = new Date().toISOString();
    const tempAiId = `temp-ai-${Date.now()}`;

    const thinkingPlaceholder: Message = {
      id: tempAiId,
      text: "",
      role: "assistant",
      status: "thinking",
      updatedAt: now,
      createdAt: now,
    };

    const keptMessages = msgs.slice(0, userMsgIndex + 1);

    set((state) => {
      const newMap = {
        ...state.chatMessageMap,
        [chatId]: [...keptMessages, thinkingPlaceholder],
      };
      return {
        isSendingMessage: true,
        messageSendingError: null,
        isAIGenerating: true,
        chatMessageMap: newMap,
        ...(state.activeChatId === chatId
          ? { chatMessage: newMap[chatId] }
          : {}),
      };
    });

    try {
      const res = await axios.post(
        `${API_URL}/chat/sendMessage`,
        { message: userMsg.text, regenerate: true, aiModel, userMessageId },
        { params: { chatId } },
      );

      if (get().deletedChatIds.has(chatId)) return;

      const { userMessage, aiMessage } = res.data;

      set((state) => {
        const current = state.chatMessageMap[chatId] ?? [];
        const synced = current
          .filter((m) => m.id !== tempAiId)
          .map((m) => (m.id === userMessageId ? userMessage : m));
        const newMap = {
          ...state.chatMessageMap,
          [chatId]: [...synced, aiMessage],
        };
        return {
          isSendingMessage: false,
          chatMessageMap: newMap,
          ...(state.activeChatId === chatId
            ? { chatMessage: newMap[chatId] }
            : {}),
        };
      });

      startPolling(chatId, aiMessage.id, set, get);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to regenerate message";
      set((state) => {
        const newMap = { ...state.chatMessageMap, [chatId]: msgs };
        return {
          isSendingMessage: false,
          messageSendingError: msg,
          isAIGenerating: get().activePollingSessions.size > 0,
          chatMessageMap: newMap,
          ...(state.activeChatId === chatId
            ? { chatMessage: newMap[chatId] }
            : {}),
        };
      });
      throw new Error(msg);
    }
  },

  // ── Edit and Resend ───────────────────────────

  editAndResendMessage: async (chatId, userMessageId, newText) => {
    const { deletedChatIds, aiModel, chatMessageMap } = get();
    if (deletedChatIds.has(chatId)) return;

    const msgs = chatMessageMap[chatId] ?? [];
    const userMsgIndex = msgs.findIndex((m) => m.id === userMessageId);
    if (userMsgIndex === -1) return;

    const now = new Date().toISOString();
    const tempAiId = `temp-ai-${Date.now()}`;

    const thinkingPlaceholder: Message = {
      id: tempAiId,
      text: "",
      role: "assistant",
      status: "thinking",
      updatedAt: now,
      createdAt: now,
    };

    const keptMessages = msgs
      .slice(0, userMsgIndex + 1)
      .map((m) => (m.id === userMessageId ? { ...m, text: newText } : m));

    set((state) => {
      const newMap = {
        ...state.chatMessageMap,
        [chatId]: [...keptMessages, thinkingPlaceholder],
      };
      return {
        isSendingMessage: true,
        messageSendingError: null,
        isAIGenerating: true,
        editingState: null,
        chatMessageMap: newMap,
        ...(state.activeChatId === chatId
          ? { chatMessage: newMap[chatId] }
          : {}),
      };
    });

    try {
      const res = await axios.post(
        `${API_URL}/chat/sendMessage`,
        { message: newText, regenerate: true, aiModel, userMessageId },
        { params: { chatId } },
      );

      if (get().deletedChatIds.has(chatId)) return;

      const { userMessage, aiMessage } = res.data;

      set((state) => {
        const current = state.chatMessageMap[chatId] ?? [];
        const synced = current
          .filter((m) => m.id !== tempAiId)
          .map((m) => (m.id === userMessageId ? userMessage : m));
        const newMap = {
          ...state.chatMessageMap,
          [chatId]: [...synced, aiMessage],
        };
        return {
          isSendingMessage: false,
          chatMessageMap: newMap,
          ...(state.activeChatId === chatId
            ? { chatMessage: newMap[chatId] }
            : {}),
        };
      });

      startPolling(chatId, aiMessage.id, set, get);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to edit message";
      set((state) => {
        const newMap = { ...state.chatMessageMap, [chatId]: msgs };
        return {
          isSendingMessage: false,
          messageSendingError: msg,
          isAIGenerating: get().activePollingSessions.size > 0,
          chatMessageMap: newMap,
          ...(state.activeChatId === chatId
            ? { chatMessage: newMap[chatId] }
            : {}),
        };
      });
      throw new Error(msg);
    }
  },

  // ── Get Messages ──────────────────────────────

  getChatMessages: async (chatId) => {
    if (get().deletedChatIds.has(chatId)) return;
    set({ isGettingChatMessages: true, chatMessagesError: null });

    try {
      const res = await axios.get(`${API_URL}/chat/getMessages`, {
        params: { chatId },
      });

      if (get().deletedChatIds.has(chatId)) {
        set({ isGettingChatMessages: false });
        return;
      }

      const messages: Message[] = res.data;

      set((state) => {
        const newMap = { ...state.chatMessageMap, [chatId]: messages };
        return {
          isGettingChatMessages: false,
          chatMessagesError: null,
          chatMessageMap: newMap,
          ...(state.activeChatId === chatId
            ? { chatMessage: newMap[chatId] }
            : {}),
        };
      });

      const thinking = messages.filter(
        (m) => m.role === "assistant" && m.status === "thinking",
      );
      if (thinking.length > 0) {
        set({ isAIGenerating: true });
        thinking.forEach((m) => startPolling(chatId, m.id, set, get));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to load messages";
      set({ isGettingChatMessages: false, chatMessagesError: msg });
      throw new Error(msg);
    }
  },

  // ── Get User Chats ────────────────────────────

  getUserChats: async () => {
    set({ isLoadingUserChats: true, UserChatsError: null });
    try {
      const res = await axios.get(`${API_URL}/chat/getUserChats`);
      set({ userChats: res.data.chats, isLoadingUserChats: false });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to load chats";
      set({ isLoadingUserChats: false, UserChatsError: msg });
      throw new Error(msg);
    }
  },

  // ── Move Chat To Top ──────────────────────────

  moveChatToTop: (chatId) => {
    set((state) => {
      const idx = state.userChats.findIndex((c) => c.id === chatId);
      if (idx <= 0) return state;
      const next = [...state.userChats];
      next.unshift(...next.splice(idx, 1));
      return { userChats: next };
    });
  },

  // ── Abort Generation ──────────────────────────

  abortAIGeneration: async (messageId) => {
    const chatId = get().activePollingSessions.get(messageId);
    if (!chatId) return;

    set((state) => {
      const newSessions = new Map(state.activePollingSessions);
      newSessions.delete(messageId);
      const current = state.chatMessageMap[chatId] ?? [];
      const newMap = {
        ...state.chatMessageMap,
        [chatId]: current.map((m) =>
          m.id === messageId
            ? {
                ...m,
                status: "aborted" as const,
                text: "AI generation aborted",
              }
            : m,
        ),
      };
      return {
        activePollingSessions: newSessions,
        isAIGenerating: newSessions.size > 0,
        chatMessageMap: newMap,
        ...(state.activeChatId === chatId
          ? { chatMessage: newMap[chatId] }
          : {}),
      };
    });

    try {
      await axios.post(`${API_URL}/chat/abortMessage`, null, {
        params: { messageId },
      });
    } catch (err) {
      console.error("Failed to persist abort on server:", err);
    }
  },

  // ── Reset ─────────────────────────────────────
  // Deliberately does NOT clear inputDrafts — drafts survive dialog close/open.
  // editingState IS cleared on reset.

  resetStore: () => {
    get().activePollingSessions.clear();
    set({
      activeChatId: null,
      aiModel: "chatgpt",
      chatMessageMap: {},
      chatMessage: [],
      deletedChatIds: new Set(),
      activePollingSessions: new Map(),
      userChats: [],
      isLoadingUserChats: false,
      UserChatsError: null,
      isCreatingChat: false,
      isDeletingChat: false,
      isSendingMessage: false,
      isGettingChatMessages: false,
      isAIGenerating: false,
      chatCreationError: null,
      chatDeletionError: null,
      messageSendingError: null,
      chatMessagesError: null,
      editingState: null,
      // inputDrafts intentionally preserved
    });
  },
}));

// ─────────────────────────────────────────────
// Message-Scoped Polling
// ─────────────────────────────────────────────

const POLL_INTERVAL_MS = 1000;
const POLL_MAX_ATTEMPTS = 60;

async function startPolling(
  chatId: string,
  messageId: string,
  set: any,
  get: any,
) {
  const state = get();
  if (state.deletedChatIds.has(chatId)) return;
  if (state.activePollingSessions.has(messageId)) return;

  const newSessions = new Map(state.activePollingSessions);
  newSessions.set(messageId, chatId);
  set({ activePollingSessions: newSessions, isAIGenerating: true });

  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;
      const current = get();

      if (current.deletedChatIds.has(chatId)) {
        return stopPolling(messageId, set, get);
      }
      if (!current.activePollingSessions.has(messageId)) return;

      const res = await axios.get(`${API_URL}/chat/message/${messageId}`);
      const after = get();

      if (after.deletedChatIds.has(chatId)) return;
      if (!after.activePollingSessions.has(messageId)) return;

      const local = (after.chatMessageMap[chatId] ?? []).find(
        (m: Message) => m.id === messageId,
      );
      if (local?.status === "aborted") return;

      const updated: Message = res.data.message;

      set((state: any) => {
        const msgs = state.chatMessageMap[chatId] ?? [];
        const newMap = {
          ...state.chatMessageMap,
          [chatId]: msgs.map((m: Message) =>
            m.id === messageId ? updated : m,
          ),
        };
        return {
          chatMessageMap: newMap,
          ...(state.activeChatId === chatId
            ? { chatMessage: newMap[chatId] }
            : {}),
        };
      });

      if (
        updated.status === "sent" ||
        updated.status === "error" ||
        updated.status === "aborted"
      ) {
        return stopPolling(messageId, set, get);
      }

      if (attempts >= POLL_MAX_ATTEMPTS) {
        set((state: any) => {
          const msgs = state.chatMessageMap[chatId] ?? [];
          const newMap = {
            ...state.chatMessageMap,
            [chatId]: msgs.map((m: Message) =>
              m.id === messageId
                ? { ...m, status: "error" as const, text: "Response timed out" }
                : m,
            ),
          };
          return {
            chatMessageMap: newMap,
            ...(state.activeChatId === chatId
              ? { chatMessage: newMap[chatId] }
              : {}),
          };
        });
        return stopPolling(messageId, set, get);
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404 || status === 410) {
        return stopPolling(messageId, set, get);
      }
      if (attempts < 3) {
        setTimeout(poll, POLL_INTERVAL_MS * 2);
      } else {
        stopPolling(messageId, set, get);
      }
    }
  };

  setTimeout(poll, POLL_INTERVAL_MS);
}

function stopPolling(messageId: string, set: any, get: any) {
  set((state: any) => {
    const newSessions = new Map(state.activePollingSessions);
    newSessions.delete(messageId);
    return {
      activePollingSessions: newSessions,
      isAIGenerating: newSessions.size > 0,
    };
  });
}

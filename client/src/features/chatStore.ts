import axios from "axios";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

axios.defaults.withCredentials = true;

// ─────────────────────────────────────────────────────────────────────────────
// localStorage helpers — input draft persistence per chatId
// ─────────────────────────────────────────────────────────────────────────────

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
    text
      ? localStorage.setItem(LS_PREFIX + chatId, text)
      : localStorage.removeItem(LS_PREFIX + chatId);
  } catch {}
}
function lsRemoveDraft(chatId: string) {
  try {
    localStorage.removeItem(LS_PREFIX + chatId);
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type MessageStatus =
  | "sent"
  | "sending"
  | "thinking"
  | "error"
  | "aborted";
export type MessageRole = "user" | "assistant";
export type MessageFeedback = "LIKE" | "DISLIKE" | null;
export type AiModel = "chatgpt" | "claude" | "gemini";

export interface MessageNode {
  id: string;
  chatId: string;
  parentId: string | null;
  text: string;
  role: MessageRole;
  status: MessageStatus;
  aiModel: string | null;
  feedback: MessageFeedback;
  createdAt: string;
  updatedAt: string;
}

export interface ChatListItem {
  id: string;
  title: string;
}

export interface EditingState {
  chatId: string;
  messageId: string;
}

// Per-chat cached tree data
interface ChatTreeCache {
  nodeMap: Record<string, MessageNode>;
  activePath: string[];
}

export interface SnapshotMessage {
  id: string;
  ChatId: string;
  parentId: string | null;
  text: string;
  role: "user" | "assistant";
  status: "sent" | "aborted";
  aiModel: string | null;
  feedback: "LIKE" | "DISLIKE" | null;
  createdAt: string;
  updatedAt: string;
}

export interface SharedChatData {
  id: string;
  title: string;
  messages: SnapshotMessage[];
  createdAt: string;
}

interface ChatState {
  // ── View ─────────────────────────────────────────────────────────────────
  activeChatId: string | null;
  aiModel: AiModel;

  // ── Tree data ─────────────────────────────────────────────────────────────
  chatCache: Record<string, ChatTreeCache>;

  // Derived: active chat's nodeMap and activePath, kept in sync with chatCache
  nodeMap: Record<string, MessageNode>;
  activePath: string[];

  // ── Polling ───────────────────────────────────────────────────────────────
  activePollingSessions: Map<string, string>; // messageId → chatId

  // ── Active-path generating state ──────────────────────────────────────────
  // True when a thinking message exists on the current activePath.
  // Drives ChatInput Stop vs Send button.
  isActivePathGenerating: boolean;
  activePathThinkingMessageId: string | null;

  // ── Guards ────────────────────────────────────────────────────────────────
  deletedChatIds: Set<string>;

  // ── Chats list ────────────────────────────────────────────────────────────
  userChats: ChatListItem[];
  isLoadingUserChats: boolean;
  UserChatsError: string | null;

  // ── Loading / error flags ─────────────────────────────────────────────────
  isCreatingChat: boolean;
  isDeletingChat: boolean;
  isSendingMessage: boolean;
  isGettingChatMessages: boolean;
  chatCreationError: string | null;
  chatDeletionError: string | null;
  messageSendingError: string | null;
  chatMessagesError: string | null;

  // ── Draft & edit state ────────────────────────────────────────────────────
  inputDrafts: Record<string, string>;
  editingState: EditingState | null;

  // ── Problem context ───────────────────────────────────────────────────────
  problemTitle: string | null;

  // ── Shared chat state ─────────────────────────────────────────────────────
  sharedChatData: SharedChatData | null;
  isSharingChat: boolean;
  isLoadingSharedChat: boolean;
  sharedChatError: string | null;
  isForking: boolean;

  isSendingChatEmail: boolean;
  chatEmailError: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  setAiModel: (model: AiModel) => void;
  setProblemTitle: (title: string | null) => void;
  setActiveChatId: (chatId: string | null) => void;

  setInputDraft: (chatId: string, text: string) => void;
  clearInputDraft: (chatId: string) => void;
  getInputDraft: (chatId: string) => string;

  setEditingState: (state: EditingState | null) => void;

  createChat: () => Promise<string | null>;
  deleteChat: (chatId: string) => Promise<void>;

  sendMessage: (chatId: string, message: string) => Promise<void>;

  createEditBranch: (
    chatId: string,
    sourceUserMessageId: string,
    newText: string,
  ) => Promise<void>;

  createRegenerateBranch: (
    chatId: string,
    userMessageId: string,
  ) => Promise<void>;

  navigateBranch: (chatId: string, targetMessageId: string) => Promise<void>;

  setFeedback: (messageId: string, feedback: MessageFeedback) => Promise<void>;

  getChatMessages: (chatId: string) => Promise<void>;
  getUserChats: () => Promise<void>;
  moveChatToTop: (chatId: string) => void;

  abortActiveGeneration: () => Promise<void>;

  resetStore: () => void;

  shareChat: (chatId: string) => Promise<string | null>;
  getSharedChat: (shareId: string) => Promise<void>;
  forkSharedChat: (shareId: string) => Promise<string | null>;
  clearSharedChat: () => void;

  sendChatEmail: (payload: {
    chatId: string;
    recipientEmail: string;
    shareUrl: string;
  }) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()((set, get) => ({
  activeChatId: null,
  aiModel: "chatgpt",
  chatCache: {},
  nodeMap: {},
  activePath: [],
  activePollingSessions: new Map(),
  isActivePathGenerating: false,
  activePathThinkingMessageId: null,
  deletedChatIds: new Set(),
  userChats: [],
  isLoadingUserChats: false,
  UserChatsError: null,
  isCreatingChat: false,
  isDeletingChat: false,
  isSendingMessage: false,
  isGettingChatMessages: false,
  chatCreationError: null,
  chatDeletionError: null,
  messageSendingError: null,
  chatMessagesError: null,
  inputDrafts: {},
  editingState: null,
  problemTitle: null,
  sharedChatData: null,
  isSharingChat: false,
  isLoadingSharedChat: false,
  sharedChatError: null,
  isForking: false,
  isSendingChatEmail: false,
  chatEmailError: null,

  // ── Setters ───────────────────────────────────────────────────────────────

  setAiModel: (model) => set({ aiModel: model }),
  setProblemTitle: (title) => set({ problemTitle: title }),

  setActiveChatId: (chatId) => {
    const { chatCache } = get();
    const cache = chatId ? chatCache[chatId] : null;
    const nodeMap = cache?.nodeMap ?? {};
    const activePath = cache?.activePath ?? [];
    const thinkingId = findThinkingOnPath(activePath, nodeMap);
    set({
      activeChatId: chatId,
      nodeMap,
      activePath,
      isActivePathGenerating: thinkingId !== null,
      activePathThinkingMessageId: thinkingId,
    });
  },

  // ── Draft actions ─────────────────────────────────────────────────────────

  setInputDraft: (chatId, text) => {
    lsSetDraft(chatId, text);
    set((state) => ({ inputDrafts: { ...state.inputDrafts, [chatId]: text } }));
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

  setEditingState: (editingState) => set({ editingState }),

  // ── Create Chat ───────────────────────────────────────────────────────────

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

  // ── Delete Chat ───────────────────────────────────────────────────────────

  deleteChat: async (chatId) => {
    const { activePollingSessions, deletedChatIds, activeChatId } = get();

    const newDeletedIds = new Set(deletedChatIds);
    newDeletedIds.add(chatId);

    // Stop all polling sessions for this chat
    const newSessions = new Map(activePollingSessions);
    newSessions.forEach((cId, msgId) => {
      if (cId === chatId) newSessions.delete(msgId);
    });

    lsRemoveDraft(chatId);

    set((state) => {
      const newCache = { ...state.chatCache };
      delete newCache[chatId];
      const newDrafts = { ...state.inputDrafts };
      delete newDrafts[chatId];

      return {
        isDeletingChat: true,
        chatDeletionError: null,
        deletedChatIds: newDeletedIds,
        activePollingSessions: newSessions,
        chatCache: newCache,
        inputDrafts: newDrafts,
        userChats: state.userChats.filter((c) => c.id !== chatId),
        editingState:
          state.editingState?.chatId === chatId ? null : state.editingState,
        ...(activeChatId === chatId
          ? {
              activeChatId: null,
              nodeMap: {},
              activePath: [],
              isActivePathGenerating: false,
              activePathThinkingMessageId: null,
            }
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

  // ── Send Message (linear — new messages appended to activePath tail) ───────

  sendMessage: async (chatId, message) => {
    const { deletedChatIds, aiModel, problemTitle, activePath } = get();
    if (deletedChatIds.has(chatId)) return;

    const tempId = `temp-msg-${Date.now()}`;
    const now = new Date().toISOString();

    const optimisticNode: MessageNode = {
      id: tempId,
      chatId,
      parentId: activePath[activePath.length - 1] ?? null,
      text: message,
      role: "user",
      status: "sending",
      aiModel: null,
      feedback: null,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const newNodeMap = { ...state.nodeMap, [tempId]: optimisticNode };
      const newActivePath = [...state.activePath, tempId];
      const newCache = {
        ...state.chatCache,
        [chatId]: { nodeMap: newNodeMap, activePath: newActivePath },
      };
      return {
        isSendingMessage: true,
        messageSendingError: null,
        nodeMap: newNodeMap,
        activePath: newActivePath,
        chatCache: newCache,
      };
    });

    try {
      const res = await axios.post(
        `${API_URL}/chat/sendMessage`,
        { message, aiModel, problemTitle },
        { params: { chatId } },
      );

      if (get().deletedChatIds.has(chatId)) return;

      const { userMessage, aiMessage, activePath: serverPath } = res.data;

      set((state) => {
        const newNodeMap = { ...state.nodeMap };
        delete newNodeMap[tempId];
        newNodeMap[userMessage.id] = { ...userMessage, chatId };
        newNodeMap[aiMessage.id] = { ...aiMessage, chatId };

        const newActivePath = serverPath ?? [
          ...state.activePath.filter((id) => id !== tempId),
          userMessage.id,
          aiMessage.id,
        ];
        const thinkingId = findThinkingOnPath(newActivePath, newNodeMap);
        const newCache = {
          ...state.chatCache,
          [chatId]: { nodeMap: newNodeMap, activePath: newActivePath },
        };

        return {
          isSendingMessage: false,
          messageSendingError: null,
          nodeMap: newNodeMap,
          activePath: newActivePath,
          isActivePathGenerating: thinkingId !== null,
          activePathThinkingMessageId: thinkingId,
          chatCache: newCache,
        };
      });

      startPolling(chatId, aiMessage.id, set, get);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to send message";
      set((state) => {
        const newNodeMap = {
          ...state.nodeMap,
          [tempId]: { ...state.nodeMap[tempId], status: "error" as const },
        };
        const newCache = {
          ...state.chatCache,
          [chatId]: { nodeMap: newNodeMap, activePath: state.activePath },
        };
        return {
          isSendingMessage: false,
          messageSendingError: msg,
          nodeMap: newNodeMap,
          chatCache: newCache,
        };
      });
      throw new Error(msg);
    }
  },

  // ── Create Edit Branch ────────────────────────────────────────────────────
  // Branches at USER level. Creates a sibling user message node.
  // Navigator chevrons appear on user message bubbles.

  createEditBranch: async (chatId, sourceUserMessageId, newText) => {
    const { deletedChatIds, aiModel, problemTitle, nodeMap, activePath } =
      get();
    if (deletedChatIds.has(chatId)) return;

    const sourceNode = nodeMap[sourceUserMessageId];
    if (!sourceNode) return;

    const now = new Date().toISOString();
    const tempUserId = `temp-u-${Date.now()}`;
    const tempAiId = `temp-a-${Date.now() + 1}`;

    const optimisticUser: MessageNode = {
      id: tempUserId,
      chatId,
      parentId: sourceNode.parentId, // same parent as original = sibling
      text: newText,
      role: "user",
      status: "sending",
      aiModel: null,
      feedback: null,
      createdAt: now,
      updatedAt: now,
    };

    const optimisticAi: MessageNode = {
      id: tempAiId,
      chatId,
      parentId: tempUserId,
      text: "",
      role: "assistant",
      status: "thinking",
      aiModel,
      feedback: null,
      createdAt: now,
      updatedAt: now,
    };

    // New path: everything before the source user message, then new nodes
    const pathToParent = buildPathToParent(activePath, sourceUserMessageId);
    const newActivePath = [...pathToParent, tempUserId, tempAiId];

    set((state) => {
      const newNodeMap = {
        ...state.nodeMap,
        [tempUserId]: optimisticUser,
        [tempAiId]: optimisticAi,
      };
      const thinkingId = findThinkingOnPath(newActivePath, newNodeMap);
      const newCache = {
        ...state.chatCache,
        [chatId]: { nodeMap: newNodeMap, activePath: newActivePath },
      };
      return {
        isSendingMessage: true,
        editingState: null,
        nodeMap: newNodeMap,
        activePath: newActivePath,
        isActivePathGenerating: thinkingId !== null,
        activePathThinkingMessageId: thinkingId,
        chatCache: newCache,
      };
    });

    try {
      const res = await axios.post(`${API_URL}/chat/branch`, {
        chatId,
        sourceMessageId: sourceUserMessageId,
        message: newText,
        branchType: "edit",
        aiModel,
        problemTitle,
      });

      if (get().deletedChatIds.has(chatId)) return;

      const {
        newUserMessage,
        aiPlaceholder,
        activePath: serverPath,
      } = res.data;

      set((state) => {
        const newNodeMap = { ...state.nodeMap };
        delete newNodeMap[tempUserId];
        delete newNodeMap[tempAiId];
        newNodeMap[newUserMessage.id] = { ...newUserMessage, chatId };
        newNodeMap[aiPlaceholder.id] = { ...aiPlaceholder, chatId };

        const finalPath = serverPath ?? [
          ...pathToParent,
          newUserMessage.id,
          aiPlaceholder.id,
        ];
        const thinkingId = findThinkingOnPath(finalPath, newNodeMap);
        const newCache = {
          ...state.chatCache,
          [chatId]: { nodeMap: newNodeMap, activePath: finalPath },
        };

        return {
          isSendingMessage: false,
          nodeMap: newNodeMap,
          activePath: finalPath,
          isActivePathGenerating: thinkingId !== null,
          activePathThinkingMessageId: thinkingId,
          chatCache: newCache,
        };
      });

      startPolling(chatId, aiPlaceholder.id, set, get);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to create edit branch";
      // Rollback: remove temp nodes, restore original path
      set((state) => {
        const newNodeMap = { ...state.nodeMap };
        delete newNodeMap[tempUserId];
        delete newNodeMap[tempAiId];
        const newCache = {
          ...state.chatCache,
          [chatId]: { nodeMap: newNodeMap, activePath },
        };
        return {
          isSendingMessage: false,
          messageSendingError: msg,
          nodeMap: newNodeMap,
          activePath,
          isActivePathGenerating: false,
          activePathThinkingMessageId: null,
          chatCache: newCache,
        };
      });
      throw new Error(msg);
    }
  },

  // ── Create Regenerate Branch ──────────────────────────────────────────────
  // Branches at ASSISTANT level. Creates a sibling assistant message node.
  // Navigator chevrons appear on assistant message bubbles.

  createRegenerateBranch: async (chatId, userMessageId) => {
    const { deletedChatIds, aiModel, problemTitle, nodeMap, activePath } =
      get();
    if (deletedChatIds.has(chatId)) return;

    const userNode = nodeMap[userMessageId];
    if (!userNode) return;

    const now = new Date().toISOString();
    const tempAiId = `temp-a-${Date.now()}`;

    const optimisticAi: MessageNode = {
      id: tempAiId,
      chatId,
      parentId: userMessageId, // sibling of the existing AI response
      text: "",
      role: "assistant",
      status: "thinking",
      aiModel,
      feedback: null,
      createdAt: now,
      updatedAt: now,
    };

    // New path: up to and including the user message, then new AI node
    const pathToUser = buildPathToSource(activePath, userMessageId);
    const newActivePath = [...pathToUser, tempAiId];

    set((state) => {
      const newNodeMap = { ...state.nodeMap, [tempAiId]: optimisticAi };
      const thinkingId = findThinkingOnPath(newActivePath, newNodeMap);
      const newCache = {
        ...state.chatCache,
        [chatId]: { nodeMap: newNodeMap, activePath: newActivePath },
      };
      return {
        isSendingMessage: true,
        nodeMap: newNodeMap,
        activePath: newActivePath,
        isActivePathGenerating: thinkingId !== null,
        activePathThinkingMessageId: thinkingId,
        chatCache: newCache,
      };
    });

    try {
      const res = await axios.post(`${API_URL}/chat/branch`, {
        chatId,
        sourceMessageId: userMessageId,
        message: userNode.text,
        branchType: "regenerate",
        aiModel,
        problemTitle,
      });

      if (get().deletedChatIds.has(chatId)) return;

      const { aiPlaceholder, activePath: serverPath } = res.data;

      set((state) => {
        const newNodeMap = { ...state.nodeMap };
        delete newNodeMap[tempAiId];
        newNodeMap[aiPlaceholder.id] = { ...aiPlaceholder, chatId };

        const finalPath = serverPath ?? [...pathToUser, aiPlaceholder.id];
        const thinkingId = findThinkingOnPath(finalPath, newNodeMap);
        const newCache = {
          ...state.chatCache,
          [chatId]: { nodeMap: newNodeMap, activePath: finalPath },
        };

        return {
          isSendingMessage: false,
          nodeMap: newNodeMap,
          activePath: finalPath,
          isActivePathGenerating: thinkingId !== null,
          activePathThinkingMessageId: thinkingId,
          chatCache: newCache,
        };
      });

      startPolling(chatId, aiPlaceholder.id, set, get);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to regenerate";
      // Rollback
      set((state) => {
        const newNodeMap = { ...state.nodeMap };
        delete newNodeMap[tempAiId];
        const newCache = {
          ...state.chatCache,
          [chatId]: { nodeMap: newNodeMap, activePath },
        };
        return {
          isSendingMessage: false,
          messageSendingError: msg,
          nodeMap: newNodeMap,
          activePath,
          isActivePathGenerating: false,
          activePathThinkingMessageId: null,
          chatCache: newCache,
        };
      });
      throw new Error(msg);
    }
  },

  // ── Navigate Branch ───────────────────────────────────────────────────────
  // Called by BranchNavigator on chevron click.
  // targetMessageId = the sibling to navigate to.
  // New activePath = prefix up to target's parent + target + latest leaf of target.

  navigateBranch: async (chatId, targetMessageId) => {
    const { nodeMap, activePath } = get();
    const targetNode = nodeMap[targetMessageId];
    if (!targetNode) return;

    const parentId = targetNode.parentId;
    let pathPrefix: string[];

    if (parentId === null) {
      pathPrefix = [];
    } else {
      const parentIdx = activePath.indexOf(parentId);
      pathPrefix = parentIdx === -1 ? [] : activePath.slice(0, parentIdx + 1);
    }

    const latestTail = walkToLatestLeafLocal(targetMessageId, nodeMap);
    const newActivePath = [...pathPrefix, ...latestTail];

    set((state) => {
      const thinkingId = findThinkingOnPath(newActivePath, state.nodeMap);
      const newCache = {
        ...state.chatCache,
        [chatId]: { nodeMap: state.nodeMap, activePath: newActivePath },
      };
      return {
        activePath: newActivePath,
        isActivePathGenerating: thinkingId !== null,
        activePathThinkingMessageId: thinkingId,
        chatCache: newCache,
      };
    });

    // Persist to DB — fire and forget
    axios
      .patch(`${API_URL}/chat/activePath`, {
        chatId,
        activePath: newActivePath,
      })
      .catch((err) => console.error("Failed to persist activePath:", err));
  },

  // ── Set Feedback ──────────────────────────────────────────────────────────

  setFeedback: async (messageId, feedback) => {
    const { nodeMap } = get();
    const node = nodeMap[messageId];
    if (!node) return;
    const chatId = node.chatId;

    // Optimistic update
    set((state) => {
      const newNodeMap = {
        ...state.nodeMap,
        [messageId]: { ...state.nodeMap[messageId], feedback },
      };
      const newCache = {
        ...state.chatCache,
        [chatId]: { ...state.chatCache[chatId], nodeMap: newNodeMap },
      };
      return { nodeMap: newNodeMap, chatCache: newCache };
    });

    try {
      await axios.patch(`${API_URL}/chat/message/${messageId}/feedback`, {
        feedback,
      });
    } catch (err) {
      // Rollback
      set((state) => {
        const newNodeMap = {
          ...state.nodeMap,
          [messageId]: { ...state.nodeMap[messageId], feedback: node.feedback },
        };
        const newCache = {
          ...state.chatCache,
          [chatId]: { ...state.chatCache[chatId], nodeMap: newNodeMap },
        };
        return { nodeMap: newNodeMap, chatCache: newCache };
      });
      console.error("Failed to persist feedback:", err);
    }
  },

  // ── Get Messages ──────────────────────────────────────────────────────────
  // Fetches the full tree (all nodes) + resolved activePath from server.
  // Builds nodeMap, caches per chatId, resumes polling for any thinking nodes.

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

      const { nodes, activePath }: { nodes: any[]; activePath: string[] } =
        res.data;

      const nodeMap: Record<string, MessageNode> = {};
      nodes.forEach((n) => {
        nodeMap[n.id] = { ...n, chatId };
      });

      const thinkingId = findThinkingOnPath(activePath, nodeMap);

      set((state) => {
        const newCache = {
          ...state.chatCache,
          [chatId]: { nodeMap, activePath },
        };
        const isActive = state.activeChatId === chatId;
        return {
          isGettingChatMessages: false,
          chatMessagesError: null,
          chatCache: newCache,
          ...(isActive
            ? {
                nodeMap,
                activePath,
                isActivePathGenerating: thinkingId !== null,
                activePathThinkingMessageId: thinkingId,
              }
            : {}),
        };
      });

      // Resume background polling for ALL thinking nodes (not just active path)
      nodes
        .filter((n) => n.role === "assistant" && n.status === "thinking")
        .forEach((n) => startPolling(chatId, n.id, set, get));
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to load messages";
      set({ isGettingChatMessages: false, chatMessagesError: msg });
      throw new Error(msg);
    }
  },

  // ── Get User Chats ────────────────────────────────────────────────────────

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

  moveChatToTop: (chatId) => {
    set((state) => {
      const idx = state.userChats.findIndex((c) => c.id === chatId);
      if (idx <= 0) return state;
      const next = [...state.userChats];
      next.unshift(...next.splice(idx, 1));
      return { userChats: next };
    });
  },

  // ── Abort Active Generation ───────────────────────────────────────────────
  // Aborts ONLY the thinking message visible on the current activePath.
  // Background generations on other branches continue unaffected.

  abortActiveGeneration: async () => {
    const { activePathThinkingMessageId, activeChatId } = get();
    if (!activePathThinkingMessageId || !activeChatId) return;

    const chatId = activeChatId;
    const messageId = activePathThinkingMessageId;

    // Update UI immediately (abort-first pattern)
    set((state) => {
      const newSessions = new Map(state.activePollingSessions);
      newSessions.delete(messageId);

      const newNodeMap = {
        ...state.nodeMap,
        [messageId]: {
          ...state.nodeMap[messageId],
          status: "aborted" as const,
          text: "AI generation aborted",
        },
      };
      const newCache = {
        ...state.chatCache,
        [chatId]: { nodeMap: newNodeMap, activePath: state.activePath },
      };

      return {
        activePollingSessions: newSessions,
        isActivePathGenerating: false,
        activePathThinkingMessageId: null,
        nodeMap: newNodeMap,
        chatCache: newCache,
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

  shareChat: async (chatId) => {
    set({ isSharingChat: true });
    try {
      const res = await axios.post(`${API_URL}/chat/share`, { chatId });
      const shareId: string = res.data.shareId;
      const shareUrl = `${window.location.origin}?sharedChat=${shareId}`;
      set({ isSharingChat: false });
      return shareUrl;
    } catch (err: any) {
      set({ isSharingChat: false });
      throw err;
    }
  },

  getSharedChat: async (shareId) => {
    set({ isLoadingSharedChat: true, sharedChatError: null });
    try {
      const res = await axios.get(`${API_URL}/chat/shared/${shareId}`);
      set({ sharedChatData: res.data.data });
    } catch (err: any) {
      const status = err?.response?.status;
      const message =
        status === 410
          ? "This shared link has expired"
          : status === 404
            ? "This link is invalid or could not be found"
            : (err?.response?.data?.message ?? "Failed to load shared chat");
      set({ sharedChatError: message });
    } finally {
      set({ isLoadingSharedChat: false });
    }
  },

  forkSharedChat: async (shareId) => {
    set({ isForking: true });
    try {
      const res = await axios.post(`${API_URL}/chat/fork`, { shareId });
      return res.data.chatId as string;
    } catch (err: any) {
      if (err.response?.status === 409) {
        const alreadyForkedError = new Error(
          err.response.data.message ?? "Already forked",
        ) as any;
        alreadyForkedError.alreadyForked = true;
        alreadyForkedError.existingChatId = err.response.data.chatId as string;
        throw alreadyForkedError;
      }
      throw err;
    } finally {
      set({ isForking: false });
    }
  },

  clearSharedChat: () => {
    set({
      sharedChatData: null,
      sharedChatError: null,
      isLoadingSharedChat: false,
    });
  },

  sendChatEmail: async ({ chatId, recipientEmail, shareUrl }) => {
    set({ isSendingChatEmail: true, chatEmailError: null });
    try {
      await axios.post(`${API_URL}/chat/email`, {
        chatId,
        recipientEmail,
        shareUrl,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to send email";
      set({ chatEmailError: msg });
      throw new Error(msg);
    } finally {
      set({ isSendingChatEmail: false });
    }
  },

  // ── Reset ─────────────────────────────────────────────────────────────────
  // inputDrafts intentionally preserved across dialog close/open.

  resetStore: () => {
    get().activePollingSessions.clear();
    set({
      activeChatId: null,
      aiModel: "chatgpt",
      chatCache: {},
      nodeMap: {},
      activePath: [],
      activePollingSessions: new Map(),
      isActivePathGenerating: false,
      activePathThinkingMessageId: null,
      deletedChatIds: new Set(),
      userChats: [],
      isLoadingUserChats: false,
      UserChatsError: null,
      isCreatingChat: false,
      isDeletingChat: false,
      isSendingMessage: false,
      isGettingChatMessages: false,
      chatCreationError: null,
      chatDeletionError: null,
      messageSendingError: null,
      chatMessagesError: null,
      editingState: null,
      problemTitle: null,
      // inputDrafts preserved intentionally
    });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Message-Scoped Polling
// Background polling continues regardless of active chat or branch.
// stopPolling is always called in the finally/error path — no zombie sessions.
// ─────────────────────────────────────────────────────────────────────────────

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

  set((s: any) => {
    const sessions = new Map(s.activePollingSessions);
    sessions.set(messageId, chatId);
    return { activePollingSessions: sessions };
  });

  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;
      const current = get();
      if (current.deletedChatIds.has(chatId))
        return stopPolling(messageId, set, get);
      if (!current.activePollingSessions.has(messageId)) return;

      const res = await axios.get(`${API_URL}/chat/message/${messageId}`);
      const after = get();

      if (after.deletedChatIds.has(chatId)) return;
      if (!after.activePollingSessions.has(messageId)) return;

      // Don't overwrite locally-aborted state
      const localNode =
        after.nodeMap[messageId] ?? after.chatCache[chatId]?.nodeMap[messageId];
      if (localNode?.status === "aborted")
        return stopPolling(messageId, set, get);

      const updated: MessageNode = { ...res.data.message, chatId };

      set((s: any) => {
        // Update in both nodeMap (if active chat) and chatCache
        const cacheEntry = s.chatCache[chatId];
        const newCacheNodeMap = cacheEntry
          ? { ...cacheEntry.nodeMap, [messageId]: updated }
          : { [messageId]: updated };

        const newCache = {
          ...s.chatCache,
          [chatId]: { ...cacheEntry, nodeMap: newCacheNodeMap },
        };

        const isActive = s.activeChatId === chatId;
        const newNodeMap = isActive
          ? { ...s.nodeMap, [messageId]: updated }
          : s.nodeMap;

        const thinkingId = isActive
          ? findThinkingOnPath(s.activePath, newNodeMap)
          : s.activePathThinkingMessageId;

        return {
          chatCache: newCache,
          ...(isActive
            ? {
                nodeMap: newNodeMap,
                isActivePathGenerating: thinkingId !== null,
                activePathThinkingMessageId: thinkingId,
              }
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
        const timedOut = {
          ...updated,
          status: "error" as const,
          text: "Response timed out",
        };
        set((s: any) => {
          const cacheEntry = s.chatCache[chatId];
          const newCacheNodeMap = cacheEntry
            ? { ...cacheEntry.nodeMap, [messageId]: timedOut }
            : { [messageId]: timedOut };
          const newCache = {
            ...s.chatCache,
            [chatId]: { ...cacheEntry, nodeMap: newCacheNodeMap },
          };
          const isActive = s.activeChatId === chatId;
          const newNodeMap = isActive
            ? { ...s.nodeMap, [messageId]: timedOut }
            : s.nodeMap;
          return {
            chatCache: newCache,
            ...(isActive
              ? {
                  nodeMap: newNodeMap,
                  isActivePathGenerating: false,
                  activePathThinkingMessageId: null,
                }
              : {}),
          };
        });
        return stopPolling(messageId, set, get);
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404 || status === 410)
        return stopPolling(messageId, set, get);
      if (attempts < 3) setTimeout(poll, POLL_INTERVAL_MS * 2);
      else stopPolling(messageId, set, get);
    }
  };

  setTimeout(poll, POLL_INTERVAL_MS);
}

function stopPolling(messageId: string, set: any, get: any) {
  set((s: any) => {
    const sessions = new Map(s.activePollingSessions);
    sessions.delete(messageId);
    const thinkingId = findThinkingOnPath(s.activePath, s.nodeMap);
    return {
      activePollingSessions: sessions,
      isActivePathGenerating: thinkingId !== null,
      activePathThinkingMessageId: thinkingId,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure utilities (no store access)
// ─────────────────────────────────────────────────────────────────────────────

function findThinkingOnPath(
  activePath: string[],
  nodeMap: Record<string, MessageNode>,
): string | null {
  for (const id of activePath) {
    if (nodeMap[id]?.status === "thinking") return id;
  }
  return null;
}

function walkToLatestLeafLocal(
  startId: string,
  nodeMap: Record<string, MessageNode>,
  visited = new Set<string>(),
): string[] {
  if (visited.has(startId)) return [startId];
  visited.add(startId);

  const children = Object.values(nodeMap)
    .filter((n) => n.parentId === startId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  if (children.length === 0) return [startId];
  return [startId, ...walkToLatestLeafLocal(children[0].id, nodeMap, visited)];
}

/** Returns activePath slice up to (NOT including) targetId. For edit branching. */
function buildPathToParent(activePath: string[], targetId: string): string[] {
  const idx = activePath.indexOf(targetId);
  return idx === -1 ? [] : activePath.slice(0, idx);
}

/** Returns activePath slice up to AND including sourceId. For regenerate branching. */
function buildPathToSource(activePath: string[], sourceId: string): string[] {
  const idx = activePath.indexOf(sourceId);
  return idx === -1 ? [sourceId] : activePath.slice(0, idx + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported selectors
// ─────────────────────────────────────────────────────────────────────────────

// Stable reference cache for selectVisibleMessages.
// Zustand requires getSnapshot to return the same reference when data hasn't changed.
// Without this, .map().filter() produces a new array every call → infinite loop.
let _cachedPath: string[] = [];
let _cachedNodeMap: Record<string, MessageNode> = {};
let _cachedMessages: MessageNode[] = [];

export function selectVisibleMessages(state: ChatState): MessageNode[] {
  // Return cached result if neither activePath nor nodeMap reference changed
  if (state.activePath === _cachedPath && state.nodeMap === _cachedNodeMap) {
    return _cachedMessages;
  }

  _cachedPath = state.activePath;
  _cachedNodeMap = state.nodeMap;
  _cachedMessages = state.activePath
    .map((id) => state.nodeMap[id])
    .filter(Boolean) as MessageNode[];

  return _cachedMessages;
}

/**
 * All siblings of a message node (nodes with the same parentId and same role).
 * Sorted by createdAt ascending (oldest = index 0).
 * Used by BranchNavigator to determine version count and current index.
 */
export function selectSiblings(
  nodeMap: Record<string, MessageNode>,
  messageId: string,
): MessageNode[] {
  const node = nodeMap[messageId];
  if (!node) return [];
  return Object.values(nodeMap)
    .filter((n) => n.parentId === node.parentId && n.role === node.role)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

/** 0-based index of messageId among its siblings. */
export function selectSiblingIndex(
  nodeMap: Record<string, MessageNode>,
  messageId: string,
): number {
  return selectSiblings(nodeMap, messageId).findIndex(
    (s) => s.id === messageId,
  );
}

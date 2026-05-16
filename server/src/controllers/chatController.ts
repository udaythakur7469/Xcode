import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";
import { generateAIResponse } from "../services/rag/aiService.js";
import { sharedChatEmail } from "../emails/shareChatEmail.js";
import { MailtrapClient } from "mailtrap";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walk the message tree from a given node to its deepest "latest" leaf.
 * At each level, picks the child with the latest createdAt timestamp.
 * Returns the ordered path of message IDs from the given node to the leaf.
 *
 * Used to compute the default active path when no persisted path exists,
 * and when auto-switching to a newly created branch.
 */
async function walkToLatestLeaf(
  startId: string,
  chatId: string,
  visited = new Set<string>(),
): Promise<string[]> {
  if (visited.has(startId)) return [startId]; // cycle guard
  visited.add(startId);

  const children = await prisma.message.findMany({
    where: { ChatId: chatId, parentId: startId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
    take: 1,
  });

  if (children.length === 0) return [startId];

  const tail = await walkToLatestLeaf(children[0].id, chatId, visited);
  return [startId, ...tail];
}

/**
 * Compute the full active path for a chat — from the root message to the
 * current leaf — following the persisted activePath from the Chat table.
 *
 * If activePath is empty (new chat) or stale, falls back to latest-leaf walk.
 * Returns the validated, complete path as an array of message IDs.
 */
async function resolveActivePath(
  chatId: string,
  persistedPath: string[],
): Promise<string[]> {
  // Find the root message (parentId is null)
  const root = await prisma.message.findFirst({
    where: { ChatId: chatId, parentId: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!root) return []; // empty chat

  if (persistedPath.length === 0) {
    // New chat or no saved path — walk to latest leaf from root
    return walkToLatestLeaf(root.id, chatId);
  }

  // Validate that the persisted path still exists in the DB
  // (nodes could have been deleted by admin, etc.)
  const existingIds = await prisma.message.findMany({
    where: { id: { in: persistedPath }, ChatId: chatId },
    select: { id: true },
  });
  const existingSet = new Set(existingIds.map((m) => m.id));

  const validPath = persistedPath.filter((id) => existingSet.has(id));

  if (validPath.length !== persistedPath.length) {
    // Path was partially stale — fall back to latest-leaf walk
    return walkToLatestLeaf(root.id, chatId);
  }

  return validPath;
}

// ─────────────────────────────────────────────────────────────────────────────
// getMessageById — used by polling
// Returns a single message. Polling contract unchanged.
// ─────────────────────────────────────────────────────────────────────────────
export const getMessageById = async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!messageId || typeof messageId !== "string") {
      throw createHttpError.BadRequest("Please provide messageId");
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        Chat: { select: { id: true, userId: true } },
      },
    });

    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
    if (!message.Chat) {
      return res
        .status(410)
        .json({ success: false, message: "Chat has been deleted" });
    }
    if (message.Chat.userId !== userId) {
      throw createHttpError.Forbidden("Access denied");
    }

    return res.status(200).json({
      success: true,
      message: {
        id: message.id,
        chatId: message.ChatId,
        parentId: message.parentId,
        text: message.text,
        role: message.role,
        status: message.status,
        aiModel: message.aiModel,
        feedback: message.feedback,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Error in getMessageById controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// createChat — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export const createChat = async (req, res, next) => {
  const userId = req.user?.Id || req.user?.userId;

  try {
    const Chat = await prisma.chat.create({ data: { userId } });
    return res.status(200).json({
      success: true,
      message: "Chat created successfully",
      chatId: Chat.id,
    });
  } catch (error) {
    logger.error("error in createConversation controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// deleteChat — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export const deleteChat = async (req, res, next) => {
  const { chatId } = req.query;
  const userId = req.user?.id || req.user?.userId;

  try {
    if (!chatId || typeof chatId !== "string") {
      throw createHttpError.BadRequest("Please provide chatId");
    }
    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }
    await prisma.chat.delete({ where: { id: chatId } });
    return res
      .status(200)
      .json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    logger.error("error in deleteChat controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// sendMessage — linear (first message in a chat, no branching)
// Used ONLY for new messages. Edit/Regenerate use POST /branch.
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req, res, next) => {
  const { chatId } = req.query;
  const { message, aiModel, problemTitle } = req.body;
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!chatId || typeof chatId !== "string") {
      throw createHttpError.BadRequest("Please provide chatId");
    }
    if (!message || typeof message !== "string") {
      throw createHttpError.BadRequest("Please provide message");
    }
    if (!aiModel || typeof aiModel !== "string") {
      throw createHttpError.BadRequest("Please provide aiModel");
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          where: { role: "assistant" },
          select: { aiModel: true },
        },
      },
    });

    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }

    const isFirstMessage = chat.messages.length === 0;
    const lastMessageModel = chat.messages[0]?.aiModel || "gpt-4";

    // Find the current tail of the active path — the new user message's parent
    // is the last message on the active path (null if this is the first message)
    let parentId: string | null = null;

    if (chat.activePath.length > 0) {
      parentId = chat.activePath[chat.activePath.length - 1];
    } else {
      // Find the most recent leaf message in the chat (if any)
      const latestMsg = await prisma.message.findFirst({
        where: { ChatId: chatId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      parentId = latestMsg?.id ?? null;
    }

    // Create user message as a child of the current tail
    const userMessage = await prisma.message.create({
      data: {
        ChatId: chatId,
        parentId,
        role: "user",
        text: message,
        status: "sent",
        aiModel: null,
      },
    });

    // Create AI placeholder as a child of the user message
    const aiPlaceholder = await prisma.message.create({
      data: {
        ChatId: chatId,
        parentId: userMessage.id,
        role: "assistant",
        text: "",
        status: "thinking",
        aiModel,
      },
    });

    // Update chat title on first message + persist new activePath
    const newActivePath = [
      ...(chat.activePath || []),
      userMessage.id,
      aiPlaceholder.id,
    ];

    if (isFirstMessage) {
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;
      await prisma.chat.update({
        where: { id: chatId },
        data: { title, activePath: newActivePath, updatedAt: new Date() },
      });
    } else {
      await prisma.chat.update({
        where: { id: chatId },
        data: { activePath: newActivePath, updatedAt: new Date() },
      });
    }

    // Respond immediately
    res.status(200).json({
      success: true,
      chatId,
      userMessage: formatMessage(userMessage),
      aiMessage: formatMessage(aiPlaceholder),
      activePath: newActivePath,
    });

    // Generate AI response asynchronously
    generateAsync({
      aiPlaceholderId: aiPlaceholder.id,
      chatId,
      userMessageId: userMessage.id,
      currentUserMessage: message,
      aiModel,
      lastMessageModel,
      userId,
      problemTitle,
    });
  } catch (error) {
    logger.error("error in sendMessage controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// createBranch — POST /chat/branch
//
// Handles both Edit and Regenerate by creating a new sibling node:
//
// EDIT (role: "user"):
//   Creates a new user message sibling (same parentId as the original user msg),
//   then creates an AI placeholder as its child.
//   Returns: { newUserMessage, aiPlaceholder, newActivePath }
//
// REGENERATE (role: "assistant"):
//   Creates a new assistant message sibling (parentId = the user message),
//   polling starts on the new AI placeholder.
//   Returns: { aiPlaceholder, newActivePath }
// ─────────────────────────────────────────────────────────────────────────────
export const createBranch = async (req, res, next) => {
  const {
    chatId,
    // The ID of the message being branched FROM:
    // - For EDIT: the original user message whose text is being changed
    // - For REGENERATE: the user message whose AI response is being regenerated
    sourceMessageId,
    message, // New text (for edit: new user text; for regenerate: same user text)
    branchType, // "edit" | "regenerate"
    aiModel,
    problemTitle,
  } = req.body;
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!chatId || !sourceMessageId || !message || !branchType || !aiModel) {
      throw createHttpError.BadRequest(
        "Missing required fields: chatId, sourceMessageId, message, branchType, aiModel",
      );
    }
    if (branchType !== "edit" && branchType !== "regenerate") {
      throw createHttpError.BadRequest(
        "branchType must be 'edit' or 'regenerate'",
      );
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }

    const sourceMessage = await prisma.message.findUnique({
      where: { id: sourceMessageId },
      include: { Chat: { select: { userId: true } } },
    });
    if (!sourceMessage || sourceMessage.Chat.userId !== userId) {
      throw createHttpError.NotFound("Source message not found");
    }
    if (sourceMessage.ChatId !== chatId) {
      throw createHttpError.BadRequest(
        "Source message does not belong to this chat",
      );
    }

    // Get the last assistant model for context
    const lastAssistantMsg = await prisma.message.findFirst({
      where: { ChatId: chatId, role: "assistant" },
      orderBy: { createdAt: "desc" },
      select: { aiModel: true },
    });
    const lastMessageModel = lastAssistantMsg?.aiModel || "gpt-4";

    let newActivePath: string[];
    let responsePayload: any;

    if (branchType === "edit") {
      // ── EDIT: branch at user level ────────────────────────────────────────
      // sourceMessage is the original user message.
      // New sibling shares the same parentId.

      if (sourceMessage.role !== "user") {
        throw createHttpError.BadRequest(
          "Edit branches must target a user message",
        );
      }

      // Create new user message sibling
      const newUserMessage = await prisma.message.create({
        data: {
          ChatId: chatId,
          parentId: sourceMessage.parentId, // same parent = sibling
          role: "user",
          text: message,
          status: "sent",
          aiModel: null,
        },
      });

      // Create AI placeholder as child of the new user message
      const aiPlaceholder = await prisma.message.create({
        data: {
          ChatId: chatId,
          parentId: newUserMessage.id,
          role: "assistant",
          text: "",
          status: "thinking",
          aiModel,
        },
      });

      // Build new active path: path up to (not including) source message,
      // then the new user message, then the AI placeholder
      const pathUpToParent = buildPathUpToParent(
        chat.activePath,
        sourceMessageId,
      );
      newActivePath = [...pathUpToParent, newUserMessage.id, aiPlaceholder.id];

      responsePayload = {
        success: true,
        branchType: "edit",
        newUserMessage: formatMessage(newUserMessage),
        aiPlaceholder: formatMessage(aiPlaceholder),
        activePath: newActivePath,
      };

      // Persist new active path
      await prisma.chat.update({
        where: { id: chatId },
        data: { activePath: newActivePath, updatedAt: new Date() },
      });

      // Respond immediately, then generate async
      res.status(200).json(responsePayload);

      generateAsync({
        aiPlaceholderId: aiPlaceholder.id,
        chatId,
        userMessageId: newUserMessage.id,
        currentUserMessage: message,
        aiModel,
        lastMessageModel,
        userId,
        problemTitle,
      });
    } else {
      // ── REGENERATE: branch at assistant level ─────────────────────────────
      // sourceMessage is the user message whose response we're regenerating.
      // New assistant message is a sibling of the existing AI response
      // (both have parentId = sourceMessage.id).

      if (sourceMessage.role !== "user") {
        throw createHttpError.BadRequest(
          "Regenerate branches must target a user message",
        );
      }

      // Create new assistant message sibling
      const aiPlaceholder = await prisma.message.create({
        data: {
          ChatId: chatId,
          parentId: sourceMessageId, // sibling of existing AI response
          role: "assistant",
          text: "",
          status: "thinking",
          aiModel,
        },
      });

      // Build new active path: path up to and including source user message,
      // then the new AI placeholder
      const pathUpToSource = buildPathUpToSource(
        chat.activePath,
        sourceMessageId,
      );
      newActivePath = [...pathUpToSource, aiPlaceholder.id];

      responsePayload = {
        success: true,
        branchType: "regenerate",
        aiPlaceholder: formatMessage(aiPlaceholder),
        activePath: newActivePath,
      };

      await prisma.chat.update({
        where: { id: chatId },
        data: { activePath: newActivePath, updatedAt: new Date() },
      });

      res.status(200).json(responsePayload);

      generateAsync({
        aiPlaceholderId: aiPlaceholder.id,
        chatId,
        userMessageId: sourceMessageId,
        currentUserMessage: message,
        aiModel,
        lastMessageModel,
        userId,
        problemTitle,
      });
    }
  } catch (error) {
    logger.error("error in createBranch controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// updateActivePath — PATCH /chat/activePath
// Called when the user navigates between branches (chevron clicks).
// Persists the new activePath to the Chat table.
// ─────────────────────────────────────────────────────────────────────────────
export const updateActivePath = async (req, res, next) => {
  const { chatId, activePath } = req.body;
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!chatId || !Array.isArray(activePath)) {
      throw createHttpError.BadRequest(
        "Please provide chatId and activePath array",
      );
    }

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }

    await prisma.chat.update({
      where: { id: chatId },
      data: { activePath },
    });

    return res.status(200).json({ success: true, activePath });
  } catch (error) {
    logger.error("error in updateActivePath controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getMessages — GET /chat/getMessages?chatId=
// Returns all message nodes for a chat (full tree) plus the resolved activePath.
// Frontend builds the nodeMap and renders the activePath as the visible list.
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = async (req, res, next) => {
  const { chatId } = req.query;
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!chatId || typeof chatId !== "string") {
      throw createHttpError.BadRequest("Please provide chatId");
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            text: true,
            role: true,
            status: true,
            parentId: true,
            aiModel: true,
            feedback: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }

    const now = new Date();
    const THINKING_TIMEOUT_MS = 120_000; // 2 minutes

    // Handle stale thinking messages
    const processedMessages = await Promise.all(
      chat.messages.map(async (msg) => {
        if (msg.status === "thinking" && msg.role === "assistant") {
          const timeSince = now.getTime() - new Date(msg.createdAt).getTime();
          if (timeSince > THINKING_TIMEOUT_MS) {
            prisma.message
              .update({
                where: { id: msg.id },
                data: {
                  status: "error",
                  text: "Response generation interrupted",
                },
              })
              .catch((err) =>
                logger.error("Failed to update stale message:", err),
              );

            return {
              id: msg.id,
              parentId: msg.parentId,
              text: "Response generation interrupted",
              role: msg.role,
              status: "error" as const,
              aiModel: msg.aiModel,
              feedback: msg.feedback,
              createdAt: msg.createdAt,
              updatedAt: msg.updatedAt,
            };
          }
        }
        return msg;
      }),
    );

    // Resolve the active path (validate persisted path or walk to latest leaf)
    const activePath = await resolveActivePath(chatId, chat.activePath);

    // If resolved path differs from persisted (e.g. first load), persist it
    if (
      activePath.join(",") !== chat.activePath.join(",") &&
      activePath.length > 0
    ) {
      prisma.chat
        .update({ where: { id: chatId }, data: { activePath } })
        .catch((err) => logger.error("Failed to persist activePath:", err));
    }

    return res.status(200).json({
      success: true,
      nodes: processedMessages,
      activePath,
    });
  } catch (error) {
    logger.error("error in getMessages controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getChats — unchanged
// ─────────────────────────────────────────────────────────────────────────────
export const getChats = async (req, res, next) => {
  const userId = req.user?.Id || req.user?.userId;
  try {
    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    });
    if (!chats) throw createHttpError.NotFound("No chats found for the user");
    res.status(200).json({ chats });
  } catch (error) {
    logger.error("Error in getChats controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// abortMessage — unchanged in contract
// ─────────────────────────────────────────────────────────────────────────────
export const abortMessage = async (req, res, next) => {
  const { messageId } = req.query;
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!messageId || typeof messageId !== "string") {
      throw createHttpError.BadRequest("Please provide messageId");
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { Chat: true },
    });

    if (!message || !message.Chat || message.Chat.userId !== userId) {
      throw createHttpError.NotFound("Message not found");
    }

    if (message.status === "thinking") {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: "aborted",
          text: "AI generation aborted",
          updatedAt: new Date(),
        },
      });
      return res
        .status(200)
        .json({ success: true, message: "Message generation aborted" });
    }

    return res.status(400).json({
      success: false,
      message: "Message is not in a state that can be aborted",
    });
  } catch (error) {
    logger.error("error in abortMessage controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// updateFeedback — PATCH /chat/message/:messageId/feedback
// Sets LIKE / DISLIKE / null on an AI message.
// ─────────────────────────────────────────────────────────────────────────────
export const updateFeedback = async (req, res, next) => {
  const { messageId } = req.params;
  const { feedback } = req.body; // "LIKE" | "DISLIKE" | null
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!messageId || typeof messageId !== "string") {
      throw createHttpError.BadRequest("Please provide messageId");
    }
    if (feedback !== "LIKE" && feedback !== "DISLIKE" && feedback !== null) {
      throw createHttpError.BadRequest(
        "feedback must be 'LIKE', 'DISLIKE', or null",
      );
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { Chat: { select: { userId: true } } },
    });

    if (!message || message.Chat.userId !== userId) {
      throw createHttpError.NotFound("Message not found");
    }
    if (message.role !== "assistant") {
      throw createHttpError.BadRequest(
        "Feedback can only be set on AI messages",
      );
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { feedback: feedback ?? null },
    });

    return res.status(200).json({
      success: true,
      feedback: updated.feedback,
    });
  } catch (error) {
    logger.error("error in updateFeedback controller", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given the current activePath and a targetId, return the path up to
 * (NOT including) the target. Used for edit branching.
 */
function buildPathUpToParent(activePath: string[], targetId: string): string[] {
  const idx = activePath.indexOf(targetId);
  if (idx === -1) return [];
  return activePath.slice(0, idx);
}

/**
 * Given the current activePath and a sourceId, return the path up to
 * AND including the source. Used for regenerate branching.
 */
function buildPathUpToSource(activePath: string[], sourceId: string): string[] {
  const idx = activePath.indexOf(sourceId);
  if (idx === -1) return [sourceId];
  return activePath.slice(0, idx + 1);
}

function formatMessage(msg: any) {
  return {
    id: msg.id,
    chatId: msg.ChatId,
    parentId: msg.parentId,
    text: msg.text,
    role: msg.role,
    status: msg.status,
    aiModel: msg.aiModel,
    feedback: msg.feedback ?? null,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  };
}

/**
 * Shared async AI generation logic.
 * Runs as a detached async IIFE — response has already been sent.
 * Checks abort status before and after generation.
 */
function generateAsync({
  aiPlaceholderId,
  chatId,
  userMessageId,
  currentUserMessage,
  aiModel,
  lastMessageModel,
  userId,
  problemTitle,
}: {
  aiPlaceholderId: string;
  chatId: string;
  userMessageId: string;
  currentUserMessage: string;
  aiModel: string;
  lastMessageModel: string;
  userId: any;
  problemTitle?: string;
}) {
  (async () => {
    try {
      const preCheck = await prisma.message.findUnique({
        where: { id: aiPlaceholderId },
        include: { Chat: true },
      });
      if (!preCheck || !preCheck.Chat) {
        logger.info(
          `Message ${aiPlaceholderId} or its chat was deleted before generation`,
        );
        return;
      }
      if (preCheck.status === "aborted") {
        logger.info(`Message ${aiPlaceholderId} was aborted before generation`);
        return;
      }

      const aiResponse = await generateAIResponse({
        chatId,
        userMessageId,
        currentUserMessage,
        regenerate: false,
        aiModel,
        lastMessageModel,
        userId,
        problemTitle,
      });

      const postCheck = await prisma.message.findUnique({
        where: { id: aiPlaceholderId },
        include: { Chat: true },
      });
      if (!postCheck || !postCheck.Chat) {
        logger.info(
          `Message ${aiPlaceholderId} or its chat was deleted during generation`,
        );
        return;
      }
      if (postCheck.status === "aborted") {
        logger.info(`Message ${aiPlaceholderId} was aborted during generation`);
        return;
      }

      await prisma.message.update({
        where: { id: aiPlaceholderId },
        data: { text: aiResponse, status: "sent", updatedAt: new Date() },
      });

      logger.info(`AI response generated for message ${aiPlaceholderId}`);
    } catch (error) {
      logger.error("Error generating AI response:", error);
      try {
        const errorCheck = await prisma.message.findUnique({
          where: { id: aiPlaceholderId },
        });
        if (errorCheck) {
          await prisma.message.update({
            where: { id: aiPlaceholderId },
            data: {
              text: "Failed to generate response",
              status: "error",
              updatedAt: new Date(),
            },
          });
        }
      } catch (updateError) {
        logger.error("Failed to update error status:", updateError);
      }
    }
  })();
}

//-----------------------------------------------share chat controllers-----------------------------------------------------------

// ── Helper: resolve the active path of a chat ─────────────────────────────────
// Reads Chat.activePath (same source of truth the frontend uses) and fetches
// only the messages along that path with status "sent" or "aborted".
// This guarantees the snapshot matches exactly what the sharer sees on screen.

async function resolveSnapshotMessages(chatId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { activePath: true },
  });

  if (!chat) return null;

  let messageIds: string[] = chat.activePath ?? [];

  // Fallback: if activePath is empty, fetch all messages ordered by date
  if (messageIds.length === 0) {
    const all = await prisma.message.findMany({
      where: { ChatId: chatId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    messageIds = all.map((m) => m.id);
  }

  if (messageIds.length === 0) return [];

  // Fetch in one query then re-order to match activePath order
  const messages = await prisma.message.findMany({
    where: {
      id: { in: messageIds },
      ChatId: chatId,
      status: { in: ["sent", "aborted"] },
    },
    select: {
      id: true,
      ChatId: true,
      parentId: true,
      text: true,
      role: true,
      status: true,
      aiModel: true,
      feedback: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Re-order to match activePath sequence
  const byId = new Map(messages.map((m) => [m.id, m]));
  return messageIds
    .map((id) => byId.get(id))
    .filter(Boolean) as typeof messages;
}

// ── POST /api/chatShare/share ─────────────────────────────────────────────────
// Auth required. Creates a snapshot of the active path and returns shareId.

export const shareChat = async (req: any, res: any, next: any) => {
  const userId = req.user?.Id || req.user?.userId;
  const { chatId } = req.body;

  try {
    if (!chatId || typeof chatId !== "string") {
      throw createHttpError.BadRequest("Please provide chatId");
    }

    // Verify ownership
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true, title: true },
    });

    if (!chat) {
      throw createHttpError.NotFound("Chat not found");
    }

    if (chat.userId !== userId) {
      throw createHttpError.Forbidden("Access denied");
    }

    const messages = await resolveSnapshotMessages(chatId);

    if (!messages || messages.length === 0) {
      throw createHttpError.BadRequest("Cannot share an empty chat");
    }

    const SHARE_TTL_DAYS = 30;

    const shared = await prisma.sharedChat.create({
      data: {
        title: chat.title,
        messages: messages as any,
        userId,
        sourceChatId: chatId,
        expiresAt: new Date(Date.now() + 10 * 1000),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Chat shared successfully",
      shareId: shared.id,
    });
  } catch (error) {
    logger.error("Error in shareChat controller", error);
    next(error);
  }
};

// ── GET /api/chatShare/shared/:shareId ────────────────────────────────────────
// No auth required — publicly accessible snapshot for any recipient.

export const getSharedChat = async (req: any, res: any, next: any) => {
  const { shareId } = req.params;

  try {
    if (!shareId || typeof shareId !== "string") {
      throw createHttpError.BadRequest("Please provide shareId");
    }

    const shared = await prisma.sharedChat.findUnique({
      where: { id: shareId },
    });

    if (!shared) {
      return res.status(404).json({
        success: false,
        message: "Shared chat not found or link is invalid",
      });
    }

    if (shared.expiresAt && shared.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: "This shared link has expired",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: shared.id,
        title: shared.title,
        messages: shared.messages,
        createdAt: shared.createdAt,
        expiresAt: shared.expiresAt,
      },
    });
  } catch (error) {
    logger.error("Error in getSharedChat controller", error);
    next(error);
  }
};

// ── POST /api/chatShare/fork ──────────────────────────────────────────────────
// Auth required. Creates a new Chat for the logged-in user from the snapshot.
// The forked chat is a clean linear tree (no branching) — a fresh copy of the
// shared conversation that the user can continue from.

export const forkSharedChat = async (req: any, res: any, next: any) => {
  const userId = req.user?.userId ?? req.user?.Id;
  const { shareId } = req.body;

  try {
    if (!shareId || typeof shareId !== "string") {
      throw createHttpError.BadRequest("Please provide shareId");
    }

    // ── Fetch the snapshot first (needed for all checks below) ───────────────
    const shared = await prisma.sharedChat.findUnique({
      where: { id: shareId },
      select: { sourceChatId: true, title: true, messages: true },
    });

    if (!shared) {
      throw createHttpError.NotFound("Shared chat not found");
    }

    // ── Check 1: user already OWNS the original chat ─────────────────────────
    // Covers self-share: sharer tries to fork their own chat back.
    if (shared.sourceChatId) {
      const ownsOriginal = await prisma.chat.findFirst({
        where: { id: shared.sourceChatId, userId },
        select: { id: true },
      });

      if (ownsOriginal) {
        return res.status(409).json({
          success: false,
          alreadyForked: true,
          chatId: ownsOriginal.id,
          message: "This shared chat already exists in your chat history",
        });
      }
    }

    // ── Check 2: user already forked this chat (any share link) ──────────────
    // Covers the case where they forked before but no longer own the original.
    const existingFork = await prisma.chat.findFirst({
      where: {
        userId,
        ...(shared.sourceChatId
          ? { sourceChatId: shared.sourceChatId }
          : { sourceShareId: shareId }),
      },
      select: { id: true },
    });

    if (existingFork) {
      return res.status(409).json({
        success: false,
        alreadyForked: true,
        chatId: existingFork.id,
        message: "This shared chat already exists in your chat history",
      });
    }

    // ── Build the forked chat ─────────────────────────────────────────────────
    const snapshotMessages = shared.messages as Array<{
      role: "user" | "assistant";
      text: string;
      status: string;
      aiModel: string | null;
      createdAt: string;
    }>;

    const forkedChat = await prisma.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          userId,
          title: shared.title,
          sourceShareId: shareId,
          sourceChatId: shared.sourceChatId ?? null,
        },
      });

      let prevId: string | null = null;
      const newActivePath: string[] = [];

      for (const msg of snapshotMessages) {
        const created = await tx.message.create({
          data: {
            ChatId: chat.id,
            parentId: prevId,
            text: msg.text,
            role: msg.role,
            status: "sent",
            aiModel: msg.aiModel ?? null,
          },
        });
        prevId = created.id;
        newActivePath.push(created.id);
      }

      await tx.chat.update({
        where: { id: chat.id },
        data: { activePath: newActivePath },
      });

      return chat;
    });

    return res.status(201).json({
      success: true,
      message: "Chat forked successfully",
      chatId: forkedChat.id,
    });
  } catch (error) {
    logger.error("Error in forkSharedChat controller", error);
    next(error);
  }
};


const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN!,
  testInboxId: Number(process.env.MAILTRAP_INBOX_ID),
});

interface SendChatEmailBody {
  chatId: string;
  recipientEmail: string;
  shareUrl: string;
  chatTitle?: string | null;
}

export const sendChatEmail = async (req: any, res: any, next: any): Promise<void> => {
  const { recipientEmail, shareUrl, chatTitle } = req.body as SendChatEmailBody;

  if (!recipientEmail || !shareUrl) {
    res.status(400).json({
      success: false,
      message: "Recipient email and share URL are required.",
    });
    return;
  }

  try {
    await client.testing.send({
      from: {
        email: "mailtrap@example.com",
        name: "Nova AI",
      },
      to: [{ email: recipientEmail }],
      subject: "Someone shared a Nova AI chat with you",
      html: sharedChatEmail({ shareUrl, chatTitle }),
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully.",
    });
  } catch (error) {
    const err = error as Error;
    console.error("[sendChatEmail]", err.message);
    next(error);
  }
};

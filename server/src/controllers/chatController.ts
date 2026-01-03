import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import createHttpError from "http-errors";
import { generateAIResponse } from "../services/rag/aiService.js";

export const createChat = async (req, res, next) => {
  const userId = req.user?.Id || req.user?.userId;

  try {
    const Chat = await prisma.chat.create({
      data: {
        userId,
      },
    });

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

    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    logger.error("error in deleteChat controller", error);
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  const { chatId } = req.query;
  const { message } = req.body;
  const userId = req.user?.Id || req.user?.userId;

  try {
    // 1️⃣ VALIDATE INPUTS
    if (!chatId || typeof chatId !== "string") {
      throw createHttpError.BadRequest("Please provide chatId");
    }

    if (!message || typeof message !== "string") {
      throw createHttpError.BadRequest("Please provide message");
    }

    // Verify chat exists and belongs to user
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { messages: { select: { id: true } } },
    });

    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }

    const isFirstMessage = chat.messages.length === 0;

    // 2️⃣ PERSIST USER MESSAGE IMMEDIATELY
    const userMessage = await prisma.message.create({
      data: {
        ChatId: chatId,
        role: "user",
        text: message,
        status: "sent",
      },
    });

    // 3️⃣ CREATE AI PLACEHOLDER MESSAGE IMMEDIATELY
    const aiPlaceholder = await prisma.message.create({
      data: {
        ChatId: chatId,
        role: "assistant",
        text: "",
        status: "thinking",
      },
    });

    // Update chat title if first message
    if (isFirstMessage) {
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;

      await prisma.chat.update({
        where: { id: chatId },
        data: {
          title: title,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });
    }

    // 4️⃣ RESPOND IMMEDIATELY TO FRONTEND (DO NOT WAIT)
    res.status(200).json({
      success: true,
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        text: userMessage.text,
        status: userMessage.status,
        updatedAt: userMessage.updatedAt,
      },
      aiMessage: {
        id: aiPlaceholder.id,
        role: aiPlaceholder.role,
        text: aiPlaceholder.text,
        status: aiPlaceholder.status,
        updatedAt: aiPlaceholder.updatedAt,
      },
    });

    // 5️⃣ GENERATE AI RESPONSE ASYNCHRONOUSLY (Fire-and-Forget)
    (async () => {
      try {
        // ✅ Check if message still exists before generating (in case it was aborted/deleted)
        const messageCheck = await prisma.message.findUnique({
          where: { id: aiPlaceholder.id },
          include: { Chat: true },
        });

        // If message or chat was deleted, stop generation
        if (!messageCheck || !messageCheck.Chat) {
          logger.info(
            `Message ${aiPlaceholder.id} or its chat was deleted before AI generation completed`
          );
          return;
        }

        // If message is already aborted, don't generate
        if (messageCheck.status === "aborted") {
          logger.info(
            `Message ${aiPlaceholder.id} was aborted before generation started`
          );
          return;
        }

        const aiResponse = await generateAIResponse(message);

        // ✅ Final check before updating - ensure message wasn't aborted/deleted during generation
        const finalCheck = await prisma.message.findUnique({
          where: { id: aiPlaceholder.id },
          include: { Chat: true },
        });

        if (!finalCheck || !finalCheck.Chat) {
          logger.info(
            `Message ${aiPlaceholder.id} or its chat was deleted during AI generation`
          );
          return;
        }

        if (finalCheck.status === "aborted") {
          logger.info(
            `Message ${aiPlaceholder.id} was aborted during generation`
          );
          return;
        }

        // Update the existing AI placeholder message
        await prisma.message.update({
          where: { id: aiPlaceholder.id },
          data: {
            text: aiResponse,
            status: "sent",
            updatedAt: new Date(),
          },
        });

        logger.info(`AI response generated for message ${aiPlaceholder.id}`);
      } catch (error) {
        logger.error("Error generating AI response:", error);

        // ✅ Only mark as error if message still exists
        try {
          const errorCheck = await prisma.message.findUnique({
            where: { id: aiPlaceholder.id },
          });

          if (errorCheck) {
            await prisma.message.update({
              where: { id: aiPlaceholder.id },
              data: {
                text: "Failed to generate response",
                status: "error",
                updatedAt: new Date(),
              },
            });
          }
        } catch (updateError) {
          logger.error(
            "Failed to update error status (message may have been deleted):",
            updateError
          );
        }
      }
    })();
  } catch (error) {
    logger.error("error in sendMessage controller", error);
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  const { chatId } = req.query;
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!chatId || typeof chatId !== "string") {
      throw createHttpError.BadRequest("Please provide chatId");
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            text: true,
            role: true,
            status: true,
            updatedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }

    // 🔧 Check for stale "thinking" messages
    const now = new Date();
    const THINKING_TIMEOUT_MS = 120000; // 2 minutes

    const processedMessages = chat.messages.map((msg) => {
      // If message is stuck in "thinking" for too long, mark as error
      if (msg.status === "thinking" && msg.role === "assistant") {
        const timeSinceCreation =
          now.getTime() - new Date(msg.createdAt).getTime();

        if (timeSinceCreation > THINKING_TIMEOUT_MS) {
          // Update in DB asynchronously
          prisma.message
            .update({
              where: { id: msg.id },
              data: {
                status: "error",
                text: "Response generation interrupted",
              },
            })
            .catch((err) =>
              logger.error("Failed to update stale message:", err)
            );

          return {
            id: msg.id,
            text: "Response generation interrupted",
            role: msg.role,
            status: "error",
            updatedAt: msg.updatedAt,
          };
        }
      }

      return {
        id: msg.id,
        text: msg.text,
        role: msg.role,
        status: msg.status,
        updatedAt: msg.updatedAt,
      };
    });

    return res.status(200).json(processedMessages);
  } catch (error) {
    logger.error("error in getMessages controller", error);
    next(error);
  }
};

export const getChats = async (req, res, next) => {
  const userId = req.user?.Id || req.user?.userId;

  try {
    const chats = await prisma.chat.findMany({
      where: { userId: userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    });

    if (!chats) {
      throw createHttpError.NotFound("No chats found for the user");
    }

    res.status(200).json({
      chats,
    });
  } catch (error) {
    logger.error("Error in getChats controller", error);
    next(error);
  }
};

// ✅ NEW ENDPOINT: Abort AI Message Generation
export const abortMessage = async (req, res, next) => {
  const { messageId } = req.query;
  const userId = req.user?.Id || req.user?.userId;

  try {
    if (!messageId || typeof messageId !== "string") {
      throw createHttpError.BadRequest("Please provide messageId");
    }

    // Find message and verify ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { Chat: true },
    });

    if (!message || message.Chat.userId !== userId) {
      throw createHttpError.NotFound("Message not found");
    }

    // Only abort if message is in "thinking" state
    if (message.status === "thinking") {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: "aborted",
          text: "Generation aborted by user",
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Message generation aborted",
      });
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

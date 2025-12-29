import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import { randomUUID } from "crypto";
import { generateAIResponse } from "../services/aiService.js";
import createHttpError from "http-errors";

export const createChat = async (req, res, next) => {
  const userId = req.user?.Id || req.user?.userId;

  try {
    //Guest user
    if (!userId) {
      return res.status(200).json({
        success: true,
        message: "Chat created successfully",
        chatId: `guest-${randomUUID()}`,
        isGuest: true,
      });
    }

    // Logged-in user

    const Chat = await prisma.chat.create({
      data: {
        userId,
        isGuest: false,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Chat created successfully",
      chatId: Chat.id,
      isGuest: false,
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

    if (!userId || chatId.startsWith("guest-")) {
      return res
        .status(200)
        .json({ success: true, message: "Chat deleted successfully" });
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
    if (!chatId || typeof chatId !== "string") {
      throw createHttpError.BadRequest("Please provide chatId");
    }

    if (!message || typeof message !== "string") {
      throw createHttpError.BadRequest("Please provide message");
    }

    const aiResponse = await generateAIResponse(message);

    // Guest user
    if (!userId || chatId.startsWith("guest-")) {
      return res.status(200).json({
        success: true,
        userMessage: {
          id: randomUUID(),
          role: "user",
          text: message,
        },
        aiMessage: {
          id: randomUUID(),
          role: "assistant",
          text: aiResponse,
        },
        isGuest: true,
      });
    }

    // Logged-in user

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });

    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }

    const userMessage = await prisma.message.create({
      data: {
        ChatId: chatId,
        role: "user",
        text: message,
        status: "sent",
      },
    });

    const aiMessage = await prisma.message.create({
      data: {
        ChatId: chatId,
        role: "assistant",
        text: aiResponse,
        status: "sent",
      },
    });

    return res.status(200).json({
      success: true,
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        text: userMessage.text,
      },
      aiMessage: {
        id: aiMessage.id,
        role: aiMessage.role,
        text: aiMessage.text,
      },
      isGuest: false,
    });
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

    //guest user
    if (!userId || chatId.startsWith("guest-")) {
      return res.status(200).json([]);
    }

    // Logged-in user
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            text: true,
            role: true,
            status: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!chat || chat.userId !== userId) {
      throw createHttpError.NotFound("Chat not found");
    }

    return res.status(200).json(chat.messages);
  } catch (error) {
    logger.error("error in getMessages controller", error);
    next(error);
  }
};

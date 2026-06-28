import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import logger from "../../configs/loggerConfig.js";
import prisma from "../../configs/db.js";
const SUMMARY_UPDATE_THRESHOLD = 10;
const MAX_MESSAGES_PER_SUMMARIZATION_BATCH = 50;
const MAX_MESSAGE_CONTENT_LENGTH_IN_PROMPT = 500;
const SUMMARY_MAX_TOKENS = 500;
const SUMMARY_TEMPERATURE = 0.3;
// ── Private helpers ───────────────────────────────────────────────
const truncateContent = (content) => {
    if (content.length <= MAX_MESSAGE_CONTENT_LENGTH_IN_PROMPT) {
        return content;
    }
    return content.slice(0, MAX_MESSAGE_CONTENT_LENGTH_IN_PROMPT) + "...";
};
const buildIncrementalSummaryPrompt = (newMessages, existingSummary) => {
    const conversationText = newMessages
        .map((m) => `[${m.role.toUpperCase()}]: ${truncateContent(m.content)}`)
        .join("\n\n");
    return `You are a conversation summarizer for an AI coding assistant that helps users solve LeetCode-style problems.

# EXISTING SUMMARY
${existingSummary}

# NEW MESSAGES TO INCORPORATE
${conversationText}

# TASK
Update the existing summary to include the new messages above.

# RULES
1. Output under 300 words
2. Preserve ALL of the following from the existing summary and new messages:
   - What coding problem is being discussed
   - What approaches or solutions were attempted
   - What errors or bugs occurred
   - What data structures or algorithms were mentioned
   - Current state of the user's understanding
3. Use concise, technical language
4. Never include message counts or timestamps
5. Never fabricate information not present in the messages

# OUTPUT
Return ONLY the updated summary text. No preamble. No explanation.`;
};
const buildInitialSummaryPrompt = (messages) => {
    const conversationText = messages
        .map((m) => `[${m.role.toUpperCase()}]: ${truncateContent(m.content)}`)
        .join("\n\n");
    return `You are a conversation summarizer for an AI coding assistant that helps users solve LeetCode-style problems.

# CONVERSATION
${conversationText}

# TASK
Create a concise summary of this conversation.

# RULES
1. Output under 300 words
2. Focus on:
   - What coding problem is being discussed
   - What approaches or solutions were attempted
   - What errors or bugs occurred
   - What data structures or algorithms were mentioned
   - Current state of the user's understanding
3. Use concise, technical language
4. Never include message counts or timestamps

# OUTPUT
Return ONLY the summary text. No preamble. No explanation.`;
};
const generateSummaryWithLLM = async (messages, existingSummary) => {
    const prompt = existingSummary !== null
        ? buildIncrementalSummaryPrompt(messages, existingSummary)
        : buildInitialSummaryPrompt(messages);
    try {
        const result = await generateText({
            model: google("gemini-2.5-flash"),
            prompt,
            temperature: SUMMARY_TEMPERATURE,
            maxTokens: SUMMARY_MAX_TOKENS,
        });
        return result.text.trim();
    }
    catch (error) {
        logger.error("Conversation summary LLM generation failed", { error });
        return existingSummary !== null
            ? existingSummary
            : "Conversation summary unavailable.";
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// fetchConversationSummary
//
// CHANGED: now takes leafMessageId as second param and looks up by
// (chatId, leafMessageId) composite key instead of chatId alone.
// Each branch tip has its own summary row.
// ─────────────────────────────────────────────────────────────────────────────
export const fetchConversationSummary = async (chatId, leafMessageId) => {
    try {
        const record = await prisma.conversationSummary.findUnique({
            where: {
                chatId_leafMessageId: { chatId, leafMessageId }, // CHANGED
            },
            select: {
                summary: true,
                messageCount: true,
            },
        });
        if (record === null) {
            return { summary: null, messageCount: 0, exists: false };
        }
        return {
            summary: record.summary,
            messageCount: record.messageCount,
            exists: true,
        };
    }
    catch (error) {
        logger.error("Failed to fetch conversation summary", {
            error,
            chatId,
            leafMessageId,
        });
        return { summary: null, messageCount: 0, exists: false };
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// shouldUpdateSummary
//
// CHANGED: now takes activePath instead of chatId.
// Counts messages on the current branch (activePath.length) instead of
// counting all messages in the chat (which would include sibling branches).
// ─────────────────────────────────────────────────────────────────────────────
export const shouldUpdateSummary = async (chatId, activePath, // NEW
leafMessageId) => {
    try {
        const record = await prisma.conversationSummary.findUnique({
            where: {
                chatId_leafMessageId: { chatId, leafMessageId }, // CHANGED
            },
            select: { messageCount: true },
        });
        // Branch message count = activePath length (path includes every node root→leaf)
        const branchMessageCount = activePath.length; // CHANGED
        const lastSummarizedCount = record !== null ? record.messageCount : 0;
        return branchMessageCount - lastSummarizedCount >= SUMMARY_UPDATE_THRESHOLD;
    }
    catch (error) {
        logger.error("Failed to check if summary should update", { error, chatId });
        return false;
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// updateConversationSummary
//
// CHANGED: now takes activePath and leafMessageId.
// Fetches only messages on the current branch (by ID whitelist, not createdAt).
// Upserts keyed on (chatId, leafMessageId) — each branch tip gets its own row.
// ─────────────────────────────────────────────────────────────────────────────
export const updateConversationSummary = async (input) => {
    const { chatId, activePath, // NEW
    leafMessageId, // NEW
    forceUpdate = false, problemTitle, } = input;
    try {
        const existingRecord = await prisma.conversationSummary.findUnique({
            where: {
                chatId_leafMessageId: { chatId, leafMessageId }, // CHANGED
            },
        });
        // CHANGED: branch message count from activePath length, not total chat count
        const branchMessageCount = activePath.length;
        const messagesSinceLastUpdate = branchMessageCount -
            (existingRecord !== null ? existingRecord.messageCount : 0);
        const updateRequired = forceUpdate ||
            existingRecord === null ||
            messagesSinceLastUpdate >= SUMMARY_UPDATE_THRESHOLD;
        if (!updateRequired) {
            logger.info("Conversation summary update skipped — threshold not reached", {
                chatId,
                leafMessageId,
                messagesSinceLastUpdate,
            });
            return;
        }
        // CHANGED: fetch messages on this branch only (by ID whitelist)
        // If existing record has a lastMessageId, only fetch messages that come
        // after it in the activePath (incremental). Otherwise fetch all path messages.
        const lastSummarizedId = existingRecord?.lastMessageId ?? null;
        const lastSummarizedIdx = lastSummarizedId
            ? activePath.indexOf(lastSummarizedId)
            : -1;
        const idsToSummarize = lastSummarizedIdx >= 0
            ? activePath.slice(lastSummarizedIdx + 1)
            : activePath;
        const batchIds = idsToSummarize.slice(-MAX_MESSAGES_PER_SUMMARIZATION_BATCH);
        const messagesToSummarize = await prisma.message.findMany({
            where: { id: { in: batchIds } },
            select: { id: true, role: true, text: true },
        });
        // Re-sort to match activePath order (findMany with `in` does not preserve order)
        const msgMap = new Map(messagesToSummarize.map((m) => [m.id, m]));
        const orderedMessages = batchIds
            .map((id) => msgMap.get(id))
            .filter((m) => m !== undefined);
        if (orderedMessages.length === 0) {
            logger.info("Conversation summary update skipped — no new messages on branch", {
                chatId,
                leafMessageId,
            });
            return;
        }
        const newSummary = await generateSummaryWithLLM(orderedMessages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
        })), existingRecord !== null ? existingRecord.summary : null);
        // CHANGED: upsert keyed on (chatId, leafMessageId)
        await prisma.conversationSummary.upsert({
            where: {
                chatId_leafMessageId: { chatId, leafMessageId },
            },
            create: {
                chatId,
                leafMessageId,
                summary: newSummary,
                messageCount: branchMessageCount,
                lastMessageId: leafMessageId,
            },
            update: {
                summary: newSummary,
                messageCount: branchMessageCount,
                lastMessageId: leafMessageId,
            },
        });
        logger.info("Conversation summary updated", {
            chatId,
            leafMessageId,
            problemTitle,
            processedMessages: orderedMessages.length,
            branchMessageCount,
            summaryLength: newSummary.length,
        });
    }
    catch (error) {
        logger.error("Failed to update conversation summary", { error, chatId });
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// archiveAndResetSummaryOnTopicChange
//
// CHANGED: now takes leafMessageId. No longer mutates the row (that would
// corrupt context for other branches). Instead marks it as archived via
// topicContext field and leaves it as a read-only historical snapshot.
// The new topic will create its own fresh row at its own leafMessageId.
// ─────────────────────────────────────────────────────────────────────────────
export const archiveAndResetSummaryOnTopicChange = async (chatId, leafMessageId) => {
    try {
        const existingRecord = await prisma.conversationSummary.findUnique({
            where: {
                chatId_leafMessageId: { chatId, leafMessageId }, // CHANGED
            },
        });
        if (existingRecord === null) {
            return;
        }
        // Mark this branch's summary as archived without deleting it.
        // Other branches that share history up to this point are unaffected.
        await prisma.conversationSummary.update({
            where: {
                chatId_leafMessageId: { chatId, leafMessageId }, // CHANGED
            },
            data: {
                topicContext: "Topic reset — new discussion started",
            },
        });
        logger.info("Conversation summary archived on topic reset", {
            chatId,
            leafMessageId,
        });
    }
    catch (error) {
        logger.error("Failed to archive conversation summary on topic reset", {
            error,
            chatId,
            leafMessageId,
        });
    }
};
// ─────────────────────────────────────────────────────────────────────────────
// inheritSummaryForBranch  (NEW EXPORT)
//
// Called from chatController.createBranch immediately after the new branch
// node is created. Clones the most recent summary from the parent branch
// into a new row keyed to the new branch leaf, so the new branch starts
// with the full historical context of its ancestor path.
// ─────────────────────────────────────────────────────────────────────────────
export const inheritSummaryForBranch = async (chatId, branchParentMessageId, newLeafMessageId) => {
    if (!branchParentMessageId)
        return;
    try {
        // Find the most recently updated summary for this chat.
        // This is the parent branch's summary at the moment of the split.
        const parentSummary = await prisma.conversationSummary.findFirst({
            where: { chatId },
            orderBy: { updatedAt: "desc" },
        });
        if (!parentSummary) {
            logger.info(`[inheritSummaryForBranch] No parent summary found for chat ${chatId} — new branch starts without summary`);
            return;
        }
        // Clone into a new row for the new branch leaf.
        // Uses create (not upsert) — if the row already exists, it means
        // the branch was created but summary was already seeded (idempotent skip).
        await prisma.conversationSummary.create({
            data: {
                chatId,
                leafMessageId: newLeafMessageId,
                summary: parentSummary.summary,
                messageCount: parentSummary.messageCount,
                lastMessageId: branchParentMessageId,
                topicContext: parentSummary.topicContext,
            },
        });
        logger.info(`[inheritSummaryForBranch] Summary inherited for new leaf ${newLeafMessageId}`, { chatId });
    }
    catch (error) {
        // P2002 = unique constraint violation = row already exists = safe to ignore
        if (error?.code !== "P2002") {
            logger.error("inheritSummaryForBranch failed (non-fatal)", {
                error,
                chatId,
                newLeafMessageId,
            });
        }
    }
};

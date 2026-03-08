import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";

// ─────────────────────────────────────────────────────────────────
// CURSOR HELPERS
// Format: "<timestamp>_<id>"  e.g. "1695678200000_42"
// Using createdAt.getTime() + id as tiebreaker guarantees
// stable, unique ordering even when two comments share the same ms.
// ─────────────────────────────────────────────────────────────────

const encodeCursor = (createdAt: Date, id: number): string => {
  return `${createdAt.getTime()}_${id}`;
};

const decodeCursor = (cursor: string): { createdAt: Date; id: number } => {
  const [tsStr, idStr] = cursor.split("_");
  return {
    createdAt: new Date(parseInt(tsStr, 10)),
    id: parseInt(idStr, 10),
  };
};

// ─────────────────────────────────────────────────────────────────
// CREATE COMMENT
// POST /comment/create
// Body: { postId, content, parentId? }
//
// parentId absent  → creates a top-level comment on the post
// parentId present → creates a reply to that specific comment
// ─────────────────────────────────────────────────────────────────

export const createComment = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { postId, content, parentId } = req.body;

    if (!postId || !content) {
      throw createHttpError.BadRequest("postId and content are required");
    }

    if (!content.trim()) {
      throw createHttpError.BadRequest("Content cannot be empty");
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      select: { id: true },
    });

    if (!post) {
      throw createHttpError.NotFound("Post not found");
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: Number(parentId) },
        select: { id: true, postId: true },
      });

      if (!parentComment) {
        throw createHttpError.NotFound("Parent comment not found");
      }

      if (parentComment.postId !== Number(postId)) {
        throw createHttpError.BadRequest(
          "Parent comment does not belong to this post",
        );
      }
    }

    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorId: userId,
        postId: Number(postId),
        parentId: parentId ? Number(parentId) : null,
      },
      include: {
        author: {
          select: { id: true, name: true, picture: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    const formattedComment = {
      id: newComment.id,
      content: newComment.content,
      postId: newComment.postId,
      parentId: newComment.parentId,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
      author: newComment.author,
      likes: 0,
      dislikes: 0,
      userReaction: null,
      replyCount: 0,
    };

    res.status(201).json({
      message: "Comment created successfully",
      comment: formattedComment,
    });
  } catch (error) {
    logger.error("Error creating comment", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET TOP-LEVEL COMMENTS FOR A POST
// GET /comment/post/:postId?limit=10&cursor=
//
// Fetches only parentId=null comments (top-level).
// Ordered by createdAt DESC (newest first).
// Cursor-based pagination: pass nextCursor from previous response.
// ─────────────────────────────────────────────────────────────────

export const getCommentsByPost = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { postId } = req.params;
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const cursor = (req.query.cursor as string) || null;

    if (!postId) {
      throw createHttpError.BadRequest("postId is required");
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      select: { id: true },
    });

    if (!post) {
      throw createHttpError.NotFound("Post not found");
    }

    const cursorData = cursor ? decodeCursor(cursor) : null;

    const comments = await prisma.comment.findMany({
      where: {
        postId: Number(postId),
        parentId: null,
        ...(cursorData && {
          OR: [
            { createdAt: { lt: cursorData.createdAt } },
            {
              createdAt: { equals: cursorData.createdAt },
              id: { lt: cursorData.id },
            },
          ],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      include: {
        author: {
          select: { id: true, name: true, picture: true },
        },
        votes: {
          select: { type: true, userId: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    const hasMore = comments.length > limit;
    const sliced = hasMore ? comments.slice(0, limit) : comments;

    const formattedComments = sliced.map((comment) => {
      const likes = comment.votes.filter((v) => v.type === "like").length;
      const dislikes = comment.votes.filter((v) => v.type === "dislike").length;
      const userReaction = userId
        ? comment.votes.find((v) => v.userId === userId)?.type || null
        : null;

      return {
        id: comment.id,
        content: comment.content,
        postId: comment.postId,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: comment.author,
        likes,
        dislikes,
        userReaction,
        replyCount: comment._count.replies,
      };
    });

    const nextCursor =
      hasMore && sliced.length > 0
        ? encodeCursor(
            sliced[sliced.length - 1].createdAt,
            sliced[sliced.length - 1].id,
          )
        : null;

    res.status(200).json({
      message: "Comments fetched successfully",
      comments: formattedComments,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    logger.error("Error fetching comments", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET REPLIES FOR A COMMENT
// GET /comment/:commentId/replies?initial=true&limit=10&cursor=
//
// One endpoint handles all 4 "load replies" button scenarios:
//
// Button 1 – "Show Replies" (first time, top-level comment):
//   ?initial=true  →  returns 1 latest reply + hasMore
//
// Button 2 – "Load More Replies" (top-level, already showing some):
//   ?initial=false&cursor=<cursor>&limit=10  →  next older page
//
// Button 3 – "Show Nested Replies" (a reply that has its own children):
//   ?initial=true  →  returns 1 latest nested reply + hasMore
//
// Button 4 – "Load More Nested Replies":
//   ?initial=false&cursor=<cursor>&limit=10  →  next older page
//
// Frontend just changes the commentId (the parent) for each case.
// ─────────────────────────────────────────────────────────────────

export const getRepliesForComment = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { commentId } = req.params;
    const initial = req.query.initial === "true";
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const cursor = (req.query.cursor as string) || null;

    if (!commentId) {
      throw createHttpError.BadRequest("commentId is required");
    }

    const parentComment = await prisma.comment.findUnique({
      where: { id: Number(commentId) },
      select: { id: true },
    });

    if (!parentComment) {
      throw createHttpError.NotFound("Comment not found");
    }

    const cursorData = cursor ? decodeCursor(cursor) : null;
    const take = initial ? 1 : limit + 1;

    const replies = await prisma.comment.findMany({
      where: {
        parentId: Number(commentId),
        ...(cursorData &&
          !initial && {
            OR: [
              { createdAt: { lt: cursorData.createdAt } },
              {
                createdAt: { equals: cursorData.createdAt },
                id: { lt: cursorData.id },
              },
            ],
          }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      include: {
        author: {
          select: { id: true, name: true, picture: true },
        },
        votes: {
          select: { type: true, userId: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    let hasMore: boolean;
    let sliced = replies;

    if (initial) {
      const totalReplies = await prisma.comment.count({
        where: { parentId: Number(commentId) },
      });
      hasMore = totalReplies > 1;
    } else {
      hasMore = replies.length > limit;
      sliced = hasMore ? replies.slice(0, limit) : replies;
    }

    const formattedReplies = sliced.map((reply) => {
      const likes = reply.votes.filter((v) => v.type === "like").length;
      const dislikes = reply.votes.filter((v) => v.type === "dislike").length;
      const userReaction = userId
        ? reply.votes.find((v) => v.userId === userId)?.type || null
        : null;

      return {
        id: reply.id,
        content: reply.content,
        postId: reply.postId,
        parentId: reply.parentId,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        author: reply.author,
        likes,
        dislikes,
        userReaction,
        replyCount: reply._count.replies,
      };
    });

    // nextCursor always points to the last returned item so the
    // next "Load More" fetch starts right after it
    const nextCursor =
      sliced.length > 0
        ? encodeCursor(
            sliced[sliced.length - 1].createdAt,
            sliced[sliced.length - 1].id,
          )
        : null;

    res.status(200).json({
      message: "Replies fetched successfully",
      replies: formattedReplies,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    logger.error("Error fetching replies", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// REACT TO COMMENT
// POST /comment/:commentId/react
// Body: { action: "like" | "dislike" }
//
// Exact same 3-case logic as your problemReaction controller.
// ─────────────────────────────────────────────────────────────────

export const reactToComment = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { commentId } = req.params;
    const { action } = req.body;

    if (!commentId) {
      throw createHttpError.BadRequest("commentId is required");
    }

    if (!action || (action !== "like" && action !== "dislike")) {
      throw createHttpError.BadRequest(
        "action must be either 'like' or 'dislike'",
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: Number(commentId) },
      select: { id: true },
    });

    if (!comment) {
      throw createHttpError.NotFound("Comment not found");
    }

    const [currentLikes, currentDislikes] = await prisma.$transaction([
      prisma.commentReaction.count({
        where: { commentId: Number(commentId), type: "like" },
      }),
      prisma.commentReaction.count({
        where: { commentId: Number(commentId), type: "dislike" },
      }),
    ]);

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId: Number(commentId),
        },
      },
    });

    if (!existingReaction) {
      // Case 1: No prior reaction → add new reaction
      await prisma.commentReaction.create({
        data: { userId, commentId: Number(commentId), type: action },
      });

      return res.status(200).json({
        message: `${action === "like" ? "Like" : "Dislike"} added successfully`,
        likes: action === "like" ? currentLikes + 1 : currentLikes,
        dislikes: action === "dislike" ? currentDislikes + 1 : currentDislikes,
        userReaction: action,
      });
    } else if (existingReaction.type === action) {
      // Case 2: Same reaction clicked again → remove it (toggle off)
      await prisma.commentReaction.delete({
        where: {
          userId_commentId: {
            userId,
            commentId: Number(commentId),
          },
        },
      });

      return res.status(200).json({
        message: `${
          action === "like" ? "Like" : "Dislike"
        } removed successfully`,
        likes: action === "like" ? currentLikes - 1 : currentLikes,
        dislikes: action === "dislike" ? currentDislikes - 1 : currentDislikes,
        userReaction: null,
      });
    } else {
      // Case 3: Opposite reaction → switch it
      await prisma.commentReaction.update({
        where: {
          userId_commentId: {
            userId,
            commentId: Number(commentId),
          },
        },
        data: { type: action },
      });

      const newLikes =
        existingReaction.type === "like" ? currentLikes - 1 : currentLikes + 1;
      const newDislikes =
        existingReaction.type === "dislike"
          ? currentDislikes - 1
          : currentDislikes + 1;

      return res.status(200).json({
        message: `Changed from ${existingReaction.type} to ${action}`,
        likes: newLikes,
        dislikes: newDislikes,
        userReaction: action,
      });
    }
  } catch (error) {
    logger.error("Error reacting to comment", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE COMMENT
// DELETE /comment/:commentId
//
// Only the author can delete their comment.
// Prisma onDelete: Cascade handles all nested replies + reactions.
// ─────────────────────────────────────────────────────────────────

export const deleteComment = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { commentId } = req.params;

    if (!commentId) {
      throw createHttpError.BadRequest("commentId is required");
    }

    const comment = await prisma.comment.findUnique({
      where: { id: Number(commentId) },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      throw createHttpError.NotFound("Comment not found");
    }

    if (comment.authorId !== userId) {
      throw createHttpError.Forbidden(
        "You are not authorized to delete this comment",
      );
    }

    await prisma.comment.delete({ where: { id: Number(commentId) } });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    logger.error("Error deleting comment", error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────
// EDIT COMMENT
// PATCH /comment/:commentId
// Body: { content }
//
// Only the author can edit. Prisma @updatedAt auto-updates timestamp.
// ─────────────────────────────────────────────────────────────────

export const editComment = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId) {
      throw createHttpError.BadRequest("commentId is required");
    }

    if (!content || !content.trim()) {
      throw createHttpError.BadRequest("Content cannot be empty");
    }

    const comment = await prisma.comment.findUnique({
      where: { id: Number(commentId) },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      throw createHttpError.NotFound("Comment not found");
    }

    if (comment.authorId !== userId) {
      throw createHttpError.Forbidden(
        "You are not authorized to edit this comment",
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id: Number(commentId) },
      data: { content: content.trim() },
      include: {
        author: {
          select: { id: true, name: true, picture: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });

    res.status(200).json({
      message: "Comment updated successfully",
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        postId: updatedComment.postId,
        parentId: updatedComment.parentId,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
        author: updatedComment.author,
        replyCount: updatedComment._count.replies,
      },
    });
  } catch (error) {
    logger.error("Error editing comment", error);
    next(error);
  }
};

import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import { getLatestSubmissionByUserId } from "../services/postService.js";
import { getPostTemplate } from "../utils/postBaseFormat.js";
import logger from "../configs/loggerConfig.js";
import {
  addTagToCloudinary,
  validateTagUsingAI,
} from "../services/postTagsService.js";
import cloudinary from "../services/uploadService.js";
import { getIO } from "../configs/socketConfig.js";


export const fetchCommentTagsFromS3 = (req, res, next) => {};

export const uploadTagsToCloudinary = async (req, res) => {
  try {
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: "Tags array is required",
      });
    }

    // Convert tags array to JSON string
    const tagsJson = JSON.stringify(tags, null, 2);

    // Convert JSON string to base64
    const base64Tags = Buffer.from(tagsJson).toString("base64");

    // Upload to Cloudinary as a raw file
    const result = await cloudinary.uploader.upload(
      `data:application/json;base64,${base64Tags}`,
      {
        public_id: "post-tags",
        resource_type: "raw",
        overwrite: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Tags uploaded to Cloudinary successfully",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    console.error("Error uploading tags to Cloudinary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload tags to Cloudinary",
      error: error.message,
    });
  }
};

export const fetchTagsFromCloudinary = async (req, res) => {
  try {
    // Construct the URL for the raw file
    const tagsUrl = cloudinary.url("post-tags", {
      resource_type: "raw",
    });

    // Fetch the tags file from Cloudinary
    const response = await fetch(tagsUrl);

    if (!response.ok) {
      // If file doesn't exist, return the default tags
      const defaultTags = require("../../data/postTags"); // Your original tags array
      return res.status(200).json({
        success: true,
        message: "Using default tags (Cloudinary file not found)",
        data: {
          tags: defaultTags,
          source: "default",
        },
      });
    }

    const tagsJson = await response.text();
    const tags = JSON.parse(tagsJson);

    res.status(200).json({
      success: true,
      message: "Tags fetched from Cloudinary successfully",
      data: {
        tags: tags,
        source: "cloudinary",
      },
    });
  } catch (error) {
    console.error("Error fetching tags from Cloudinary:", error);

    // Fallback to default tags
    const defaultTags = require("../../data/postTags");
    res.status(200).json({
      success: true,
      message: "Using default tags due to error",
      data: {
        tags: defaultTags,
        source: "default_fallback",
      },
    });
  }
};

export const checkCommentTagsUsingAI = async (req, res, next) => {
  const { tag } = req.body;
  const { action } = req.query;

  try {
    if (
      !tag ||
      !action ||
      typeof tag !== "string" ||
      typeof action !== "string"
    ) {
      logger.error("no tag or action present");
      throw createHttpError.BadRequest("no tag or action present");
    }

    if (action === "validate") {
      const validationResponse = await validateTagUsingAI(tag);

      // Normalize output
      const cleanedResponse = validationResponse?.trim().toUpperCase();

      if (cleanedResponse?.startsWith("VALID")) {
        // ✅ Tag is valid
        return res.status(200).json({
          success: true,
          message: "Valid tag",
          data: {
            tag,
            valid: true,
            added: false,
          },
        });
      } else {
        const reasonMatch = validationResponse.match(/INVALID:\s*(.*)/i);
        const reason = reasonMatch ? reasonMatch[1].trim() : "Invalid tag";

        return res.status(200).json({
          success: false,
          message: reason,
          data: {
            tag,
            valid: false,
            added: false,
          },
        });
      }
    }

    if (action === "add") {
      // First validate the tag
      const validationResponse = await validateTagUsingAI(tag);
      const cleanedResponse = validationResponse?.trim().toUpperCase();

      if (cleanedResponse?.startsWith("VALID")) {
        // ✅ Tag is valid - proceed to add
        await addTagToCloudinary(tag);

        return res.status(200).json({
          success: true,
          message: "Tag added successfully",
          data: {
            tag: tag,
            valid: true,
            added: true,
          },
        });
      } else {
        // ❌ Tag is invalid - don't add
        const reasonMatch = validationResponse.match(/INVALID:\s*(.*)/i);
        const reason = reasonMatch ? reasonMatch[1].trim() : "Invalid tag";

        return res.status(200).json({
          success: false,
          message: `Cannot add tag: ${reason}`,
          data: {
            tag,
            valid: false,
            added: false,
          },
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

export const getMarkdownEditorBasePostFormat = async (req, res, next) => {
  const { title } = req.query;

  try {
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      const baseTemplate = getPostTemplate(
        "Add you code here",
        "Add language name here"
      );
      return res.status(200).json({
        message: "base post format generated successfully",
        data: baseTemplate,
      });
    }

    const problem = await prisma.problem.findFirst({
      where: {
        title: {
          equals: title,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (!problem) {
      throw createHttpError.NotFound("Unable to find ProblemId");
    }

    const latestSubmission = await getLatestSubmissionByUserId(
      userId,
      problem.id
    );

    const formattedPost = getPostTemplate(
      latestSubmission.code,
      latestSubmission.language
    );

    res.status(200).json({
      message: "base post format generated successfully",
      data: formattedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const getDraftPostById = async (req, res, next) => {
  const { id } = req.query;
  const userId = req.user?.id || req.user?.userId;

  if (!userId) {
    throw createHttpError.Unauthorized("User not authenticated");
  }

  if (!id || typeof id !== "string") {
    throw createHttpError.BadRequest("Draft post ID is required");
  }

  try {
    const draftPost = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
        isDraftPost: true,
        authorId: userId, // Ensure user owns the draft
      },
      select: {
        id: true,
        title: true,
        content: true,
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!draftPost) {
      throw createHttpError.NotFound(
        "Draft post not found or you don't have permission to access it"
      );
    }

    // Transform tags to string array
    const tags = draftPost.tags.map((tag) => tag.name);

    res.status(200).json({
      success: true,
      message: "Draft post fetched successfully",
      data: {
        id: draftPost.id,
        title: draftPost.title,
        content: draftPost.content,
        tags: tags,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDraftPost = async (req, res, next) => {
  const { id } = req.query;
  const { title, tags, content, publish } = req.body; // publish = true means set isDraftPost to false
  const userId = req.user?.id || req.user?.userId;

  if (!userId) {
    throw createHttpError.Unauthorized("User not authenticated");
  }

  if (!id || typeof id !== "string") {
    throw createHttpError.BadRequest("Draft post ID is required");
  }

  if (!title || !content || typeof publish !== "boolean") {
    throw createHttpError.BadRequest(
      "Missing required fields: title, content, or publish flag"
    );
  }

  try {
    // Verify the draft exists and belongs to the user
    const existingDraft = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
        authorId: userId,
        isDraftPost: true,
      },
    });

    if (!existingDraft) {
      throw createHttpError.NotFound(
        "Draft post not found or you don't have permission to update it"
      );
    }

    // Delete existing tags for this post
    await prisma.postTags.deleteMany({
      where: {
        PostId: parseInt(id),
      },
    });

    // Update the post with new data
    const updatedPost = await prisma.post.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title: title,
        content: content,
        isDraftPost: !publish, // If publish is true, set isDraftPost to false
        tags: {
          create:
            tags && Array.isArray(tags) && tags.length > 0
              ? tags.map((tagName) => ({ name: tagName }))
              : [],
        },
      },
      include: {
        tags: true,
      },
    });

    const message = publish
      ? "Post published successfully"
      : "Draft updated successfully";

    try {
      if (req.cache) {
        await req.cache.invalidateByTags([
          "posts:drafts",
          `post:${parseInt(id)}`,
        ]);
      }
    } catch (cacheErr) {
      logger.error("Cache invalidation error in updateDraftPost", cacheErr);
    }
    res
      .status(200)
      .json({ success: true, message: message, data: updatedPost });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (req, res, next) => {
  const { title, tags, content, isDraftPost, problemTitle } = req.body;

  const userId = req.user.id || req.user.userId;

  if (!userId) {
    throw createHttpError.Unauthorized("User not authenticated");
  }

  if (!title || !content || !problemTitle || typeof isDraftPost !== "boolean") {
    throw createHttpError.BadRequest(
      "missing required fields in createPost controller"
    );
  }

  try {
    const problem = await prisma.problem.findFirst({
      where: {
        title: problemTitle,
      },
      select: { id: true },
    });

    if (!problem) {
      throw createHttpError.BadRequest("problem not found");
    }

    const postData: any = {
      authorId: userId,
      problemId: problem.id,
      title: title,
      content: content,
      isDraftPost: isDraftPost,
    };

    // Only create tags if they exist and are not empty
    if (tags && Array.isArray(tags) && tags.length > 0) {
      postData.tags = {
        create: tags.map((tagName) => ({ name: tagName })),
      };
    }

    const newPost = await prisma.post.create({
      data: postData,
      include: {
        tags: true,
      },
    });

    try {
      if (req.cache) {
        await req.cache.invalidateByTags([
          "posts",
          `posts:problem:${problemTitle}`,
          "posts:search",
        ]);
      }
    } catch (cacheErr) {
      logger.error("Cache invalidation error in createPost", cacheErr);
    }
    res
      .status(201)
      .json({
        success: true,
        message: "Post created successfully",
        data: newPost,
      });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req, res, next) => {
  const { problemTitle, cursor, limit } = req.query;

  if (!problemTitle) {
    throw createHttpError.BadRequest("Please provide problem title");
  }

  const userId = req.user?.id || req.user?.userId;
  const pageLimit = Math.min(parseInt(limit as string) || 10, 50);
  const cursorId = cursor ? parseInt(cursor as string) : undefined;

  try {
    const problem = await prisma.problem.findFirst({
      where: { title: problemTitle },
      select: { id: true },
    });

    if (!problem) {
      throw createHttpError.BadRequest(
        "Unable to find problem for the requested problemTitle",
      );
    }

    // Fetch limit+1 to detect whether a next page exists
    const postData = await prisma.post.findMany({
      where: { problemId: problem.id, isDraftPost: false },
      orderBy: { createdAt: "desc" },
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      take: pageLimit + 1,
      select: {
        id: true,
        title: true,
        tags: { select: { name: true } },
        author: { select: { name: true, picture: true } },
        postReactions: { select: { type: true, userId: true } },
        _count: { select: { comments: true } },
      },
    });

    const hasNextPage = postData.length > pageLimit;
    const posts = hasNextPage ? postData.slice(0, pageLimit) : postData;
    const nextCursor = hasNextPage ? posts[posts.length - 1].id : null;

    const transformedData = posts.map((post) => {
      const likes = post.postReactions.filter((r) => r.type === "like").length;
      const dislikes = post.postReactions.filter(
        (r) => r.type === "dislike",
      ).length;

      let userReaction = null;
      if (userId) {
        const userReactionData = post.postReactions.find(
          (reaction) => reaction.userId === userId,
        );
        if (userReactionData) userReaction = userReactionData.type;
      }

      return {
        id: post.id,
        title: post.title,
        tags: post.tags,
        author: post.author,
        likes,
        dislikes,
        comments: post._count.comments,
        userReaction,
      };
    });

    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: transformedData,
      pagination: { nextCursor, hasNextPage, limit: pageLimit },
    });
  } catch (error) {
    next(error);
  }
};

export const searchPosts = async (req, res, next) => {
  const { query, cursor, limit } = req.query;

  if (!query) {
    throw createHttpError.BadRequest("Search query is required");
  }

  const userId = req.user?.id || req.user?.userId;
  const pageLimit = Math.min(parseInt(limit as string) || 10, 50);
  const cursorId = cursor ? parseInt(cursor as string) : undefined;

  try {
    const postData = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query as string, mode: "insensitive" } },
          {
            tags: {
              some: {
                name: { contains: query as string, mode: "insensitive" },
              },
            },
          },
        ],
        isDraftPost: false,
      },
      orderBy: { createdAt: "desc" },
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      take: pageLimit + 1,
      select: {
        id: true,
        title: true,
        tags: { select: { name: true } },
        author: { select: { name: true, picture: true } },
        postReactions: { select: { type: true, userId: true } },
        _count: { select: { comments: true } },
      },
    });

    const hasNextPage = postData.length > pageLimit;
    const posts = hasNextPage ? postData.slice(0, pageLimit) : postData;
    const nextCursor = hasNextPage ? posts[posts.length - 1].id : null;

    const transformedData = posts.map((post) => {
      const likes = post.postReactions.filter((r) => r.type === "like").length;
      const dislikes = post.postReactions.filter(
        (r) => r.type === "dislike",
      ).length;

      let userReaction = null;
      if (userId) {
        const userReactionData = post.postReactions.find(
          (reaction) => reaction.userId === userId,
        );
        if (userReactionData) userReaction = userReactionData.type;
      }

      return {
        id: post.id,
        title: post.title,
        tags: post.tags,
        author: post.author,
        likes,
        dislikes,
        comments: post._count.comments,
        userReaction,
      };
    });

    res.status(200).json({
      success: true,
      message: "Posts searched successfully",
      data: transformedData,
      pagination: { nextCursor, hasNextPage, limit: pageLimit },
    });
  } catch (error) {
    logger.error("Error searching posts", error);
    next(error);
  }
};

export const getDraftPosts = async (req, res, next) => {
  const { problemTitle } = req.query;
  const userId = req.user?.id || req.user?.userId;

  if (!userId) {
    throw createHttpError.Unauthorized("User not authenticated");
  }

  if (!problemTitle) {
    throw createHttpError.BadRequest("Please provide problem title");
  }

  try {
    const problem = await prisma.problem.findFirst({
      where: { title: problemTitle },
      select: { id: true },
    });

    if (!problem) {
      throw createHttpError.BadRequest(
        "Unable to find problem for the requested problemTitle"
      );
    }

    const postData = await prisma.post.findMany({
      where: { problemId: problem.id, authorId: userId, isDraftPost: true },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        updatedAt: "desc", // Most recently updated first
      },
    });

    res.status(200).json({
      success: true,
      message: "Draft posts fetched successfully",
      data: postData,
    });
  } catch (error) {
    next(error);
  }
};

export const getCombinedTags = async (req, res, next) => {
  const { problemTitle } = req.query;

  if (!problemTitle) {
    throw createHttpError.BadRequest("Please provide problem title");
  }

  try {
    // Find the problem first
    const problem = await prisma.problem.findFirst({
      where: { title: problemTitle },
      select: {
        id: true,
        tags: true,
      },
    });

    if (!problem) {
      throw createHttpError.BadRequest(
        "Unable to find problem for the requested problemTitle"
      );
    }

    // Get all posts for this problem and their tags
    const posts = await prisma.post.findMany({
      where: {
        problemId: problem.id,
        isDraftPost: false,
      },
      select: {
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    // Combine and deduplicate all tags
    const allTagsSet = new Set(problem.tags || []);

    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        allTagsSet.add(tag.name);
      });
    });

    const combinedTags = Array.from(allTagsSet);

    res.status(200).json({
      success: true,
      message: "Combined tags fetched successfully",
      data: combinedTags,
    });
  } catch (error) {
    next(error);
  }
};

// Post Reaction Controller
export const postReaction = async (req, res, next) => {
  const { postId } = req.query;
  const { action } = req.body;
  const userId = req.user.id || req.user.userId;

  if (!postId || typeof postId !== "string") {
    return res
      .status(400)
      .json({ message: "Post ID is required as a query parameter" });
  }
  if (!action || (action !== "like" && action !== "dislike")) {
    return res
      .status(400)
      .json({ message: "Action must be either 'like' or 'dislike'" });
  }
  if (!userId) {
    return res
      .status(401)
      .json({ message: "User ID not found in token payload" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      select: { id: true },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    const [currentLikes, currentDislikes] = await prisma.$transaction([
      prisma.postReaction.count({
        where: { postId: post.id, type: "like" },
      }),
      prisma.postReaction.count({
        where: { postId: post.id, type: "dislike" },
      }),
    ]);

    const existingReaction = await prisma.postReaction.findUnique({
      where: { userId_postId: { userId, postId: post.id } },
    });

    let responsePayload: {
      message: string;
      likes: number;
      dislikes: number;
    };

    if (!existingReaction) {
      await prisma.postReaction.create({
        data: { userId, postId: post.id, type: action },
      });
      responsePayload = {
        message: `${action === "like" ? "Like" : "Dislike"} added successfully`,
        likes: action === "like" ? currentLikes + 1 : currentLikes,
        dislikes: action === "dislike" ? currentDislikes + 1 : currentDislikes,
      };
    } else if (existingReaction.type === action) {
      await prisma.postReaction.delete({
        where: { userId_postId: { userId, postId: post.id } },
      });
      responsePayload = {
        message: `${action === "like" ? "Like" : "Dislike"} removed successfully`,
        likes: action === "like" ? currentLikes - 1 : currentLikes,
        dislikes: action === "dislike" ? currentDislikes - 1 : currentDislikes,
      };
    } else {
      await prisma.postReaction.update({
        where: { userId_postId: { userId, postId: post.id } },
        data: { type: action },
      });
      const newLikes =
        existingReaction.type === "like" ? currentLikes - 1 : currentLikes + 1;
      const newDislikes =
        existingReaction.type === "dislike"
          ? currentDislikes - 1
          : currentDislikes + 1;
      responsePayload = {
        message: `Changed from ${existingReaction.type} to ${action}`,
        likes: newLikes,
        dislikes: newDislikes,
      };
    }

    // ── Emit real-time update to all OTHER clients in this post's room ──
    // We use `to()` (not `emit()`) so the sender doesn't receive their own
    // event — their UI is already updated by the optimistic update.
    try {
      getIO().to(`post:${post.id}`).emit("post:reaction:updated", {
        postId: post.id,
        likes: responsePayload.likes,
        dislikes: responsePayload.dislikes,
      });
    } catch (socketErr) {
      // Non-fatal — socket may not be initialized in test environments
      logger.warn("Socket emit failed for post reaction:", socketErr);
    }

    try {
      if (req.cache) {
        await req.cache.invalidateByTags([`post:${post.id}:reactions`]);
      }
    } catch (cacheErr) {
      logger.error("Cache invalidation error in postReaction", cacheErr);
    }
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Post reaction error:", error);
    return res
      .status(500)
      .json({ message: "Server error processing reaction" });
  }
};

export const getPostReactions = async (req, res, next) => {
  const { postId } = req.query;

  // Extract user ID from the JWT payload
  const userId = req.user?.id || req.user?.userId;

  if (!postId || typeof postId !== "string") {
    return res
      .status(400)
      .json({ message: "Post ID is required as a query parameter" });
  }

  try {
    // Find the post by ID
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      select: { id: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get current likes and dislikes counts
    const [likes, dislikes] = await prisma.$transaction([
      prisma.postReaction.count({
        where: {
          postId: post.id,
          type: "like",
        },
      }),
      prisma.postReaction.count({
        where: {
          postId: post.id,
          type: "dislike",
        },
      }),
    ]);

    // Get user's current reaction if authenticated
    let userReaction = null;
    if (userId) {
      const reaction = await prisma.postReaction.findUnique({
        where: {
          userId_postId: {
            userId: userId,
            postId: post.id,
          },
        },
        select: {
          type: true,
        },
      });

      if (reaction) {
        userReaction = reaction.type;
      }
    }

    return res.status(200).json({
      likes,
      dislikes,
      userReaction,
    });
  } catch (error) {
    console.error("Error fetching post reactions:", error);
    return res.status(500).json({
      message: "Server error while fetching reactions",
    });
  }
};

export const manageDraftPost = async (req, res, next) => {
  const { id, title } = req.body;
  const { action } = req.query;
  const userId = req.user?.id || req.user?.userId;

  if (!userId) {
    throw createHttpError.Unauthorized("User not authenticated");
  }

  if (!id) {
    throw createHttpError.BadRequest("Please provide draft post id");
  }

  if (!action || !["rename", "post", "delete"].includes(action)) {
    throw createHttpError.BadRequest(
      "Please provide a valid action: rename, post, or delete"
    );
  }

  try {
    // Verify the draft post exists and belongs to the user
    const draftPost = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
        authorId: userId,
        isDraftPost: true,
      },
    });

    if (!draftPost) {
      throw createHttpError.NotFound(
        "Draft post not found or you don't have permission to modify it"
      );
    }

    let result;
    let message;

    switch (action) {
      case "rename":
        if (!title || title.trim() === "") {
          throw createHttpError.BadRequest(
            "Please provide a title for renaming"
          );
        }

        result = await prisma.post.update({
          where: { id: parseInt(id) },
          data: { title: title.trim() },
          select: {
            id: true,
            title: true,
          },
        });

        message = "Draft post renamed successfully";
        break;

      case "post":
        result = await prisma.post.update({
          where: { id: parseInt(id) },
          data: { isDraftPost: false },
          select: {
            id: true,
            title: true,
            isDraftPost: true,
          },
        });

        message = "Draft post published successfully";
        break;

      case "delete":
        result = await prisma.post.delete({
          where: { id: parseInt(id) },
          select: {
            id: true,
            title: true,
          },
        });

        message = "Draft post deleted successfully";
        break;
    }

    try {
      if (req.cache) {
        await req.cache.invalidateByTags([
          "posts:drafts",
          `post:${parseInt(id)}`,
          "posts",
        ]);
      }
    } catch (cacheErr) {
      logger.error("Cache invalidation error in manageDraftPost", cacheErr);
    }
    res.status(200).json({ success: true, message: message, data: result });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (req, res, next) => {
  const { id } = req.query;
  const userId = req.user?.id || req.user?.userId;

  if (!id) {
    throw createHttpError.BadRequest("Please provide post id");
  }

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: parseInt(id),
        isDraftPost: false, // Only fetch non-draft posts
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            picture: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        postReactions: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    });

    if (!post) {
      throw createHttpError.NotFound("Post not found");
    }

    // Calculate likes and dislikes
    const likes = post.postReactions.filter((r) => r.type === "like").length;
    const dislikes = post.postReactions.filter(
      (r) => r.type === "dislike"
    ).length;

    // Get user's reaction if authenticated
    let userReaction = null;
    if (userId) {
      const reaction = post.postReactions.find((r) => r.userId === userId);
      userReaction = reaction ? reaction.type.toLowerCase() : null;
    }

    // Format the response
    const responseData = {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      tags: post.tags.map((tag) => tag.name),
      likes,
      dislikes,
      userReaction,
    };

    res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

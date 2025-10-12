import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import { getLatestSubmissionByUserId } from "../services/postService.js";
import { getPostTemplate } from "../utils/postBaseFormat.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import logger from "../configs/loggerConfig.js";
import {
  addTagToCloudinary,
  validateTagUsingAI,
} from "../services/postTagsService.js";
import { boolean } from "zod";

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
    const userId = req.user.id || req.user.userId;

    if (!userId) {
      throw createHttpError.Unauthorized("User not authenticated");
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

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: newPost,
    });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (req, res, next) => {
  const { problemTitle } = req.query;

  if (!problemTitle) {
    throw createHttpError.BadRequest("Please provide problem title");
  }

  const userId = req.user?.id || req.user?.userId;

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
      where: { problemId: problem.id, isDraftPost: false },
      select: {
        id: true,
        title: true,
        tags: {
          select: {
            name: true,
          },
        },
        author: {
          select: {
            name: true,
            picture: true,
          },
        },
        postReactions: {
          select: {
            type: true,
            userId: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Transform data to count likes and dislikes, and include user's reaction
    const transformedData = postData.map((post) => {
      const likes = post.postReactions.filter(
        (reaction) => reaction.type === "like"
      ).length;
      const dislikes = post.postReactions.filter(
        (reaction) => reaction.type === "dislike"
      ).length;

      // Find user's reaction if authenticated
      let userReaction = null;
      if (userId) {
        const userReactionData = post.postReactions.find(
          (reaction) => reaction.userId === userId
        );
        if (userReactionData) {
          userReaction = userReactionData.type;
        }
      }

      return {
        id: post.id,
        title: post.title,
        tags: post.tags,
        author: post.author,
        likes: likes,
        dislikes: dislikes,
        comments: post._count.comments,
        userReaction: userReaction,
      };
    });

    res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: transformedData,
    });
  } catch (error) {
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

// Post Reaction Controller
export const postReaction = async (req, res, next) => {
  const { postId } = req.query; // Get the postId from the query parameters
  const { action } = req.body; // 'like' or 'dislike'

  // Extract user ID from the JWT payload
  const userId = req.user.id || req.user.userId;

  // Validate inputs
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
    // Find the post by ID
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      select: { id: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Calculate current likes and dislikes directly from PostReaction
    const [currentLikes, currentDislikes] = await prisma.$transaction([
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

    // Check if the user has already reacted to this post
    const existingReaction = await prisma.postReaction.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: post.id,
        },
      },
    });

    // Handle different scenarios based on existing reaction and new action
    if (!existingReaction) {
      // Case 1: No previous reaction, add new reaction
      await prisma.postReaction.create({
        data: {
          userId: userId,
          postId: post.id,
          type: action === "like" ? "like" : "dislike",
        },
      });

      return res.status(200).json({
        message: `${action === "like" ? "Like" : "Dislike"} added successfully`,
        likes: action === "like" ? currentLikes + 1 : currentLikes,
        dislikes: action === "dislike" ? currentDislikes + 1 : currentDislikes,
      });
    } else if (
      existingReaction.type === (action === "like" ? "like" : "dislike")
    ) {
      // Case 2: User clicked the same reaction again, remove it
      await prisma.postReaction.delete({
        where: {
          userId_postId: {
            userId: userId,
            postId: post.id,
          },
        },
      });

      return res.status(200).json({
        message: `${
          action === "like" ? "Like" : "Dislike"
        } removed successfully`,
        likes: action === "like" ? currentLikes - 1 : currentLikes,
        dislikes: action === "dislike" ? currentDislikes - 1 : currentDislikes,
      });
    } else {
      // Case 3: User had opposite reaction before, switch reaction
      await prisma.postReaction.update({
        where: {
          userId_postId: {
            userId: userId,
            postId: post.id,
          },
        },
        data: {
          type: action === "like" ? "like" : "dislike",
        },
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
      });
    }
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

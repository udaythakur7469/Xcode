import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import { getLatestSubmissionByUserId } from "../services/postService.js";
import { getPostTemplate } from "../utils/postBaseFormat.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import logger from "../configs/loggerConfig.js";
import { addTagToCloudinary, validateTagUsingAI, } from "../services/postTagsService.js";
// Load environment variables
dotenv.config();
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
export const fetchCommentTagsFromS3 = (req, res, next) => { };
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
        const result = await cloudinary.uploader.upload(`data:application/json;base64,${base64Tags}`, {
            public_id: "post-tags",
            resource_type: "raw",
            overwrite: true,
        });
        res.status(200).json({
            success: true,
            message: "Tags uploaded to Cloudinary successfully",
            data: {
                url: result.secure_url,
                public_id: result.public_id,
            },
        });
    }
    catch (error) {
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
    }
    catch (error) {
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
        if (!tag ||
            !action ||
            typeof tag !== "string" ||
            typeof action !== "string") {
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
            }
            else {
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
            await addTagToCloudinary(tag);
            return res.status(200).json({
                success: true,
                message: "tag added successfully",
                data: {
                    tag: tag,
                    valid: true,
                    added: true,
                },
            });
        }
    }
    catch (error) {
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
        const latestSubmission = await getLatestSubmissionByUserId(userId, problem.id);
        const formattedPost = getPostTemplate(latestSubmission.code, latestSubmission.language);
        res.status(200).json({
            message: "base post format generated successfully",
            data: formattedPost,
        });
    }
    catch (error) {
        next(error);
    }
};

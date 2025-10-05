import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import createHttpError from "http-errors";
import logger from "../configs/loggerConfig.js";

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const validateTagUsingAI = async (tag) => {
  if (!tag || typeof tag !== "string") {
    throw createHttpError.BadRequest("tag is not a string");
  }

  try {
    const { text: validation } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `
        You are an AI validator that checks whether a given tag is valid for a LeetCode-style problem or programming discussion post.

        ### Input
        Tag: "${tag}"

        ### Validation Rules
        1. Tag must be related to programming, computer science, technical interviews, or behavioral/leadership topics.
        2. Tag must represent **a single concept only** (e.g., "array", not "array/stack").
        3. Allowed characters: letters (a-z, A-Z), numbers (0-9), spaces, hyphens (-), and underscores (_).
        4. Hyphens and underscores cannot appear at the start or end, and cannot repeat consecutively.
        5. Tag must have at least **2 letters**.
        6. Maximum length: **30 characters**.
        7. Allowed extra symbols: "+" and "#" (for programming languages like "C++" or "C#").
        8. Tag must not contain any offensive, malicious, or unsafe content.
        9. Random, meaningless, or gibberish tags are invalid.
        10. Tags with only digits are invalid, unless they form part of a meaningful tag (e.g., "2d-array").

        ### Output Instructions
        Respond with one of the following formats **only**:
        - If valid:  
          VALID
          
        - If invalid:  
          INVALID: <reason>

        Optionally, if a small correction can make it valid, also include:  
        **Suggested tag: <replacement>**

        ### Valid reasons (choose one only):
        - "This tag contains multiple concepts. Use a single concept."
        - "This tag is not relevant to the current post."
        - "The tag must contain at least 2 letters."
        - "The tag contains invalid characters."
        - "The tag contains offensive, malicious, or unsafe content."
        - "Please provide a meaningful tag."
        - "The tag must not exceed 30 characters."

        Return only the formatted response. Do not include explanations or markdown.
      `,
    });

    console.log("Tag validation:", validation.trim());
    return validation.trim();
  } catch (error) {
    logger.error("error in validating tag using AI", error);
    throw createHttpError.BadRequest("error in validating tag using AI");
  }
};

export const addTagToCloudinary = async (newTag) => {
  try {
    if (!newTag || typeof newTag !== "string") {
      throw new Error("A single tag string is required");
    }

    // First, fetch existing tags from Cloudinary
    let existingTags = [];
    try {
      const tagsUrl = cloudinary.url("post-tags", {
        resource_type: "raw",
      });
      const response = await fetch(tagsUrl);

      if (response.ok) {
        const tagsJson = await response.text();
        existingTags = JSON.parse(tagsJson);
      } else {
        // If Cloudinary file doesn't exist, use default tags
        existingTags = require("../../data/postTags");
      }
    } catch (fetchError) {
      // If fetch fails, use default tags
      existingTags = require("../../data/postTags");
    }

    // Check if tag already exists (case insensitive)
    const normalizedNewTag = newTag.toLowerCase().trim();
    const exists = existingTags.some(
      (existingTag) => existingTag.toLowerCase().trim() === normalizedNewTag
    );

    let addedTag = null;
    let isDuplicate = false;
    let combinedTags;

    if (!exists) {
      // Add the new tag
      combinedTags = [...existingTags, newTag.trim()];
      addedTag = newTag.trim();

      // Sort tags alphabetically (case insensitive)
      combinedTags.sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase())
      );

      // Upload updated tags back to Cloudinary
      const tagsJson = JSON.stringify(combinedTags, null, 2);
      const base64Tags = Buffer.from(tagsJson).toString("base64");

      const result = await cloudinary.uploader.upload(
        `data:application/json;base64,${base64Tags}`,
        {
          public_id: "post-tags",
          resource_type: "raw",
          overwrite: true,
        }
      );

      return {
        success: true,
        message: "Tag added successfully",
        data: {
          addedTag,
          isDuplicate: false,
          totalTags: combinedTags.length,
          url: result.secure_url,
        },
      };
    } else {
      // Tag already exists
      return {
        success: true,
        message: "Tag already exists",
        data: {
          addedTag: null,
          isDuplicate: true,
          totalTags: existingTags.length,
          url: null,
        },
      };
    }
  } catch (error) {
    console.error("Error adding tag to Cloudinary:", error);
    throw new Error(`Failed to add tag: ${error.message}`);
  }
};

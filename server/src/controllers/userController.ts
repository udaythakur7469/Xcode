import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";
import { Readable } from "stream";
import cloudinary from "../services/uploadService.js";

export const authenticatedUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get basic user data with links
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        links: true,
        stats: true, // Include user stats if they exist
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    // Get solved problems data for languages, tags, and difficulties
    const solvedProblems = await prisma.solvedProblems.findMany({
      where: { userId },
      include: {
        problem: {
          select: {
            tags: true,
            difficulty: true,
          },
        },
        user: {
          include: {
            submissions: {
              where: {
                status: "accepted",
                problemId: {
                  in: await prisma.solvedProblems
                    .findMany({
                      where: { userId },
                      select: { problemId: true },
                    })
                    .then((results) => results.map((r) => r.problemId)),
                },
              },
              select: {
                language: true,
                problemId: true,
              },
              distinct: ["problemId", "language"],
            },
          },
        },
      },
    });

    // Process languages
    const allLanguages = solvedProblems.flatMap((sp) =>
      sp.user.submissions.map((sub) => sub.language),
    );
    const languageFrequency = allLanguages.reduce((acc, lang) => {
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    // Process tags
    const allTags = solvedProblems.flatMap((sp) => sp.problem.tags);
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    // Process difficulties
    const difficultyCounts = solvedProblems.reduce(
      (acc, sp) => {
        acc.totalSolved++;
        switch (sp.problem.difficulty) {
          case "easy":
            acc.easySolved++;
            break;
          case "medium":
            acc.mediumSolved++;
            break;
          case "hard":
            acc.hardSolved++;
            break;
        }
        return acc;
      },
      { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 },
    );

    // Format the links
    const formattedLinks = user.links.reduce(
      (acc, link) => {
        if (link.key && link.value) {
          acc[link.key] = link.value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    // Destructure the user object
    const { links, refreshToken, password, ...userData } = user;

    res.status(200).json({
      success: true,
      user: {
        ...userData,
        institution: userData.institution || null,
        links: Object.keys(formattedLinks).length > 0 ? formattedLinks : null,
        stats: {
          ...difficultyCounts, // Include the difficulty counts
          languages: Object.entries(languageFrequency).map(
            ([language, count]) => ({
              language,
              count,
            }),
          ),
          tags: Object.entries(tagFrequency).map(([tag, count]) => ({
            tag,
            count,
          })),
        },
      },
    });
  } catch (error) {
    logger.error("Error in authenticatedUser controller ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId; 

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Get current user to potentially delete old image
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { picture: true },
    });

    // Upload to Cloudinary
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "profile_pictures",
          resource_type: "image",
          transformation: [
            { width: 500, height: 500, crop: "fill", gravity: "face" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = Readable.from(req.file.buffer);
      bufferStream.pipe(uploadStream);
    });

    // Optional: Delete old image from Cloudinary if it exists and is not the default
    if (
      currentUser?.picture &&
      !currentUser.picture.includes("encrypted-tbn0")
    ) {
      try {
        // Extract public_id from the old Cloudinary URL
        const urlParts = currentUser.picture.split("/");
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `profile_pictures/${publicIdWithExtension.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error("Error deleting old image:", deleteError);
        // Don't fail the request if old image deletion fails
      }
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { picture: uploadResult.secure_url },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        description: true,
        institution: true,
        links: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: updatedUser,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload profile picture",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { description, links, institution } = req.body;

    const updateData: Record<string, any> = {};

    if (description !== undefined) updateData.description = description;
    if (links !== undefined) updateData.links = links;
    if (institution !== undefined) updateData.institution = institution;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        description: true,
        institution: true,
        links: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const getUserSolvedLanguages = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // Get all submissions for solved problems by this user
    const solvedSubmissions = await prisma.submission.findMany({
      where: {
        userId: userId,
        status: "accepted",
        problem: {
          solvedProblems: {
            some: {
              userId: userId,
            },
          },
        },
      },
      select: {
        language: true,
        problemId: true,
      },
      distinct: ["problemId", "language"], // Get unique language per problem
    });

    // Count occurrences of each language
    const languageCounts = solvedSubmissions.reduce(
      (acc, submission) => {
        acc[submission.language] = (acc[submission.language] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Format the response
    const languages = Object.entries(languageCounts).map(
      ([language, count]) => ({
        language,
        count,
      }),
    );

    res.status(200).json({
      success: true,
      languages,
    });
  } catch (error) {
    console.error("Error fetching user solved languages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user solved languages",
    });
  }
};

export const getUserHeatmapData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all accepted submissions with their creation dates
    // This captures all dates when problems were solved, not just the latest date
    const acceptedSubmissions = await prisma.submission.findMany({
      where: {
        userId,
        status: "accepted",
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by UTC day
    const dailyCounts: Record<string, number> = {};
    acceptedSubmissions.forEach(({ createdAt }) => {
      const year = createdAt.getUTCFullYear();
      const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
      const day = String(createdAt.getUTCDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      heatmapData: dailyCounts,
    });
  } catch (error) {
    logger.error("Error fetching heatmap data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch heatmap data",
    });
  }
};

import createHttpError from "http-errors";
import prisma from "../configs/db.js";
import logger from "../configs/loggerConfig.js";

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
      sp.user.submissions.map((sub) => sub.language)
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
      { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 }
    );

    // Format the links
    const formattedLinks = user.links.reduce((acc, link) => {
      if (link.key && link.value) {
        acc[link.key] = link.value;
      }
      return acc;
    }, {} as Record<string, string>);

    // Destructure the user object
    const { links, ...userData } = user;

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
            })
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

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { description, links, institution } = req.body;

    // Update description if provided
    if (description !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { description },
      });
    }

    // Update institution if provided
    if (institution !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { institution },
      });
    }

    // Update links if provided
    if (links !== undefined) {
      // Get existing links for the user
      const existingLinks = await prisma.userLink.findMany({
        where: { userId },
      });

      // Process each link in the request
      for (const [key, value] of Object.entries(links)) {
        const existingLink = existingLinks.find((link) => link.key === key);

        if (existingLink) {
          // Update existing link if value changed
          if (existingLink.value !== value) {
            await prisma.userLink.update({
              where: { id: existingLink.id },
              data: { value: value as string },
            });
          }
        } else {
          // Create new link if it doesn't exist
          await prisma.userLink.create({
            data: {
              key,
              value: value as string,
              userId,
            },
          });
        }
      }
    }

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
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
    const languageCounts = solvedSubmissions.reduce((acc, submission) => {
      acc[submission.language] = (acc[submission.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Format the response
    const languages = Object.entries(languageCounts).map(
      ([language, count]) => ({
        language,
        count,
      })
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

    // Get all solved problems with their dates
    const solvedProblems = await prisma.solvedProblems.findMany({
      where: { userId },
      select: {
        solvedAt: true,
      },
      orderBy: {
        solvedAt: "asc",
      },
    });

    // Group by day
    const dailyCounts: Record<string, number> = {};
    solvedProblems.forEach(({ solvedAt }) => {
      const dateStr = solvedAt.toISOString().split("T")[0]; // YYYY-MM-DD
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      heatmapData: dailyCounts,
    });
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch heatmap data",
    });
  }
};

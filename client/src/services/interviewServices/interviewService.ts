import {
  interviewCovers,
  mappings,
} from "@/components/interviewPage/interviewPageData/data";

const techIconBaseURL =
  "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings] || tech.toLowerCase();
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

export const getTechLogos = async (
  techArray: string[]
): Promise<{ tech: string; url: string }[]> => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    if (tech === "AWS" || tech === "Amazonwebservices" || tech === "aws") {
      return {
        tech,
        url: `${techIconBaseURL}/${normalized}/${normalized}-original-wordmark.svg`,
      };
    } else {
      return {
        tech,
        url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
      };
    }
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url))
        ? url
        : "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/atom/atom-original.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/logos${interviewCovers[randomIndex]}`;
};

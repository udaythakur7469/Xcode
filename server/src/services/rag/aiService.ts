import logger from "../../configs/loggerConfig.js";


export const generateAIResponse = async (message: string) => {
  logger.info("AI generation started");

  // ⏳ Simulate 10 seconds delay
  await new Promise((resolve) => setTimeout(resolve, 10000));

  logger.info("AI generation finished");

  return "AI message";
};

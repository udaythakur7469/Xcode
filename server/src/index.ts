import dotenv from "dotenv";
dotenv.config();

import type { Server } from "http";

const { default: http } = await import("http");
const { default: app } = await import("./app.js");
const { default: logger } = await import("./configs/loggerConfig.js");
const { initSocket } = await import("./configs/socketConfig.js");
const { scheduleContestSchedulerJob } =
  await import("./queues/contestSchedulerQueue.js");

const PORT = process.env.PORT || 8000;

const httpServer = http.createServer(app);

initSocket(httpServer);

scheduleContestSchedulerJob().catch((err) =>
  logger.error("Failed to register contest scheduler job:", err),
);

let server: Server;

server = httpServer.listen(PORT, () => {
  logger.info(`server listening at port ${PORT}`);
});

//handle server errors
const exitHandler = () => {
  if (server) {
    logger.info("Server closed.");
    process.exit(1);
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};
process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

//SIGTERM
process.on("SIGTERM", () => {
  if (server) {
    logger.info("Server closed.");
    process.exit(1);
  }
});

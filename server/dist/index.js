import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import logger from "./configs/loggerConfig.js";
import { initSocket } from "./configs/socketConfig.js";
dotenv.config();
const PORT = process.env.PORT || 8000;
const httpServer = http.createServer(app);
initSocket(httpServer);
let server;
server = httpServer.listen(PORT, () => {
    logger.info(`server listening at port ${PORT}`);
});
//handle server errors
const exitHandler = () => {
    if (server) {
        logger.info("Server closed.");
        process.exit(1);
    }
    else {
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

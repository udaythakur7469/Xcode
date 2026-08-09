import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import cookie from "cookie";
import {
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/tokenAndCookie.js";
import logger from "./loggerConfig.js";

// ── Singleton socket server instance ──────────────────────────────────────
// Exported so controllers can emit events without importing the full server.
let io: SocketServer;

export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io has not been initialized yet");
  return io;
};

// ── Auth middleware for socket handshake ──────────────────────────────────
// Mirrors the logic in authMiddleware.ts — reads cookies from the handshake
// headers and verifies the access token (or falls back to refresh token).
// Unauthenticated connections are still allowed but socket.data.userId = null,
// so they can receive broadcast events but cannot emit reactions.
const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const rawCookies = socket.handshake.headers.cookie || "";
    const parsedCookies = cookie.parse(rawCookies);

    const accessToken = parsedCookies.accessToken;
    const refreshToken = parsedCookies.refreshToken;

    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload) {
        socket.data.userId = payload.userId;
        return next();
      }
    }

    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload) {
        socket.data.userId = payload.userId;
        return next();
      }
    }

    // Allow unauthenticated — they can still receive live count updates
    socket.data.userId = null;
    return next();
  } catch (err) {
    logger.warn("Socket auth error — allowing as unauthenticated");
    socket.data.userId = null;
    return next();
  }
};

// ── Room event handlers ────────────────────────────────────────────────────
const registerRoomHandlers = (socket: Socket) => {
  // ── Problem room ──────────────────────────────────────────────────────
  // Client emits this when the problem detail page mounts.
  socket.on("problem:join", (problemId: string | number) => {
    const room = `problem:${problemId}`;
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room ${room}`);
  });

  // Client emits this on unmount / navigation away.
  socket.on("problem:leave", (problemId: string | number) => {
    const room = `problem:${problemId}`;
    socket.leave(room);
    logger.info(`Socket ${socket.id} left room ${room}`);
  });

  // ── Post room ─────────────────────────────────────────────────────────
  // Client emits this when the discussion / post list mounts.
  socket.on("post:join", (postId: string | number) => {
    const room = `post:${postId}`;
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on("post:leave", (postId: string | number) => {
    const room = `post:${postId}`;
    socket.leave(room);
    logger.info(`Socket ${socket.id} left room ${room}`);
  });

  socket.on("contest:join", (contestId: string | number) => {
    const room = `contest:${contestId}`;
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on("contest:leave", (contestId: string | number) => {
    const room = `contest:${contestId}`;
    socket.leave(room);
    logger.info(`Socket ${socket.id} left room ${room}`);
  });

  socket.on("disconnect", () => {
    logger.info(`Socket ${socket.id} disconnected`);
  });
};

// ── Initialize Socket.io ───────────────────────────────────────────────────
export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
    // Use websocket first, fall back to long-polling
    transports: ["websocket", "polling"],
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    logger.info(
      `Socket connected: ${socket.id} | userId: ${socket.data.userId ?? "guest"}`,
    );
    registerRoomHandlers(socket);
  });

  logger.info("Socket.io initialized");
  return io;
};

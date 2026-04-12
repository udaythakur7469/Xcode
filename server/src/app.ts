import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import routes from "./routes/mergedRoutes.js";

interface CustomError extends Error {
  status?: number;
  message: string;
}

dotenv.config();

const app: Application = express();

//initializing morgan
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(helmet());

//gzip compression
app.use(compression());

//enable cookie parser
app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use("/api", routes);

// Error handling middleware
app.use((err: CustomError, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    error: {
      status: err.status || 500,
      message: err.message || "Internal Server Error",
    },
  });
});

export default app;
